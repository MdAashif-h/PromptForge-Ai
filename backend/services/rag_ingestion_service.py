"""8-Stage Enterprise Ingestion Pipeline Service for PromptForge AI Knowledge Base."""

import os
import uuid
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from database.models import DocumentModel, DocumentChunkModel
from services.document_loaders import DocumentLoaderFactory, TextNormalizer
from services.chunking_strategies import ChunkingStrategyFactory
from services.ai_service import ai_service
from services.storage_service import storage_service
from chromadb_store.client import add_knowledge_chunks
from config import CHUNK_SIZE, CHUNK_OVERLAP, DEFAULT_CHUNK_STRATEGY, EMBEDDING_MODEL


class RAGIngestionPipeline:
    """Modular 9-stage document ingestion engine supporting Supabase Storage & Database persistence."""

    STAGES = [
        "Validate File",
        "Upload to Supabase Storage",
        "Extract Text",
        "Clean & Normalize Text",
        "Chunk Document",
        "Generate Embeddings",
        "Generate Metadata",
        "Store Metadata in Database (Supabase / SQLite Fallback)",
        "Store Embeddings in ChromaDB",
    ]

    def __init__(self, db: Session):
        self.db = db

    def process_file(
        self,
        filename: str,
        file_bytes: bytes,
        chunk_strategy: str = DEFAULT_CHUNK_STRATEGY,
        chunk_size: int = CHUNK_SIZE,
        chunk_overlap: int = CHUNK_OVERLAP,
        workspace_id: str = "ws_default",
        project_id: str = "proj_default",
    ) -> dict:
        """Run the complete ingestion pipeline: Upload -> Supabase Storage -> Extract -> Chunk -> Embed -> ChromaDB -> Metadata -> Supabase DB."""
        doc_id = str(uuid.uuid4())
        logs = []

        def log_stage(stage_num: int, stage_name: str, detail: str = ""):
            logs.append({
                "stage": stage_num,
                "name": stage_name,
                "detail": detail,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

        # STAGE 1: Validate File
        log_stage(1, "Validate File", f"Validating '{filename}' ({len(file_bytes)} bytes)")
        if not file_bytes or len(file_bytes) == 0:
            raise ValueError(f"File '{filename}' is empty.")

        ext = os.path.splitext(filename)[1].lower()
        if ext not in DocumentLoaderFactory.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file extension '{ext}'.")

        # Maximum file size check (50MB)
        if len(file_bytes) > 50 * 1024 * 1024:
            raise ValueError(f"File size exceeds 50MB limit.")

        # STAGE 2: Upload to Supabase Storage
        log_stage(2, "Upload to Supabase Storage", f"Storing raw file '{filename}' in bucket 'documents'")
        storage_path, storage_url = storage_service.upload_file(filename, file_bytes, doc_id)

        # STAGE 3: Extract Text
        log_stage(3, "Extract Text", f"Using DocumentLoaderFactory for '{ext}'")
        pages = DocumentLoaderFactory.get_loader(filename, file_bytes)
        page_count = len(pages)

        # STAGE 4: Clean & Normalize Text
        log_stage(4, "Clean & Normalize Text", f"Normalizing content across {page_count} pages")
        full_text_list = []
        for p in pages:
            p["content"] = TextNormalizer.clean(p["content"])
            full_text_list.append(p["content"])

        combined_text = "\n".join(full_text_list)
        stats = TextNormalizer.get_stats(combined_text)

        # STAGE 5: Chunk Document
        log_stage(5, "Chunk Document", f"Splitting using strategy '{chunk_strategy}' (size: {chunk_size}, overlap: {chunk_overlap})")
        chunks = ChunkingStrategyFactory.chunk_pages(
            pages=pages,
            strategy=chunk_strategy,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        if not chunks:
            chunks = [{
                "chunk_index": 0,
                "page_number": 1,
                "content": combined_text or "Empty document",
                "token_count": max(1, len(combined_text) // 4),
                "strategy": chunk_strategy,
            }]

        # STAGE 6: Generate Embeddings
        log_stage(6, "Generate Embeddings", f"Generating embeddings for {len(chunks)} chunks via '{EMBEDDING_MODEL}'")
        chunk_embeddings = []
        for chunk in chunks:
            emb = ai_service.generate_embedding(chunk["content"])
            chunk_embeddings.append(emb)

        # STAGE 7: Generate Metadata
        log_stage(7, "Generate Metadata", "Compiling rich document & chunk metadata")
        doc_metadata = {
            "id": doc_id,
            "filename": filename,
            "file_type": ext,
            "file_size": len(file_bytes),
            "storage_path": storage_path,
            "storage_url": storage_url,
            "version": "1.0",
            "language": "en",
            "author": "User",
            "page_count": page_count,
            "word_count": stats["word_count"],
            "char_count": stats["char_count"],
            "chunk_count": len(chunks),
            "embedding_model": EMBEDDING_MODEL,
            "chunk_strategy": chunk_strategy,
            "status": "ready",
        }

        # STAGE 8: Store Metadata in Database (Supabase / SQLite Fallback)
        log_stage(8, "Store Metadata in Database", "Saving document & chunk records to relational DB (Supabase / SQLite)")
        doc_record = DocumentModel(
            id=doc_id,
            workspace_id=workspace_id,
            project_id=project_id,
            filename=filename,
            file_type=ext,
            file_size=len(file_bytes),
            version="1.0",
            language="en",
            author="User",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            page_count=page_count,
            word_count=stats["word_count"],
            char_count=stats["char_count"],
            chunk_count=len(chunks),
            embedding_model=EMBEDDING_MODEL,
            chunk_strategy=chunk_strategy,
            status="ready",
            tags_json=json.dumps([ext.replace(".", ""), chunk_strategy.lower()]),
        )
        self.db.add(doc_record)

        db_chunks = []
        chroma_chunk_ids = []
        chroma_documents = []
        chroma_metadatas = []

        for idx, (chunk, emb) in enumerate(zip(chunks, chunk_embeddings)):
            chunk_id = f"{doc_id}_chunk_{idx}"
            chunk_record = DocumentChunkModel(
                id=chunk_id,
                document_id=doc_id,
                chunk_index=chunk["chunk_index"],
                page_number=chunk["page_number"],
                content=chunk["content"],
                token_count=chunk["token_count"],
                start_char=0,
                end_char=len(chunk["content"]),
                metadata_json=json.dumps({
                    "filename": filename,
                    "workspace_id": workspace_id,
                    "project_id": project_id,
                    "page_number": chunk["page_number"],
                    "token_count": chunk["token_count"],
                    "strategy": chunk_strategy,
                    "storage_path": storage_path,
                }),
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(chunk_record)
            db_chunks.append(chunk_record)

            chroma_chunk_ids.append(chunk_id)
            chroma_documents.append(chunk["content"])
            chroma_metadatas.append({
                "document_id": doc_id,
                "workspace_id": workspace_id,
                "project_id": project_id,
                "filename": filename,
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
                "token_count": chunk["token_count"],
                "strategy": chunk_strategy,
            })

        self.db.commit()
        self.db.refresh(doc_record)

        # STAGE 9: Store Embeddings in ChromaDB
        log_stage(9, "Store Embeddings in ChromaDB", f"Indexing {len(chroma_chunk_ids)} vector embeddings in persistent store")
        add_knowledge_chunks(
            chunk_ids=chroma_chunk_ids,
            embeddings=chunk_embeddings,
            documents=chroma_documents,
            metadatas=chroma_metadatas,
        )

        return {
            "document": doc_metadata,
            "pipeline_logs": logs,
            "status": "ready",
        }

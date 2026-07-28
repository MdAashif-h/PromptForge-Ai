"""FastAPI router for Enterprise Knowledge Workspace (RAG) operations."""

import json
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database.database import get_db
from database.models import DocumentModel, DocumentChunkModel
from services.rag_ingestion_service import RAGIngestionPipeline
from services.rag_retrieval_service import RAGRetrievalEngine
from chromadb_store.client import delete_knowledge_document
from config import TOP_K, SIMILARITY_THRESHOLD, DEFAULT_CHUNK_STRATEGY, LLM_MODEL

router = APIRouter(prefix="/api/rag", tags=["knowledge_base_rag"])


class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question for the knowledge base")
    top_k: int = Field(default=TOP_K, ge=1, le=20)
    similarity_threshold: float = Field(default=SIMILARITY_THRESHOLD, ge=0.0, le=1.0)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    model: str = Field(default=LLM_MODEL)
    chunk_strategy: str = Field(default=DEFAULT_CHUNK_STRATEGY)
    scope: str = Field(default="all", description="Retrieval scope: all | current | selected")
    document_ids: list[str] = Field(default=[], description="List of target document IDs if scope is current or selected")
    workspace_id: str = Field(default="ws_default", description="Workspace ID scope filter")
    project_id: str = Field(default="proj_default", description="Project ID scope filter")


def _doc_to_dict(doc: DocumentModel) -> dict:
    tags = []
    if doc.tags_json:
        try:
            tags = json.loads(str(doc.tags_json))
        except Exception:
            tags = []

    return {
        "id": doc.id,
        "workspace_id": getattr(doc, "workspace_id", "ws_default"),
        "project_id": getattr(doc, "project_id", "proj_default"),
        "filename": doc.filename,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "version": doc.version or "1.0",
        "language": doc.language or "en",
        "author": doc.author or "User",
        "created_at": doc.created_at.isoformat() if doc.created_at else "",
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else "",
        "page_count": doc.page_count or 1,
        "word_count": doc.word_count or 0,
        "char_count": doc.char_count or 0,
        "chunk_count": doc.chunk_count or 0,
        "embedding_model": doc.embedding_model or "text-embedding-3-small",
        "chunk_strategy": doc.chunk_strategy or "Recursive",
        "status": doc.status or "ready",
        "error_message": doc.error_message or "",
        "tags": tags,
    }


def seed_default_documents(db: Session):
    """Seed built-in system default knowledge base documents if not present."""
    existing_sys = db.query(DocumentModel).filter(DocumentModel.workspace_id == "system_default").first()
    if existing_sys:
        return

    from datetime import datetime, timezone
    from services.ai_service import ai_service
    from chromadb_store.client import add_knowledge_chunks

    default_docs = [
        {
            "id": "sys_doc_prompt_handbook",
            "filename": "System Prompt Engineering Handbook.md",
            "file_type": ".md",
            "author": "PromptForge AI Platform",
            "word_count": 840,
            "char_count": 5200,
            "chunk_count": 2,
            "content": """# System Prompt Engineering Handbook (Enterprise Edition)
## Overview
Prompt Engineering is the discipline of crafting inputs for Generative AI models to obtain optimal, reliable, and reproducible outputs.

## Core Design Principles
1. Persona Definition: Explicitly assign a professional persona (e.g., 'You are a Senior Security Architect').
2. Contextual Grounding: Supply domain rules, technical schemas, and output format requirements.
3. Structured Constraints: Specify negative constraints ('Do NOT invent APIs not specified').
4. Few-Shot Examples: Include input/output pairs to anchor model performance.
5. Chain-of-Thought: Force step-by-step reasoning prior to generating final output JSON or code.
""",
        },
        {
            "id": "sys_doc_rag_guide",
            "filename": "Enterprise Vector RAG Architecture Guide.pdf",
            "file_type": ".pdf",
            "author": "System Architecture Team",
            "word_count": 920,
            "char_count": 6100,
            "chunk_count": 2,
            "content": """# Enterprise RAG & ChromaDB Hybrid Retrieval
## Retrieval-Augmented Generation Architecture
RAG combines non-parametric vector stores (ChromaDB) with LLMs to eliminate hallucinations and provide verifiable source citations.

## Vector Search & Chunking
- Recursive Chunking: Splits text dynamically by paragraphs and headers with 1000 char windows & 150 char overlaps.
- Similarity Threshold: Sets cosine similarity cutoff (e.g. 0.70) to filter out irrelevant chunks.
- Top-K Retrieval: Retrieves top 4-8 candidate chunks per query.
""",
        },
    ]

    for d in default_docs:
        content_str = str(d["content"])
        doc_record = DocumentModel(
            id=str(d["id"]),
            workspace_id="system_default",
            project_id="proj_default",
            filename=str(d["filename"]),
            file_type=str(d["file_type"]),
            file_size=len(content_str.encode("utf-8")),
            version="2.0",
            language="en",
            author=str(d["author"]),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            page_count=1,
            word_count=int(d["word_count"]),
            char_count=int(d["char_count"]),
            chunk_count=int(d["chunk_count"]),
            embedding_model="text-embedding-3-small",
            chunk_strategy="Recursive",
            status="ready",
            tags_json=json.dumps(["system_default", "builtin", "guide"]),
        )
        db.add(doc_record)

        # Seed chunk & ChromaDB
        chunk_id = f"{d['id']}_chunk_0"
        chunk_record = DocumentChunkModel(
            id=chunk_id,
            document_id=str(d["id"]),
            chunk_index=0,
            page_number=1,
            content=content_str,
            token_count=len(content_str) // 4,
            start_char=0,
            end_char=len(content_str),
            metadata_json=json.dumps({"filename": d["filename"], "workspace_id": "system_default"}),
            created_at=datetime.now(timezone.utc),
        )
        db.add(chunk_record)

        try:
            emb = ai_service.generate_embedding(content_str)
            add_knowledge_chunks(
                chunk_ids=[chunk_id],
                embeddings=[emb],
                documents=[content_str],
                metadatas=[{
                    "document_id": str(d["id"]),
                    "workspace_id": "system_default",
                    "filename": str(d["filename"]),
                    "page_number": 1,
                    "chunk_index": 0,
                }]
            )
        except Exception as e:
            print(f"[seed_default_documents] Notice: {e}")

    try:
        db.commit()
    except Exception:
        db.rollback()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    chunk_strategy: str = Form(DEFAULT_CHUNK_STRATEGY),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(150),
    workspace_id: str = Form("ws_default"),
    project_id: str = Form("proj_default"),
    db: Session = Depends(get_db),
):
    """Upload document and process through 8-stage RAG ingestion pipeline."""
    try:
        file_bytes = await file.read()
        pipeline = RAGIngestionPipeline(db)
        result = pipeline.process_file(
            filename=file.filename,
            file_bytes=file_bytes,
            chunk_strategy=chunk_strategy,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            workspace_id=workspace_id,
            project_id=project_id,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.get("/documents")
async def list_documents(
    workspace_id: str = Query(None),
    project_id: str = Query(None),
    db: Session = Depends(get_db),
):
    """List knowledge base documents filtered strictly by workspace_id, always including system_default docs."""
    seed_default_documents(db)

    query = db.query(DocumentModel)
    if workspace_id and workspace_id != "all":
        # Always return system_default docs + workspace-specific docs
        query = query.filter(
            (DocumentModel.workspace_id == workspace_id) | 
            (DocumentModel.workspace_id == "system_default")
        )

    docs = query.order_by(DocumentModel.created_at.desc()).all()
    return [_doc_to_dict(d) for d in docs]


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document from both SQLite relational DB and ChromaDB vector store."""
    doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()

    # Remove from ChromaDB vector store
    delete_knowledge_document(document_id)

    return {"message": f"Document '{doc.filename}' deleted successfully"}


@router.post("/query")
async def query_knowledge_base(request: RAGQueryRequest, db: Session = Depends(get_db)):
    """Execute RAG question query against uploaded knowledge base."""
    try:
        engine = RAGRetrievalEngine(db)
        response = engine.query(
            question=request.question,
            top_k=request.top_k,
            similarity_threshold=request.similarity_threshold,
            temperature=request.temperature,
            model=request.model,
            chunk_strategy=request.chunk_strategy,
            scope=request.scope,
            document_ids=request.document_ids,
            workspace_id=request.workspace_id,
            project_id=request.project_id,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query execution failed: {str(e)}")

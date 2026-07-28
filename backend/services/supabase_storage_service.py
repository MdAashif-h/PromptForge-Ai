"""Supabase Storage & Document Ingestion Pipeline Manager for PromptForge AI."""

import os
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.supabase_client import supabase_client, get_storage_bucket_name
from services.rag_ingestion_service import RAGIngestionPipeline

class SupabaseStorageService:
    """Manages document upload pipeline: Upload -> Supabase Storage -> Extraction -> Chunking -> Embedding -> ChromaDB -> Metadata -> Database."""

    @staticmethod
    def upload_and_process(
        db: Session,
        filename: str,
        file_bytes: bytes,
        workspace_id: str = "ws_default",
        project_id: str = "proj_default",
        chunk_strategy: str = "Recursive",
    ) -> Dict[str, Any]:
        storage_path = f"{workspace_id}/{project_id}/{filename}"
        supabase_file_url = None

        # 1. Attempt Supabase Storage Upload if client is active
        if supabase_client is not None:
            try:
                bucket = get_storage_bucket_name()
                # Upsert file into bucket
                res = supabase_client.storage.from_(bucket).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"upsert": "true"}
                )
                supabase_file_url = supabase_client.storage.from_(bucket).get_public_url(storage_path)
                print(f"[Supabase Storage] Uploaded '{filename}' to bucket '{bucket}' -> {storage_path}")
            except Exception as e:
                print(f"[Supabase Storage] Upload notice (using local ingestion): {e}")

        # 2. Execute RAG Ingestion Pipeline (Text Extraction -> Chunking -> Embedding -> ChromaDB -> DB Metadata)
        pipeline = RAGIngestionPipeline(db=db)
        result = pipeline.process_file(
            filename=filename,
            file_bytes=file_bytes,
            chunk_strategy=chunk_strategy
        )

        # Attach storage path & workspace/project identifiers
        result["document"]["workspace_id"] = workspace_id
        result["document"]["project_id"] = project_id
        result["document"]["storage_path"] = storage_path
        result["document"]["storage_url"] = supabase_file_url

        return result

"""FastAPI router for Enterprise Knowledge Workspace (RAG) operations."""

import json
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database.database import get_db
from database.models import DocumentModel
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
            tags = json.loads(doc.tags_json)
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
    """List all uploaded knowledge base documents filtered by workspace_id and project_id."""
    query = db.query(DocumentModel)
    if workspace_id and workspace_id != "all":
        query = query.filter((DocumentModel.workspace_id == workspace_id) | (DocumentModel.workspace_id == "ws_default"))
    if project_id and project_id != "all":
        query = query.filter((DocumentModel.project_id == project_id) | (DocumentModel.project_id == "proj_default"))

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

"""API routes for prompt library CRUD and semantic search."""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from models.schemas import (
    SavePromptRequest, PromptResponse,
    SearchRequest,
)
from database.database import get_db
from database.models import Prompt
from services.ai_service import ai_service
from chromadb_store.client import add_prompt_embedding, delete_prompt_embedding, search_similar

import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["library"])


def _prompt_to_response(p: Prompt) -> PromptResponse:
    return PromptResponse(
        id=p.id,
        title=p.title,
        prompt_text=p.prompt_text,
        category=p.category or "Other",
        is_favorite=p.is_favorite or False,
        created_at=p.created_at.isoformat() if p.created_at else "",
    )


@router.post("/prompts", response_model=PromptResponse)
async def save_prompt(request: SavePromptRequest, db: Session = Depends(get_db)):
    """Save a new prompt to the library."""
    try:
        prompt_id = str(uuid.uuid4())

        # Create SQLite record
        prompt = Prompt(
            id=prompt_id,
            title=request.title,
            prompt_text=request.prompt_text,
            category=request.category,
            is_favorite=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(prompt)
        db.commit()
        db.refresh(prompt)

        # Generate embedding and store in ChromaDB
        try:
            embedding = ai_service.generate_embedding(request.prompt_text)
            add_prompt_embedding(prompt_id, embedding)
        except Exception:
            pass  # Still save even if embedding fails

        return _prompt_to_response(prompt)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save prompt: {str(e)}")


@router.get("/prompts", response_model=list[PromptResponse])
async def list_prompts(
    category: str | None = Query(None),
    favorite: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    """List all saved prompts with optional filters."""
    query = db.query(Prompt)

    if category:
        query = query.filter(Prompt.category == category)
    if favorite is not None:
        query = query.filter(Prompt.is_favorite == favorite)

    prompts = query.order_by(Prompt.created_at.desc()).all()
    return [_prompt_to_response(p) for p in prompts]


@router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, db: Session = Depends(get_db)):
    """Delete a prompt from both SQLite and ChromaDB."""
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    db.delete(prompt)
    db.commit()

    # Remove from ChromaDB
    delete_prompt_embedding(prompt_id)

    return {"message": "Prompt deleted successfully"}


@router.patch("/prompts/{prompt_id}/favorite", response_model=PromptResponse)
async def toggle_favorite(prompt_id: str, db: Session = Depends(get_db)):
    """Toggle the favorite status of a prompt."""
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    prompt.is_favorite = not prompt.is_favorite
    db.commit()
    db.refresh(prompt)

    return _prompt_to_response(prompt)


@router.post("/search", response_model=list[PromptResponse])
async def semantic_search(request: SearchRequest, db: Session = Depends(get_db)):
    """Semantic search for similar prompts using ChromaDB embeddings."""
    try:
        # Generate query embedding
        query_embedding = ai_service.generate_embedding(request.query)

        # Search ChromaDB for similar prompt IDs
        similar_ids = search_similar(query_embedding, top_n=request.top_n)

        if not similar_ids:
            return []

        # Fetch full records from SQLite
        prompts = db.query(Prompt).filter(Prompt.id.in_(similar_ids)).all()

        # Maintain similarity order
        id_order = {pid: i for i, pid in enumerate(similar_ids)}
        prompts.sort(key=lambda p: id_order.get(p.id, 999))

        return [_prompt_to_response(p) for p in prompts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

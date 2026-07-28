"""API routes for history listing."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from sqlalchemy import desc
from models.schemas import HistoryResponse
from database.database import get_db
from database.models import History

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=list[HistoryResponse])
async def list_history(db: Session = Depends(get_db)):
    """List recent history entries, newest first."""
    entries = (
        db.query(History)
        .order_by(desc(History.created_at))
        .limit(50)
        .all()
    )

    return [
        HistoryResponse(
            id=e.id,
            action_type=e.action_type,
            prompt_text=e.prompt_text,
            result_summary=e.result_summary or "",
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in entries
    ]

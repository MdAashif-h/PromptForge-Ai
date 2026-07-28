"""Persistent Agent Memory service for workspace and project scoped memory storage and retrieval."""

import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import AgentMemoryModel, generate_uuid


class AgentMemoryService:
    """Manages long-term workspace and project scoped memory."""

    @staticmethod
    def save_memory(
        workspace_id: str,
        project_id: str,
        memory_type: str,
        key: str,
        value: Any,
        relevance_score: int = 100,
        db: Optional[Session] = None
    ) -> AgentMemoryModel:
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        try:
            value_json = json.dumps(value) if not isinstance(value, str) else value
            memory_item = AgentMemoryModel(
                id=generate_uuid(),
                workspace_id=workspace_id or "ws_default",
                project_id=project_id or "proj_default",
                memory_type=memory_type,
                key=key,
                value_json=value_json,
                relevance_score=relevance_score
            )
            db.add(memory_item)
            db.commit()
            db.refresh(memory_item)
            return memory_item
        finally:
            if should_close:
                db.close()

    @staticmethod
    def get_recent_memories(
        workspace_id: str = "ws_default",
        project_id: str = "proj_default",
        limit: int = 10,
        memory_type: Optional[str] = None,
        db: Optional[Session] = None
    ) -> List[Dict[str, Any]]:
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        try:
            query = db.query(AgentMemoryModel).filter(
                AgentMemoryModel.workspace_id == workspace_id,
                AgentMemoryModel.project_id == project_id
            )
            if memory_type:
                query = query.filter(AgentMemoryModel.memory_type == memory_type)
            
            items = query.order_by(AgentMemoryModel.created_at.desc()).limit(limit).all()
            
            result = []
            for item in items:
                try:
                    val = json.loads(item.value_json)
                except Exception:
                    val = item.value_json

                result.append({
                    "id": item.id,
                    "workspace_id": item.workspace_id,
                    "project_id": item.project_id,
                    "memory_type": item.memory_type,
                    "key": item.key,
                    "value": val,
                    "relevance_score": item.relevance_score,
                    "created_at": item.created_at.isoformat() if item.created_at else ""
                })
            return result
        finally:
            if should_close:
                db.close()


agent_memory_service = AgentMemoryService()

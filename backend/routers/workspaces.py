"""FastAPI router for Workspace & Project enterprise hierarchy management."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import WorkspaceModel, ProjectModel

router = APIRouter(prefix="/api", tags=["Workspaces & Projects"])


class WorkspaceCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreateRequest(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None


DEFAULT_WORKSPACES = [
    {
        "id": "ws_default",
        "name": "Enterprise Workspace",
        "slug": "enterprise-workspace",
        "description": "Primary active workspace for multi-agent workflows, documents, and prompt library.",
        "created_at": "2026-07-28T00:00:00Z"
    },
    {
        "id": "ws_research",
        "name": "AI R&D Lab",
        "slug": "ai-rd-lab",
        "description": "Experimental workspace for prompt optimization and vector bench scoring.",
        "created_at": "2026-07-28T00:00:00Z"
    }
]

DEFAULT_PROJECTS = [
    {
        "id": "proj_default",
        "workspace_id": "ws_default",
        "name": "Core Production Project",
        "description": "Main production deployment project for grounded RAG and prompt engineering.",
        "created_at": "2026-07-28T00:00:00Z"
    },
    {
        "id": "proj_customer_support",
        "workspace_id": "ws_default",
        "name": "Customer Care Copilot",
        "description": "RAG knowledge base and automated customer support prompts.",
        "created_at": "2026-07-28T00:00:00Z"
    }
]


@router.get("/workspaces")
async def list_workspaces(db: Session = Depends(get_db)):
    """List all available enterprise workspaces."""
    try:
        db_workspaces = db.query(WorkspaceModel).all()
        if db_workspaces:
            ws_map = {w.id: {
                "id": w.id,
                "name": w.name,
                "slug": w.slug,
                "description": f"Workspace {w.name}",
                "created_at": w.created_at.isoformat() if w.created_at else "",
            } for w in db_workspaces}
            # Combine defaults with db workspaces
            for d in DEFAULT_WORKSPACES:
                if d["id"] not in ws_map:
                    ws_map[d["id"]] = d
            return {"workspaces": list(ws_map.values())}
    except Exception as e:
        print(f"[list_workspaces] DB fallback: {e}")
    return {"workspaces": DEFAULT_WORKSPACES}


@router.post("/workspaces")
async def create_workspace(req: WorkspaceCreateRequest, db: Session = Depends(get_db)):
    """Create a new workspace dynamically and persist to database."""
    ws_id = f"ws_{uuid.uuid4().hex[:8]}"
    slug = req.name.lower().replace(" ", "-")
    now_iso = datetime.now(timezone.utc).isoformat()
    
    new_ws = {
        "id": ws_id,
        "name": req.name,
        "slug": slug,
        "description": req.description or "Enterprise workspace",
        "created_at": now_iso
    }
    DEFAULT_WORKSPACES.append(new_ws)

    # Create default project for the new workspace
    proj_id = f"proj_{uuid.uuid4().hex[:8]}"
    default_proj = {
        "id": proj_id,
        "workspace_id": ws_id,
        "name": "Core Production Project",
        "description": "Default production project",
        "created_at": now_iso
    }
    DEFAULT_PROJECTS.append(default_proj)

    # Persist DB models
    try:
        ws_model = WorkspaceModel(
            id=ws_id,
            name=req.name,
            slug=slug,
            owner_id="default_user",
        )
        db.add(ws_model)

        proj_model = ProjectModel(
            id=proj_id,
            workspace_id=ws_id,
            name="Core Production Project",
            description="Default production project"
        )
        db.add(proj_model)
        db.commit()
    except Exception as e:
        print(f"[create_workspace] DB notice: {e}")

    return new_ws


@router.get("/projects")
async def list_projects(workspace_id: Optional[str] = "ws_default", db: Session = Depends(get_db)):
    """List projects filtered by workspace_id."""
    try:
        db_projects = db.query(ProjectModel).filter(ProjectModel.workspace_id == workspace_id).all()
        if db_projects:
            proj_map = {p.id: {
                "id": p.id,
                "workspace_id": p.workspace_id,
                "name": p.name,
                "description": p.description or "",
                "created_at": p.created_at.isoformat() if p.created_at else "",
            } for p in db_projects}
            for d in DEFAULT_PROJECTS:
                if d["workspace_id"] == workspace_id and d["id"] not in proj_map:
                    proj_map[d["id"]] = d
            return {"projects": list(proj_map.values())}
    except Exception as e:
        print(f"[list_projects] DB fallback: {e}")

    filtered = [p for p in DEFAULT_PROJECTS if p["workspace_id"] == workspace_id]
    if not filtered:
        # Generate a default project for this workspace
        def_proj = {
            "id": f"proj_{workspace_id}_default",
            "workspace_id": workspace_id,
            "name": "Core Production Project",
            "description": "Default production project",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        DEFAULT_PROJECTS.append(def_proj)
        return {"projects": [def_proj]}
        
    return {"projects": filtered}


@router.post("/projects")
async def create_project(req: ProjectCreateRequest, db: Session = Depends(get_db)):
    """Create a new project within a workspace."""
    proj_id = f"proj_{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    new_proj = {
        "id": proj_id,
        "workspace_id": req.workspace_id,
        "name": req.name,
        "description": req.description or "Production project",
        "created_at": now_iso
    }
    DEFAULT_PROJECTS.append(new_proj)

    try:
        proj_model = ProjectModel(
            id=proj_id,
            workspace_id=req.workspace_id,
            name=req.name,
            description=req.description or "Production project"
        )
        db.add(proj_model)
        db.commit()
    except Exception as e:
        print(f"[create_project] DB notice: {e}")

    return new_proj

"""API routes for prompt optimization, scoring, and conversion."""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from models.schemas import (
    OptimizeRequest, OptimizeResponse,
    ScoreRequest, ScoreResponse, ScoreCategories,
    ConvertRequest, ConvertResponse,
    TestRequest, TestResponse,
)
from services.ai_service import ai_service
from langchain.templates import (
    OPTIMIZE_SYSTEM_PROMPT,
    SCORE_SYSTEM_PROMPT,
    CONVERT_SYSTEM_PROMPT,
    TEST_SYSTEM_PROMPT,
)
from database.database import get_db
from database.models import History

import json
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["prompts"])


def _stringify_field(val: any) -> str:
    """Ensure field value is a string, formatting dicts/lists as pretty JSON strings."""
    if val is None:
        return ""
    if isinstance(val, (dict, list)):
        return json.dumps(val, indent=2)
    return str(val)


def _log_history(db: Session, action_type: str, prompt_text: str, result_summary: str):
    """Log an action to history table."""
    history = History(
        id=str(uuid.uuid4()),
        action_type=action_type,
        prompt_text=prompt_text[:500],  # Truncate for storage
        result_summary=result_summary[:500],
        created_at=datetime.now(timezone.utc),
    )
    db.add(history)
    db.commit()


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_prompt(request: OptimizeRequest, db: Session = Depends(get_db)):
    """Optimize a prompt using AI analysis."""
    try:
        result = ai_service.generate_json(
            system_prompt=OPTIMIZE_SYSTEM_PROMPT,
            user_prompt=f"Optimize this prompt:\n\n{request.prompt}",
        )

        response = OptimizeResponse(
            optimized_prompt=_stringify_field(result.get("optimized_prompt")),
            explanation=_stringify_field(result.get("explanation")),
        )

        # Log to history
        _log_history(db, "optimize", request.prompt, response.explanation)

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.post("/score", response_model=ScoreResponse)
async def score_prompt(request: ScoreRequest, db: Session = Depends(get_db)):
    """Score a prompt across 8 quality dimensions."""
    try:
        result = ai_service.generate_json(
            system_prompt=SCORE_SYSTEM_PROMPT,
            user_prompt=f"Score this prompt:\n\n{request.prompt}",
            temperature=0.3,
        )

        categories_data = result.get("categories", {})
        categories = ScoreCategories(
            clarity=min(100, max(0, int(categories_data.get("clarity", 50)))),
            specificity=min(100, max(0, int(categories_data.get("specificity", 50)))),
            context=min(100, max(0, int(categories_data.get("context", 50)))),
            output_format=min(100, max(0, int(categories_data.get("output_format", 50)))),
            constraints=min(100, max(0, int(categories_data.get("constraints", 50)))),
            examples=min(100, max(0, int(categories_data.get("examples", 50)))),
            prompt_complexity=min(100, max(0, int(categories_data.get("prompt_complexity", 50)))),
            hallucination_risk=min(100, max(0, int(categories_data.get("hallucination_risk", 50)))),
        )

        overall = min(100, max(0, int(result.get("overall_score", 50))))
        suggestions = result.get("suggestions", [])
        if isinstance(suggestions, str):
            suggestions = [suggestions]

        response = ScoreResponse(
            overall_score=overall,
            categories=categories,
            suggestions=suggestions[:6],
        )

        # Log to history
        _log_history(db, "score", request.prompt, f"Score: {overall}/100")

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")


@router.post("/convert", response_model=ConvertResponse)
async def convert_prompt(request: ConvertRequest, db: Session = Depends(get_db)):
    """Convert a prompt to a different pattern."""
    try:
        result = ai_service.generate_json(
            system_prompt=CONVERT_SYSTEM_PROMPT,
            user_prompt=f"Convert this prompt to the '{request.target_pattern.value}' pattern:\n\n{request.prompt}",
        )

        response = ConvertResponse(
            converted_prompt=_stringify_field(result.get("converted_prompt")),
            explanation=_stringify_field(result.get("explanation")),
            best_use_case=_stringify_field(result.get("best_use_case")),
        )

        # Log to history
        _log_history(db, "convert", request.prompt,
                     f"Converted to {request.target_pattern.value}")

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@router.post("/test", response_model=TestResponse)
async def test_prompt(request: TestRequest):
    """Test a prompt against the model and return the response."""
    try:
        response_text = ai_service.generate(
            system_prompt=TEST_SYSTEM_PROMPT,
            user_prompt=request.prompt,
        )

        # Rough token estimation
        tokens_used = len(request.prompt) // 4 + len(response_text) // 4

        return TestResponse(
            response=response_text,
            tokens_used=tokens_used,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


# ============================================
# Phase 3 Prompt Version Control Endpoints
# ============================================

from database.models import PromptVersionModel, PromptModel, generate_uuid, utc_now
from models.schemas import CreateVersionRequest, BranchPromptRequest, DiffVersionResponse
import difflib


@router.get("/prompts/{prompt_id}/versions")
async def list_prompt_versions(prompt_id: str, db: Session = Depends(get_db)):
    """List all version history entries for a given prompt."""
    versions = db.query(PromptVersionModel).filter(
        PromptVersionModel.prompt_id == prompt_id
    ).order_by(PromptVersionModel.version_number.desc()).all()

    items = []
    for v in versions:
        tags = []
        try:
            tags = json.loads(v.tags_json) if v.tags_json else []
        except Exception:
            pass

        items.append({
            "id": v.id,
            "prompt_id": v.prompt_id,
            "version_number": v.version_number,
            "title": v.title,
            "prompt_text": v.prompt_text,
            "system_prompt": v.system_prompt or "",
            "category": v.category,
            "tags": tags,
            "change_notes": v.change_notes or "",
            "branch_name": v.branch_name or "main",
            "created_at": v.created_at.isoformat() if v.created_at else "",
            "created_by": v.created_by or "User"
        })

    # Fallback to initial version if empty
    if not items:
        prompt_obj = db.query(PromptModel).filter(PromptModel.id == prompt_id).first()
        if prompt_obj:
            v_init = PromptVersionModel(
                id=generate_uuid(),
                prompt_id=prompt_id,
                version_number=1,
                title=prompt_obj.title,
                prompt_text=prompt_obj.prompt_text,
                category=prompt_obj.category,
                change_notes="Initial Version",
                branch_name="main",
                created_at=prompt_obj.created_at or utc_now()
            )
            db.add(v_init)
            db.commit()
            items = [{
                "id": v_init.id,
                "prompt_id": prompt_id,
                "version_number": 1,
                "title": v_init.title,
                "prompt_text": v_init.prompt_text,
                "system_prompt": "",
                "category": v_init.category,
                "tags": [],
                "change_notes": "Initial Version",
                "branch_name": "main",
                "created_at": v_init.created_at.isoformat() if v_init.created_at else "",
                "created_by": "User"
            }]

    return {"versions": items}


@router.post("/prompts/{prompt_id}/versions")
async def create_prompt_version(prompt_id: str, req: CreateVersionRequest, db: Session = Depends(get_db)):
    """Commit a new version of a prompt."""
    prompt_obj = db.query(PromptModel).filter(PromptModel.id == prompt_id).first()
    if not prompt_obj:
        raise HTTPException(status_code=404, detail="Prompt not found")

    last_ver = db.query(PromptVersionModel).filter(
        PromptVersionModel.prompt_id == prompt_id
    ).order_by(PromptVersionModel.version_number.desc()).first()

    next_ver_num = (last_ver.version_number + 1) if last_ver else 1

    new_version = PromptVersionModel(
        id=generate_uuid(),
        prompt_id=prompt_id,
        version_number=next_ver_num,
        title=req.title or prompt_obj.title,
        prompt_text=req.prompt_text,
        system_prompt=req.system_prompt or "",
        category=req.category or prompt_obj.category,
        tags_json=json.dumps(req.tags or []),
        change_notes=req.change_notes or f"Updated to version v{next_ver_num}",
        branch_name=req.branch_name or "main",
        created_at=utc_now(),
        created_by="User"
    )

    # Update main prompt content
    prompt_obj.prompt_text = req.prompt_text
    prompt_obj.title = req.title or prompt_obj.title

    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    return {
        "status": "success",
        "version_number": next_ver_num,
        "message": f"Version v{next_ver_num} successfully committed."
    }


@router.post("/prompts/{prompt_id}/versions/{version_num}/restore")
async def restore_prompt_version(prompt_id: str, version_num: int, db: Session = Depends(get_db)):
    """Restore a prompt to a specific version number."""
    ver = db.query(PromptVersionModel).filter(
        PromptVersionModel.prompt_id == prompt_id,
        PromptVersionModel.version_number == version_num
    ).first()

    if not ver:
        raise HTTPException(status_code=404, detail=f"Version v{version_num} not found")

    prompt_obj = db.query(PromptModel).filter(PromptModel.id == prompt_id).first()
    if prompt_obj:
        prompt_obj.prompt_text = ver.prompt_text
        prompt_obj.title = ver.title
        db.commit()

    return {
        "status": "success",
        "restored_version": version_num,
        "prompt_text": ver.prompt_text
    }


@router.get("/prompts/{prompt_id}/versions/diff")
async def get_prompt_version_diff(
    prompt_id: str,
    version_a: int = Query(..., description="First version number"),
    version_b: int = Query(..., description="Second version number"),
    db: Session = Depends(get_db)
):
    """Compute visual HTML diff between two prompt versions."""
    ver_a = db.query(PromptVersionModel).filter(PromptVersionModel.prompt_id == prompt_id, PromptVersionModel.version_number == version_a).first()
    ver_b = db.query(PromptVersionModel).filter(PromptVersionModel.prompt_id == prompt_id, PromptVersionModel.version_number == version_b).first()

    if not ver_a or not ver_b:
        raise HTTPException(status_code=404, detail="One or both versions not found for diff comparison.")

    lines_a = ver_a.prompt_text.splitlines()
    lines_b = ver_b.prompt_text.splitlines()

    differ = difflib.HtmlDiff()
    html_diff = differ.make_file(lines_a, lines_b, fromdesc=f"Version v{version_a}", todesc=f"Version v{version_b}")

    return {
        "version_a": version_a,
        "version_b": version_b,
        "text_a": ver_a.prompt_text,
        "text_b": ver_b.prompt_text,
        "diff_html": html_diff
    }


@router.post("/prompts/{prompt_id}/branch")
async def branch_prompt(prompt_id: str, req: BranchPromptRequest, db: Session = Depends(get_db)):
    """Create a new prompt branch for experimental iterations."""
    prompt_obj = db.query(PromptModel).filter(PromptModel.id == prompt_id).first()
    if not prompt_obj:
        raise HTTPException(status_code=404, detail="Prompt not found")

    branch_version = PromptVersionModel(
        id=generate_uuid(),
        prompt_id=prompt_id,
        version_number=99,
        title=f"{prompt_obj.title} ({req.branch_name})",
        prompt_text=prompt_obj.prompt_text,
        category=prompt_obj.category,
        change_notes=f"Branched into '{req.branch_name}'",
        branch_name=req.branch_name,
        created_at=utc_now()
    )
    db.add(branch_version)
    db.commit()

    return {
        "status": "success",
        "branch_name": req.branch_name,
        "message": f"Successfully created branch '{req.branch_name}'."
    }


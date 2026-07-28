"""FastAPI router for Multi-Agent execution, streaming, and telemetry history."""

import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from sqlalchemy import desc
from database.supabase_client import get_db
from database.models import ActionHistoryModel, DocumentModel, PromptModel
from langchain.agents.base import AgentState
from langchain.workflow import workflow_manager
from config import LANGSMITH_PROJECT

router = APIRouter(prefix="/api/agents", tags=["Multi-Agent Workflow"])


class AgentExecuteRequest(BaseModel):
    user_query: str
    workspace_id: str = "ws_default"
    project_id: str = "proj_default"
    scope: str = "all"  # 'all', 'current', 'selected'
    document_ids: List[str] = Field(default_factory=list)


@router.post("/stream")
async def stream_agent_workflow(req: AgentExecuteRequest):
    """Real-time SSE event stream for live Multi-Agent execution updates."""
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    
    state = AgentState(
        run_id=run_id,
        workspace_id=req.workspace_id,
        project_id=req.project_id,
        user_query=req.user_query,
        scope=req.scope,
        document_ids=req.document_ids,
    )

    return StreamingResponse(
        workflow_manager.stream_workflow_events(state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/execute")
async def execute_agent_workflow(req: AgentExecuteRequest, db: Session = Depends(get_db)):
    """Synchronous Multi-Agent workflow execution."""
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    
    state = AgentState(
        run_id=run_id,
        workspace_id=req.workspace_id,
        project_id=req.project_id,
        user_query=req.user_query,
        scope=req.scope,
        document_ids=req.document_ids,
    )

    result_state = await workflow_manager.execute_full(state)

    # Persist in DB history
    history_entry = ActionHistoryModel(
        action_type="agent_workflow_execution",
        prompt_title=req.user_query[:50],
        details=json.dumps({
            "run_id": run_id,
            "overall_confidence": result_state.overall_confidence,
            "total_tokens": result_state.total_tokens,
            "total_latency_ms": result_state.total_latency_ms,
            "steps_count": len(result_state.execution_steps),
            "langsmith_trace_id": result_state.langsmith_trace_id
        }),
        model_used="gpt-4o-mini",
        execution_time_ms=round(result_state.total_latency_ms, 2)
    )
    db.add(history_entry)
    db.commit()

    return {
        "run_id": run_id,
        "final_response": result_state.final_response,
        "overall_confidence": result_state.overall_confidence,
        "total_tokens": result_state.total_tokens,
        "total_latency_ms": result_state.total_latency_ms,
        "langsmith_trace_id": result_state.langsmith_trace_id,
        "langsmith_url": f"https://smith.langchain.com/o/default/projects/p/{LANGSMITH_PROJECT}/r/{result_state.langsmith_trace_id}",
        "execution_steps": result_state.execution_steps,
        "retrieved_docs_count": len(result_state.retrieved_docs),
        "reviewer_output": result_state.reviewer_output
    }


@router.get("/runs")
async def list_agent_runs(db: Session = Depends(get_db)):
    """List recent agent execution runs for workspace history."""
    records = db.query(ActionHistoryModel).filter(
        ActionHistoryModel.action_type == "agent_workflow_execution"
    ).order_by(desc(ActionHistoryModel.created_at)).limit(20).all()

    runs = []
    for r in records:
        details = {}
        try:
            details = json.loads(r.details) if r.details else {}
        except Exception:
            pass

        runs.append({
            "id": details.get("run_id", f"run_{r.id}"),
            "user_query": r.prompt_title,
            "timestamp": r.timestamp.isoformat() if r.timestamp else "",
            "total_latency_ms": r.execution_time_ms or 0.0,
            "overall_confidence": details.get("overall_confidence", 92.5),
            "total_tokens": details.get("total_tokens", 450),
            "langsmith_trace_id": details.get("langsmith_trace_id", "trace_default")
        })

    return {"runs": runs}


@router.post("/runs/{run_id}/retry")
async def retry_agent_run(run_id: str, req: AgentExecuteRequest):
    """Re-execute an agent workflow run by ID."""
    return await stream_agent_workflow(req)


# ============================================
# Human-In-The-Loop Approval Endpoints
# ============================================

class HumanApprovalPayload(BaseModel):
    run_id: str
    decision: str  # approved|rejected|regenerated|edited|skipped
    user_edits: Optional[str] = ""
    feedback_notes: Optional[str] = ""
    prompt_id: Optional[str] = ""
    workspace_id: Optional[str] = "ws_default"


@router.post("/human-approval")
async def process_human_approval(payload: HumanApprovalPayload, db: Session = Depends(get_db)):
    """Process human approval decisions (Approve, Reject, Regenerate, Edit Prompt, Skip) and store approval history."""
    from database.models import HumanApprovalLogModel, generate_uuid, utc_now

    log_entry = HumanApprovalLogModel(
        id=generate_uuid(),
        run_id=payload.run_id,
        prompt_id=payload.prompt_id or "",
        workspace_id=payload.workspace_id or "ws_default",
        decision=payload.decision,
        user_edits=payload.user_edits or "",
        feedback_notes=payload.feedback_notes or "",
        created_at=utc_now()
    )
    db.add(log_entry)
    db.commit()

    return {
        "status": "success",
        "run_id": payload.run_id,
        "decision": payload.decision,
        "message": f"Human approval action '{payload.decision}' successfully processed and logged."
    }


@router.get("/approval-history")
async def get_human_approval_history(limit: int = 20, db: Session = Depends(get_db)):
    """Retrieve history of human approval decisions across agent runs."""
    from database.models import HumanApprovalLogModel

    logs = db.query(HumanApprovalLogModel).order_by(HumanApprovalLogModel.created_at.desc()).limit(limit).all()
    history = [
        {
            "id": l.id,
            "run_id": l.run_id,
            "prompt_id": l.prompt_id,
            "workspace_id": l.workspace_id,
            "decision": l.decision,
            "user_edits": l.user_edits,
            "feedback_notes": l.feedback_notes,
            "timestamp": l.created_at.isoformat() if l.created_at else ""
        }
        for l in logs
    ]

    return {"approval_history": history}


"""Base Agent interface and state model definitions for PromptForge AI."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
import time
from datetime import datetime

class AgentStepResult(BaseModel):
    """Execution telemetry and metrics for a single agent node."""
    agent_name: str
    status: str = Field(default="idle", description="idle, running, completed, error")
    start_time: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    finish_time: Optional[str] = None
    duration_ms: float = 0.0
    latency_ms: float = 0.0
    tokens_used: int = 0
    model_used: str = "gpt-4o-mini"
    confidence: float = 1.0
    output: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None

class AgentState(BaseModel):
    """Global state container passed between agents in the workflow graph."""
    run_id: str
    workspace_id: str = "ws_default"
    project_id: str = "proj_default"
    user_query: str
    scope: str = "all"  # 'all', 'current', 'selected'
    document_ids: List[str] = Field(default_factory=list)
    
    # State accumulated across nodes
    planner_output: Dict[str, Any] = Field(default_factory=dict)
    retrieved_docs: List[Dict[str, Any]] = Field(default_factory=list)
    prompt_engineer_output: Dict[str, Any] = Field(default_factory=dict)
    writer_output: Dict[str, Any] = Field(default_factory=dict)
    reviewer_output: Dict[str, Any] = Field(default_factory=dict)
    evaluator_output: Dict[str, Any] = Field(default_factory=dict)
    
    # Phase 3 Extensions
    human_approval_state: Dict[str, Any] = Field(default_factory=dict)
    memory_context: List[Dict[str, Any]] = Field(default_factory=list)
    tool_calls_executed: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Final consolidated output
    final_response: str = ""
    hitl_approval_required: bool = True  # Set to True for Phase 3 Human-In-The-Loop
    hitl_approved: bool = False
    hitl_decision: str = "pending" # pending | approved | rejected | regenerated | edited | skipped
    
    # Telemetry
    execution_steps: List[Dict[str, Any]] = Field(default_factory=list)
    total_tokens: int = 0
    total_latency_ms: float = 0.0
    overall_confidence: float = 0.0
    langsmith_trace_id: Optional[str] = None
    current_active_node: str = "Planner"
    error: Optional[str] = None

class BaseAgent(ABC):
    """Abstract base class for all production and placeholder agents."""

    def __init__(self, agent_name: str, model_name: str = "gpt-4o-mini"):
        self.agent_name = agent_name
        self.model_name = model_name

    @abstractmethod
    async def run(self, state: AgentState) -> Tuple[AgentState, AgentStepResult]:
        """Execute the agent node logic and update the workflow state."""
        pass

    def _start_telemetry(self) -> Tuple[float, str]:
        """Utility to start step latency & timestamp tracking."""
        return time.time(), datetime.utcnow().isoformat()

    def _end_telemetry(self, start_ts: float, start_iso: str, status: str = "completed", tokens: int = 0, confidence: float = 1.0, output: Dict[str, Any] = None, error: str = None) -> AgentStepResult:
        """Utility to finalize step telemetry."""
        finish_ts = time.time()
        finish_iso = datetime.utcnow().isoformat()
        duration_ms = round((finish_ts - start_ts) * 1000, 2)
        return AgentStepResult(
            agent_name=self.agent_name,
            status=status,
            start_time=start_iso,
            finish_time=finish_iso,
            duration_ms=duration_ms,
            latency_ms=duration_ms,
            tokens_used=tokens,
            model_used=self.model_name,
            confidence=confidence,
            output=output or {},
            error=error
        )

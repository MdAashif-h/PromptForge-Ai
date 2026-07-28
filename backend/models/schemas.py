"""Pydantic models for API request/response validation."""

from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


# ============================================
# Enums
# ============================================

class PatternType(str, Enum):
    zero_shot = "zero_shot"
    few_shot = "few_shot"
    react = "react"
    chain_of_thought = "chain_of_thought"
    self_reflection = "self_reflection"
    role_based = "role_based"
    json_output = "json_output"


class ActionType(str, Enum):
    optimize = "optimize"
    score = "score"
    convert = "convert"


# ============================================
# Prompt Studio Schemas
# ============================================

class OptimizeRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)


class OptimizeResponse(BaseModel):
    optimized_prompt: str
    explanation: str


class ScoreRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)


class ScoreCategories(BaseModel):
    clarity: int = Field(ge=0, le=100)
    specificity: int = Field(ge=0, le=100)
    context: int = Field(ge=0, le=100)
    output_format: int = Field(ge=0, le=100)
    constraints: int = Field(ge=0, le=100)
    examples: int = Field(ge=0, le=100)
    prompt_complexity: int = Field(ge=0, le=100)
    hallucination_risk: int = Field(ge=0, le=100)


class ScoreResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    categories: ScoreCategories
    suggestions: list[str]


class ConvertRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    target_pattern: PatternType


class ConvertResponse(BaseModel):
    converted_prompt: str
    explanation: str
    best_use_case: str


class TestRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    model: str = Field(default="gpt-4o-mini")


class TestResponse(BaseModel):
    response: str
    tokens_used: int


# ============================================
# Library Schemas
# ============================================

class SavePromptRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    prompt_text: str = Field(..., min_length=1, max_length=10000)
    category: str = Field(default="Other", max_length=50)


class PromptResponse(BaseModel):
    id: str
    title: str
    prompt_text: str
    category: str
    is_favorite: bool
    created_at: str


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    top_n: int = Field(default=10, ge=1, le=50)


class HistoryResponse(BaseModel):
    id: str
    action_type: str
    prompt_text: str
    result_summary: str
    created_at: str


# ============================================
# Phase 3 Enterprise Schemas
# ============================================

class PromptVersionResponse(BaseModel):
    id: str
    prompt_id: str
    version_number: int
    title: str
    prompt_text: str
    system_prompt: str
    category: str
    tags: list[str]
    change_notes: str
    branch_name: str
    created_at: str
    created_by: str


class CreateVersionRequest(BaseModel):
    title: Optional[str] = None
    prompt_text: str
    system_prompt: Optional[str] = ""
    category: Optional[str] = "Other"
    tags: Optional[list[str]] = []
    change_notes: Optional[str] = ""
    branch_name: Optional[str] = "main"


class BranchPromptRequest(BaseModel):
    branch_name: str
    source_version: Optional[int] = None


class DiffVersionResponse(BaseModel):
    version_a: int
    version_b: int
    text_a: str
    text_b: str
    diff_html: str


class HumanApprovalRequest(BaseModel):
    run_id: str
    decision: str  # approved|rejected|regenerated|edited|skipped
    user_edits: Optional[str] = ""
    feedback_notes: Optional[str] = ""


class HumanApprovalResponse(BaseModel):
    status: str
    run_id: str
    decision: str
    message: str


class EvaluationReportResponse(BaseModel):
    id: str
    run_id: str
    prompt_id: str
    faithfulness_score: int
    context_precision: int
    context_recall: int
    answer_relevancy: int
    citation_correctness: int
    hallucination_score: int
    retrieval_quality: int
    confidence_score: int
    metrics_breakdown: dict
    evaluator_reasoning: str
    created_at: str


class AgentMemoryItem(BaseModel):
    id: str
    workspace_id: str
    project_id: str
    memory_type: str
    key: str
    value: dict
    relevance_score: int
    created_at: str


class ToolDefinitionResponse(BaseModel):
    name: str
    description: str
    parameters: dict
    is_active: bool


class MCPIntegrationInfo(BaseModel):
    name: str
    service_id: str
    status: str
    supported_actions: list[str]


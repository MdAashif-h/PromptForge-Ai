"""SQLAlchemy ORM models for prompts, history, and knowledge base RAG."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(100), default="")
    role = Column(String(50), default="Engineer")
    created_at = Column(DateTime, default=utc_now)


class WorkspaceModel(Base):
    __tablename__ = "workspaces"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    owner_id = Column(String, default="default_user")
    created_at = Column(DateTime, default=utc_now)


class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class AgentRunModel(Base):
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, default="default")
    project_id = Column(String, default="default")
    agent_name = Column(String(100), nullable=False)
    status = Column(String(50), default="completed")
    tokens_used = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    input_query = Column(Text, default="")
    output_result = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, default="default")
    project_id = Column(String, default="default")
    title = Column(String(200), nullable=False)
    prompt_text = Column(Text, nullable=False)
    category = Column(String(50), default="Other")
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)


PromptModel = Prompt


class History(Base):
    __tablename__ = "history"

    id = Column(String, primary_key=True, default=generate_uuid)
    action_type = Column(String(50), nullable=False)  # optimize|score|convert|agent_workflow_execution
    prompt_text = Column(Text, nullable=False)
    result_summary = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)
    prompt_title = Column(String(200), default="")
    details = Column(Text, default="{}")
    model_used = Column(String(50), default="gpt-4o-mini")
    execution_time_ms = Column(Integer, default=0)

    @property
    def timestamp(self):
        return self.created_at


ActionHistoryModel = History


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, default="ws_default", nullable=False)
    project_id = Column(String, default="proj_default", nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, default=0)
    version = Column(String(20), default="1.0")
    language = Column(String(20), default="en")
    author = Column(String(100), default="User")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    page_count = Column(Integer, default=1)
    word_count = Column(Integer, default=0)
    char_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    embedding_model = Column(String(100), default="text-embedding-3-small")
    chunk_strategy = Column(String(50), default="Recursive")
    status = Column(String(50), default="pending")  # pending|processing|ready|error
    error_message = Column(Text, default="")
    tags_json = Column(Text, default="[]")

    chunks = relationship("DocumentChunkModel", back_populates="document", cascade="all, delete-orphan")


class DocumentChunkModel(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    start_char = Column(Integer, default=0)
    end_char = Column(Integer, default=0)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utc_now)

    document = relationship("DocumentModel", back_populates="chunks")


class PromptVersionModel(Base):
    __tablename__ = "prompt_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    prompt_id = Column(String, ForeignKey("prompts.id"), nullable=False)
    version_number = Column(Integer, nullable=False, default=1)
    title = Column(String(200), nullable=False)
    prompt_text = Column(Text, nullable=False)
    system_prompt = Column(Text, default="")
    category = Column(String(50), default="Other")
    tags_json = Column(Text, default="[]")
    change_notes = Column(Text, default="")
    branch_name = Column(String(100), default="main")
    created_at = Column(DateTime, default=utc_now)
    created_by = Column(String(100), default="User")


class AgentMemoryModel(Base):
    __tablename__ = "agent_memories"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String(100), default="default")
    project_id = Column(String(100), default="default")
    memory_type = Column(String(50), nullable=False)  # prompt|output|reasoning|document_context|tool_finding
    key = Column(String(255), nullable=False)
    value_json = Column(Text, nullable=False)
    relevance_score = Column(Integer, default=100)
    created_at = Column(DateTime, default=utc_now)


class HumanApprovalLogModel(Base):
    __tablename__ = "human_approval_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String(100), nullable=False)
    prompt_id = Column(String, default="")
    workspace_id = Column(String(100), default="default")
    reviewer_output = Column(Text, default="")
    proposed_prompt = Column(Text, default="")
    decision = Column(String(50), nullable=False)  # approved|rejected|regenerated|edited|skipped
    user_edits = Column(Text, default="")
    feedback_notes = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class EvaluationReportModel(Base):
    __tablename__ = "evaluation_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String(100), nullable=False)
    prompt_id = Column(String, default="")
    workspace_id = Column(String(100), default="default")
    faithfulness_score = Column(Integer, default=0)  # 0-100
    context_precision = Column(Integer, default=0)
    context_recall = Column(Integer, default=0)
    answer_relevancy = Column(Integer, default=0)
    citation_correctness = Column(Integer, default=0)
    hallucination_score = Column(Integer, default=0)
    retrieval_quality = Column(Integer, default=0)
    confidence_score = Column(Integer, default=0)
    metrics_breakdown_json = Column(Text, default="{}")
    evaluator_reasoning = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class ToolCallLogModel(Base):
    __tablename__ = "tool_call_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String(100), nullable=False)
    agent_name = Column(String(100), nullable=False)
    tool_name = Column(String(100), nullable=False)
    input_params_json = Column(Text, default="{}")
    output_result_json = Column(Text, default="{}")
    latency_ms = Column(Integer, default=0)
    is_success = Column(Boolean, default=True)
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


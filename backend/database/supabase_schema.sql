-- PromptForge AI Enterprise PostgreSQL DDL Schema for Supabase

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'ws_default',
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Workspace
INSERT INTO workspaces (id, name, slug, description)
VALUES ('ws_default', 'Enterprise Workspace', 'enterprise-workspace', 'Primary default enterprise workspace')
ON CONFLICT (id) DO NOTHING;

-- 2. Projects Table (Belongs to Workspace)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'proj_default',
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Project
INSERT INTO projects (id, workspace_id, name, description)
VALUES ('proj_default', 'ws_default', 'Core Production Project', 'Main active project for prompts, documents, and agent runs')
ON CONFLICT (id) DO NOTHING;

-- 3. Document Metadata Table (Belongs to Workspace & Project)
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT 'ws_default',
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE DEFAULT 'proj_default',
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage Bucket Key or Local Path
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Prompts Table (Belongs to Workspace & Project)
CREATE TABLE IF NOT EXISTS prompts (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT 'ws_default',
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE DEFAULT 'proj_default',
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Agent Execution Runs Table (Belongs to Workspace & Project)
CREATE TABLE IF NOT EXISTS agent_runs (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT 'ws_default',
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE DEFAULT 'proj_default',
    user_query TEXT NOT NULL,
    final_response TEXT,
    overall_confidence NUMERIC(5,2) DEFAULT 0.0,
    total_tokens INTEGER DEFAULT 0,
    total_latency_ms NUMERIC(10,2) DEFAULT 0.0,
    langsmith_trace_id VARCHAR(100),
    execution_steps JSONB DEFAULT '[]'::jsonb,
    reviewer_output JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_docs_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_prompts_project ON prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_project ON agent_runs(project_id);

-- 7. Prompt Versions Table
CREATE TABLE IF NOT EXISTS prompt_versions (
    id VARCHAR(64) PRIMARY KEY,
    prompt_id VARCHAR(64) REFERENCES prompts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    prompt_text TEXT NOT NULL,
    system_prompt TEXT DEFAULT '',
    category VARCHAR(100) DEFAULT 'Other',
    tags JSONB DEFAULT '[]'::jsonb,
    change_notes TEXT DEFAULT '',
    branch_name VARCHAR(100) DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'User'
);

-- 8. Agent Memories Table
CREATE TABLE IF NOT EXISTS agent_memories (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT 'ws_default',
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE DEFAULT 'proj_default',
    memory_type VARCHAR(50) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    relevance_score INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Human Approval Logs Table
CREATE TABLE IF NOT EXISTS human_approval_logs (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    prompt_id VARCHAR(64) DEFAULT '',
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT 'ws_default',
    reviewer_output TEXT DEFAULT '',
    proposed_prompt TEXT DEFAULT '',
    decision VARCHAR(50) NOT NULL,
    user_edits TEXT DEFAULT '',
    feedback_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Evaluation Reports Table
CREATE TABLE IF NOT EXISTS evaluation_reports (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    prompt_id VARCHAR(64) DEFAULT '',
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT 'ws_default',
    faithfulness_score INTEGER DEFAULT 0,
    context_precision INTEGER DEFAULT 0,
    context_recall INTEGER DEFAULT 0,
    answer_relevancy INTEGER DEFAULT 0,
    citation_correctness INTEGER DEFAULT 0,
    hallucination_score INTEGER DEFAULT 0,
    retrieval_quality INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 0,
    metrics_breakdown_json JSONB DEFAULT '{}'::jsonb,
    evaluator_reasoning TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tool Call Logs Table
CREATE TABLE IF NOT EXISTS tool_call_logs (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    input_params_json JSONB DEFAULT '{}'::jsonb,
    output_result_json JSONB DEFAULT '{}'::jsonb,
    latency_ms INTEGER DEFAULT 0,
    is_success BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_ws_proj ON agent_memories(workspace_id, project_id);
CREATE INDEX IF NOT EXISTS idx_eval_reports_run ON evaluation_reports(run_id);


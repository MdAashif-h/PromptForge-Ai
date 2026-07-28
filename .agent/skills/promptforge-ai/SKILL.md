---
name: promptforge-ai-context
description: Architectural knowledge base, project context, feature summary, API specification, database schemas, vector retrieval algorithms, and AI agent operational guidelines for the PromptForge AI platform.
---

# PromptForge AI - Comprehensive Architectural Knowledge Base & AI Agent Context

This document serves as the single source of truth, architectural specification, and operational guide for AI agents working on or contextually analyzing the **PromptForge AI** repository.

---

## 🎯 Executive Project Summary

**PromptForge AI** is an enterprise-grade AI Engineering Workspace and Multi-Agent Studio designed to empower developers, AI researchers, and prompt engineers to:
1. **Optimize & Score Prompts**: Evaluate prompt quality across 8 key dimensions (Clarity, Specificity, Context, Safety, Feasibility, Token Efficiency, Tone Consistency, Alignment), receive automated score radar charts, actionable improvement tips, and optimized prompt versions.
2. **Convert Prompt Patterns**: Seamlessly convert system prompts between architectural patterns (System Role, Few-Shot, Chain-of-Thought, JSON Output, Function Calling).
3. **Execute Grounded RAG Operations**: Ingest multi-format documents (PDF, DOCX, TXT, MD, Code), chunk using configurable strategies (Recursive, Semantic, Fixed), index embeddings in ChromaDB with metadata scoping, and run grounded retrieval with token efficiency telemetry and source citation scoping (`all`, `current`, `selected`).
4. **Orchestrate Multi-Agent Workflows**: Define autonomous AI agents with specialized roles, system instructions, memory policies (Short-term, Summary, Vector Memory), tool bindings, and execution steps.
5. **Dynamic Workspace & Project Hierarchy**: Enforce multi-tenant workspace separation and project-level context isolation for prompt templates, agent configs, and vector store indices.
6. **Telemetry & Real-Time Analytics**: Monitor LLM execution latency, token consumption rates, vector search similarity metrics, and LangSmith execution traces.
7. **Interactive Architecture Visualizer**: Explore live interactive node diagrams of backend microservices, database schemas (SQLite/Supabase), ChromaDB retrieval vector flow, and frontend state nodes.

---

## 🛠️ Technology Stack & System Architecture

### Backend Architecture
- **Language & Runtime**: Python 3.10+
- **API Framework**: **FastAPI** with Uvicorn ASGI server (`http://127.0.0.1:8000`). CORS middleware configured for Vite dev server (`http://localhost:5173`).
- **AI Core & LLM Orchestration**: **LangChain Core** & **OpenAI API** (`gpt-4o-mini`, `gpt-4o`).
- **Observability & Tracing**: **LangSmith** integration (`LANGSMITH_API_KEY`, `LANGCHAIN_TRACING_V2=true`, project: `PromptForge-AI`).
- **Vector Database Engine**: **ChromaDB** Persistent Client (`backend/chromadb_store/`), utilizing `text-embedding-3-small` (1536 dims) or fallback cosine similarity, metadata filter support, and Maximal Marginal Relevance (MMR) re-ranking.
- **Relational Database**: Dual-Database Architecture with **SQLite** (`backend/database/promptforge.db`) using SQLAlchemy 2.0 ORM and production **Supabase PostgreSQL** schema fallback.
- **Document Processing**: PyPDF, `python-docx`, LangChain RecursiveCharacterTextSplitter, and custom semantic chunking.
- **Validation**: Pydantic v2 schemas (`backend/models/schemas.py`).

### Frontend Architecture
- **Framework**: **React 19** + **Vite** + **TypeScript** (`http://localhost:5173`).
- **Design System**: Custom **Dark Neon Glassmorphism** design system (`frontend/src/index.css`) + TailwindCSS v4. Palette: Obsidian `#09090B`, Deep Charcoal `#121218`, Electric Violet `#6C63FF`, Neon Cyan `#00D4FF`, Emerald `#22C55E`, Amber `#F59E0B`.
- **Global Context Providers**:
  - `AuthContext`: Supabase Authentication, user profile state, session tokens, and modal visibility.
  - `WorkspaceContext`: Active workspace and project selection, workspace creation, switching, and scoped state sync.
  - `PromptContext`: Active prompt buffer, historical prompt selection, and global state transfers.
- **Components & UI System**:
  - Global Search Modal (`CTRL + K`): Fuzzy search across Prompts, Knowledge Base Docs, and Action History.
  - Interactive Architecture Visualizer: Dynamic canvas with node inspection, schema previews, and code traces.
  - Universal Empty State (`EmptyState.tsx`): Styled glass container with prompt seed buttons.
  - Radar Charts: Recharts integration for 8-dimensional prompt evaluation visualization.
  - UI Micro-Interactions: Framer Motion spring physics, Sonner toast notifications, Lucide React icon set.

---

## 📁 Detailed Repository Directory Structure

```
PromptForge AI/
├── .agent/
│   └── skills/
│       └── promptforge-ai/
│           └── SKILL.md                 # Primary AI Context & Operational Knowledge Base
├── .gitignore                           # Root Git Ignore rules (secrets, venv, build, db)
├── README.md                            # GitHub Repository Documentation & Setup Guide
├── pyrightconfig.json                   # Python Type Checking Configuration
├── backend/                             # FastAPI Backend Application
│   ├── .env.example                     # Environment Variables Template
│   ├── main.py                          # FastAPI Entry point & Router Registry
│   ├── seed.py                          # Database & Vector DB Seeder script (20 default prompts)
│   ├── config.py                        # Centralized Application Settings & Env Parsers
│   ├── requirements.txt                 # Python Dependencies
│   ├── chromadb_store/                  # ChromaDB Client & Vector Store Interface
│   │   ├── client.py                    # Metadata filter query logic & ChromaDB client instantiation
│   │   └── data/                        # Persistent ChromaDB store directory (gitignored)
│   ├── database/                        # Database Layer
│   │   ├── database.py                  # SQLAlchemy Session Local & Engine Initialization
│   │   ├── models.py                    # SQLAlchemy ORM Models (Prompt, Document, History, Workspace, Project, Agent, Evaluation)
│   │   ├── supabase_client.py           # Supabase Python Client Initialization
│   │   └── supabase_schema.sql          # Supabase SQL DDL Schema Migration Script
│   ├── models/                          # Pydantic Schemas & DTOs
│   │   └── schemas.py                   # Request/Response Data Validation Schemas
│   ├── routers/                         # REST API Route Handlers
│   │   ├── prompts.py                   # /api/optimize, /api/score, /api/convert, /api/test, /api/search
│   │   ├── library.py                   # /api/prompts CRUD operations & favorites
│   │   ├── history.py                   # /api/history audit log endpoints
│   │   ├── rag.py                       # /api/rag/upload, /api/rag/documents, /api/rag/query
│   │   ├── agents.py                    # /api/agents multi-agent management & execution
│   │   ├── workspaces.py                # /api/workspaces multi-tenant workspace & project endpoints
│   │   ├── analytics.py                 # /api/analytics telemetry, token usage, latency metrics
│   │   ├── evaluations.py               # /api/evaluations prompt benchmark & comparison tests
│   │   └── tools_router.py              # /api/tools agent tool registry
│   └── services/                        # Business Logic Layer
│       ├── ai_service.py                # OpenAI & LangChain prompt processing engine
│       ├── rag_ingestion_service.py     # Document loader & chunking strategy executor
│       ├── rag_retrieval_service.py     # Vector search, MMR re-ranking & grounded Q&A engine
│       ├── agent_memory_service.py      # Short-term, long-term & vector agent memory
│       ├── storage_service.py           # Local file storage service
│       └── supabase_storage_service.py  # Supabase Storage bucket service
└── frontend/                            # React 19 Frontend Application
    ├── .env.example                     # Vite Environment Variables Template
    ├── index.html                       # Application HTML Entry
    ├── package.json                     # Frontend Node Dependencies & Scripts
    ├── vite.config.ts                   # Vite Build Configuration & Dev Server Proxy
    └── src/
        ├── App.tsx                      # Root App Component & View Routing State
        ├── main.tsx                     # DOM Mount Entry Point
        ├── index.css                    # Design Tokens, Glassmorphism & Neon Animations
        ├── context/                     # React Context Providers (AuthContext, WorkspaceContext, PromptContext)
        ├── pages/                       # Application Page Views
        │   ├── DashboardPage.tsx        # Command Center Dashboard with Telemetry & Activity Feed
        │   ├── PromptStudioPage.tsx     # Prompt Studio: Optimizations, Scoring & Conversions
        │   ├── LibraryPage.tsx          # Prompt Library (Grid, List, Compact modes + Filter/Search)
        │   ├── KnowledgeBasePage.tsx    # Grounded RAG Studio, Document Ingestion & Vector Querying
        │   ├── MultiAgentStudioPage.tsx # Autonomous Multi-Agent Orchestrator Studio
        │   ├── ComparePage.tsx          # Side-by-Side Prompt Version Comparison
        │   ├── AnalyticsPage.tsx        # Telemetry Metrics, Latency & Token Usage Analytics
        │   ├── ArchitecturePage.tsx     # Interactive Architecture Visualizer Canvas
        │   ├── RAGEvaluationPage.tsx    # RAG Retrieval Evaluation & Precision/Recall Metrics
        │   └── SettingsPage.tsx         # Workspace Settings & Model Preferences
        ├── components/                  # UI Components
        │   ├── common/                  # GlobalSearchModal, AuthModal, EmptyState, ProfileMenu, WorkspaceSettingsModal
        │   ├── dashboard/               # TopNavbar, Sidebar, AILearningRoadmap, StatsCard
        │   └── rag/                     # DocumentUploader, DocumentList, GroundedQA
        ├── services/                    # API Clients & HTTP Wrappers
        │   ├── api.ts                   # Core REST API client for prompts, agents, analytics
        │   └── ragApi.ts                # RAG document ingestion & query API client
        ├── types/                       # TypeScript Interface Definitions
        └── utils/                       # Utility Functions & Formatters
```

---

## 🗄️ Database & Schema Reference

### SQLAlchemy Models (`backend/database/models.py`)

1. **`Prompt` Table**:
   - `id` (INTEGER, Primary Key)
   - `title` (VARCHAR 255)
   - `category` (VARCHAR 100)
   - `content` (TEXT)
   - `tags` (JSON / TEXT)
   - `is_favorite` (BOOLEAN)
   - `workspace_id` (INTEGER, Foreign Key -> `workspaces.id`, Optional)
   - `project_id` (INTEGER, Foreign Key -> `projects.id`, Optional)
   - `created_at` (DATETIME)
   - `updated_at` (DATETIME)

2. **`Document` Table**:
   - `id` (INTEGER, Primary Key)
   - `filename` (VARCHAR 255)
   - `file_type` (VARCHAR 50)
   - `file_size` (INTEGER)
   - `chunk_count` (INTEGER)
   - `workspace_id` (INTEGER, Foreign Key -> `workspaces.id`, Optional)
   - `project_id` (INTEGER, Foreign Key -> `projects.id`, Optional)
   - `storage_path` (VARCHAR 500)
   - `created_at` (DATETIME)

3. **`History` Table**:
   - `id` (INTEGER, Primary Key)
   - `action` (VARCHAR 100)
   - `prompt_title` (VARCHAR 255)
   - `score` (FLOAT)
   - `details` (TEXT)
   - `workspace_id` (INTEGER, Optional)
   - `created_at` (DATETIME)

4. **`Workspace` & `Project` Tables**:
   - Workspaces hold multi-tenant settings, member user IDs, and projects.
   - Projects belong to a Workspace and scope prompts, documents, and agent configurations.

5. **`AgentConfig` Table**:
   - `id` (INTEGER, Primary Key)
   - `name` (VARCHAR 255)
   - `role` (VARCHAR 100)
   - `system_instruction` (TEXT)
   - `temperature` (FLOAT)
   - `memory_type` (VARCHAR 50: `short_term`, `summary`, `vector`)
   - `workspace_id` (INTEGER, Optional)

---

## 📡 REST API Endpoint Documentation

| Method | Endpoint | Description | Request Body / Parameters |
|---|---|---|---|
| `GET` | `/health`, `/api/health` | Service health status check | None |
| `POST` | `/api/optimize` | Optimizes prompt for AI clarity & quality | `{ "prompt": string, "category"?: string }` |
| `POST` | `/api/score` | Calculates 8-dimensional prompt score | `{ "prompt": string }` |
| `POST` | `/api/convert` | Converts prompt to target pattern | `{ "prompt": string, "target_pattern": string }` |
| `POST` | `/api/test` | Executes test run & captures latency/tokens | `{ "prompt": string, "variables"?: object }` |
| `POST` | `/api/search` | Semantic vector search across prompts | `{ "query": string, "top_k"?: number }` |
| `GET` | `/api/prompts` | Fetch all saved prompts | Optional `workspace_id`, `project_id` |
| `POST` | `/api/prompts` | Save a new prompt | Prompt JSON schema |
| `DELETE` | `/api/prompts/{id}` | Delete prompt from DB & ChromaDB | `id: int` |
| `PATCH` | `/api/prompts/{id}/favorite` | Toggle favorite status | `id: int` |
| `GET` | `/api/history` | Retrieve activity history logs | None |
| `POST` | `/api/rag/upload` | Upload & index document in ChromaDB | Form Data: `file`, `chunk_strategy`, `workspace_id` |
| `GET` | `/api/rag/documents` | List indexed RAG documents | Optional `workspace_id` |
| `DELETE` | `/api/rag/documents/{id}` | Remove document & vector chunks | `id: int` |
| `POST` | `/api/rag/query` | Grounded RAG query with scoping | `{ "query": string, "scoping": "all" | "current" | "selected", "document_ids"?: int[] }` |
| `GET/POST` | `/api/agents` | Manage multi-agent configurations | Agent Config JSON |
| `POST` | `/api/agents/execute` | Execute an autonomous agent task | `{ "agent_id": int, "input": string }` |
| `GET/POST` | `/api/workspaces` | Manage multi-tenant workspaces | Workspace JSON |
| `GET` | `/api/analytics/telemetry` | Retrieve LLM latency & token metrics | None |
| `GET` | `/api/tools` | List registered agent execution tools | None |

---

## 🤖 AI Agent Operational Directives

1. **Dual DB & Vector Sync**: Whenever a prompt or document is added, modified, or deleted, ensure BOTH relational storage (SQLite/Supabase) and ChromaDB persistent embeddings are updated in sync.
2. **Metadata Filtering in ChromaDB**: Grounded RAG queries must strictly enforce metadata filtering (`document_id`, `workspace_id`, `project_id`) to maintain tenant data boundaries.
3. **Design System Integrity**: All new UI components added to the React application must use established design tokens (`index.css` glassmorphic cards, neon glowing borders, CSS variables).
4. **Pydantic & TypeScript Alignment**: Keep frontend TypeScript interfaces (`frontend/src/types/`) strictly synchronized with backend Pydantic models (`backend/models/schemas.py`).

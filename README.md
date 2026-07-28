<div align="center">

# ⚡ PromptForge AI

### *Enterprise-Grade AI Engineering Workspace, Autonomous Multi-Agent Studio & Grounded RAG Platform*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0.0-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF6F61.svg?style=for-the-badge&logo=chroma)](https://www.trychroma.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![LangSmith](https://img.shields.io/badge/LangSmith-Tracing_%26_Observability-1C1C1C.svg?style=for-the-badge)](https://smith.langchain.com/)

[Key Features](#-key-features) •
[System Architecture](#-system-architecture) •
[Getting Started](#-getting-started) •
[API Reference](#-api-reference) •
[Database & RAG Vector Schema](#-database--rag-vector-schema) •
[License](#-license)

</div>

---

## 🚀 Overview

**PromptForge AI** is a state-of-the-art enterprise workspace engineered for developers, prompt engineers, and AI researchers. It bridges the gap between raw LLM experimentation and production-grade AI agent deployment. 

Combining **Prompt Optimization & Scoring**, **Pattern Transformation**, **Multi-Format Document Ingestion**, **ChromaDB Vector Retrieval with Scoping**, **Autonomous Multi-Agent Orchestration**, and **Real-Time Telemetry Analytics**, PromptForge AI delivers an end-to-end environment for building reliable, grounded AI systems.

---

## ✨ Key Features

### 🧠 1. Advanced Prompt Studio & 8D Scoring Engine
- **AI Prompt Refinement**: Instantly converts vague, under-specified prompts into highly structured, high-performing instructions using OpenAI (`gpt-4o-mini`, `gpt-4o`) and LangChain.
- **8-Dimensional Quality Radar**: Evaluates prompts across **Clarity, Specificity, Context, Safety, Feasibility, Token Efficiency, Tone Consistency, and Alignment** with interactive Recharts visual radar graphs.
- **Pattern Conversion**: Transform prompts between architectural patterns:
  - `System Role` • `Few-Shot` • `Chain-of-Thought (CoT)` • `JSON Output` • `Function Calling`
- **Diff & Comparison View**: Side-by-side comparison of original vs. optimized prompts with delta scoring and estimated token savings.

### 📚 2. Enterprise Knowledge Base & Grounded RAG Studio
- **Multi-Format Ingestion**: Ingest PDF, DOCX, TXT, Markdown, and source code files.
- **8-Stage Ingestion Pipeline**: Auto-parsing, text cleaning, chunking (Recursive, Semantic, Fixed), embedding creation (`text-embedding-3-small`), and ChromaDB persistence.
- **Retrieval Scoping & Metadata Filtering**: Execute queries restricted across:
  - `All Documents` (Global domain retrieval)
  - `Current Document` (Focused document grounding)
  - `Selected Documents` (Multi-document targeted extraction)
- **MMR Re-Ranking & Grounded Q&A**: Maximal Marginal Relevance re-ranking prevents redundancy, presenting confidence metrics and token execution latency.

### 🤖 3. Autonomous Multi-Agent Studio
- **Agent Orchestration**: Create, configure, and run specialized AI Agents with tailored roles, system prompts, temperature controls, and model bindings.
- **Agent Memory Policy**: Configure short-term context windows, summary memory, or vector long-term memory per agent.
- **Tool Binding Pipeline**: Register custom execution tools (API execution, web search, database querying) directly into agent runs.

### 🏗️ 4. Dynamic Workspaces & Hierarchical Isolation
- **Multi-Tenant Workspaces**: Separate team environments with isolated project hierarchies.
- **Project Isolation**: Scope prompt libraries, document stores, and agent configurations by workspace and project IDs.
- **Enterprise Auth & Security**: Built-in glassmorphic login modal supporting Supabase Authentication, password visibility toggles, and session persistence.

### 📊 5. Real-Time Telemetry & Interactive Architecture Visualizer
- **Telemetry Dashboard**: Monitor overall LLM execution latency, token consumption, query velocity, and vector similarity hit rates.
- **LangSmith Tracing Integration**: Full end-to-end execution observability via LangSmith integration.
- **Interactive Architecture Canvas**: Real-time canvas visualizing backend microservices, vector storage pipelines, SQLite/Supabase tables, and frontend state flow.
- **Global Command Palette (`CTRL + K`)**: Instant search across Prompts, Knowledge Base Documents, and Audit Logs.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([User / Browser]) -->|React 19 + TypeScript| Frontend[Frontend Workspace UI]
    
    subgraph Frontend Architecture
        Frontend --> AuthCtx[Auth Context / Supabase Auth]
        Frontend --> WorkCtx[Workspace Context / Tenant Isolation]
        Frontend --> GlobalSearch[Global Search Modal CTRL+K]
        Frontend --> ArchCanvas[Interactive Architecture Canvas]
    end

    Frontend -->|REST API Requests| FastAPI[FastAPI Backend Server :8000]

    subgraph Backend Microservices
        FastAPI --> PromptsRouter[/api/prompts Router]
        FastAPI --> RAGRouter[/api/rag Router]
        FastAPI --> AgentsRouter[/api/agents Router]
        FastAPI --> AnalyticsRouter[/api/analytics Router]
        FastAPI --> WorkspaceRouter[/api/workspaces Router]
    end

    subgraph Business & AI Layer
        PromptsRouter --> AIService[OpenAI / LangChain Engine]
        RAGRouter --> IngestionService[Document Ingestion & Chunking]
        RAGRouter --> RetrievalService[RAG Retrieval & MMR Re-Ranker]
        AgentsRouter --> AgentMemory[Agent Memory Service]
    end

    subgraph Data & Storage Layer
        AIService -->|Trace & Observability| LangSmith[LangSmith Cloud Platform]
        RetrievalService -->|Embeddings & Similarity| ChromaDB[(ChromaDB Persistent Vector Store)]
        FastAPI -->|ORM Metadata| SQLite[(SQLite / Supabase Postgres)]
    end
```

---

## 🛠️ Tech Stack

| Domain | Core Technologies |
|---|---|
| **Frontend Framework** | React 19, Vite, TypeScript |
| **Styling & UI** | Dark Neon Glassmorphism CSS System, TailwindCSS v4, Framer Motion |
| **Icons & Visuals** | Lucide React, Recharts (Radar / Telemetry Visuals), Sonner Toasts |
| **Backend API Framework** | Python 3.10+, FastAPI, Uvicorn ASGI |
| **AI Orchestration** | LangChain Core, OpenAI API (`gpt-4o-mini`, `gpt-4o`) |
| **Vector Database** | ChromaDB (`text-embedding-3-small`, MMR Re-ranking) |
| **Relational Storage** | SQLite (Development) / Supabase PostgreSQL (Production DDL) |
| **Observability** | LangSmith SDK (`LANGCHAIN_TRACING_V2`) |

---

## 📁 Repository Directory Structure

```
PromptForge AI/
├── .agent/skills/promptforge-ai/SKILL.md  # Architectural Knowledge Base & Agent Guidelines
├── .gitignore                             # Environment, secrets & build exclusion rules
├── README.md                              # Main Project Documentation
├── backend/                               # FastAPI Application
│   ├── main.py                            # FastAPI entry point & CORS configuration
│   ├── config.py                          # App settings & environment parsers
│   ├── seed.py                            # Seed script with 20 curated prompts & vectors
│   ├── requirements.txt                   # Backend dependencies
│   ├── chromadb_store/                    # Vector store client & persistence logic
│   ├── database/                          # DB engine, SQLAlchemy models & Supabase SQL
│   ├── models/                            # Pydantic schemas for API request validation
│   ├── routers/                           # Modular API endpoints (prompts, RAG, agents, etc.)
│   └── services/                          # Business logic (AI engine, document ingestion, retrieval)
└── frontend/                              # React 19 Application
    ├── src/
    │   ├── App.tsx                        # Application router & layout controller
    │   ├── index.css                      # Global Dark Neon design system tokens
    │   ├── context/                       # AuthContext, WorkspaceContext, PromptContext
    │   ├── pages/                         # Studio, RAG, Multi-Agent, Analytics & Compare views
    │   ├── components/                    # Glassmorphic UI components & Modals
    │   └── services/                      # API Axios/Fetch client integration
    ├── vite.config.ts                     # Vite build configuration
    └── package.json                       # Frontend dependencies
```

---

## ⚡ Getting Started

### 📋 Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**: Installed
- **OpenAI API Key**: (Required for AI generation & embeddings)

---

### 🔧 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install required Python packages
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

Open `backend/.env` and supply your OpenAI and optional LangSmith/Supabase keys:

```env
OPENAI_API_KEY=sk-proj-your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# LangSmith Tracing (Optional)
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=ls__your_langsmith_key
LANGSMITH_PROJECT=PromptForge-AI
```

Seed the database with pre-built prompt templates:
```bash
python seed.py
```

Start the FastAPI application:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

> 🌐 Backend service runs at `http://127.0.0.1:8000`  
> 📖 Interactive Swagger API Docs available at `http://127.0.0.1:8000/docs`

---

### 💻 2. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Copy environment template
cp .env.example .env
```

Start the Vite development server:
```bash
npm run dev
```

> 🚀 Open your browser at `http://localhost:5173` to launch PromptForge AI!

---

## 📡 API Endpoint Reference

### 🧠 Prompt Optimization & Scoring Routes
- `POST /api/optimize`: Refine raw prompt input into high-performing structured prompt.
- `POST /api/score`: Calculate 8-dimensional quality score with breakdown ratings.
- `POST /api/convert`: Convert system prompt to target pattern (`few_shot`, `cot`, `json`, `role`).
- `POST /api/test`: Execute prompt run against LLM with token usage telemetry.
- `POST /api/search`: Execute ChromaDB semantic vector search across prompts.

### 📚 Grounded RAG Routes
- `POST /api/rag/upload`: Upload file (PDF, DOCX, TXT, Code) with specified chunking strategy.
- `GET /api/rag/documents`: List indexed documents in knowledge base.
- `DELETE /api/rag/documents/{id}`: Delete indexed document & remove vector chunks from ChromaDB.
- `POST /api/rag/query`: Grounded retrieval Q&A with scoping (`all`, `current`, `selected`).

### 🤖 Multi-Agent & Workspace Routes
- `GET /api/agents`: Retrieve configured AI agents.
- `POST /api/agents`: Create a new autonomous agent configuration.
- `POST /api/agents/execute`: Run autonomous multi-agent task execution pipeline.
- `GET /api/workspaces`: List user workspaces & active projects.
- `GET /api/analytics/telemetry`: Get system latency, token counters, and search metrics.

---

## 🗄️ Database & RAG Vector Schema

### 📊 Relational Database Tables (SQLite / Supabase)
- **`prompts`**: Stores prompt templates, categories, tags, favorites, and workspace associations.
- **`documents`**: Tracks uploaded file metadata, chunk counts, storage paths, and project scoping.
- **`history`**: Logs user prompt executions, score deltas, and timestamped audit records.
- **`workspaces` / `projects`**: Multi-tenant workspace and project scoping definitions.
- **`agent_configs`**: Autonomous agent instructions, memory settings, and tool bindings.

### 🎯 ChromaDB Vector Collection Structure
- **Collection**: `prompt_knowledge_base`
- **Embedding Model**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Metadata Filters**:
  ```json
  {
    "document_id": 12,
    "workspace_id": 1,
    "file_type": "pdf"
  }
  ```

---

## 🛡️ Security & Environment Best Practices

- All API keys (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LANGSMITH_API_KEY`) are protected via `.env` files and excluded from Git via root `.gitignore`.
- Database files (`*.db`), vector indices (`chromadb_store/data/`), and build artifacts are strictly ignored.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository `https://github.com/MdAashif-h/PromptForge-Ai.git`
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more details.

---

<div align="center">
  <sub>Built with ❤️ by <b>MdAashif-h</b> & powered by <b>PromptForge AI Architecture</b>.</sub>
</div>

---
name: promptforge-ai-context
description: Architectural knowledge base, project context, feature summary, API specification, and AI agent operational guidelines for PromptForge AI platform.
---

# PromptForge AI - Project Knowledge Base & AI Agent Context

This document serves as the primary context and operational guide for AI agents working on or reading the **PromptForge AI** repository. It details the project purpose, system architecture, database models, vector search integration, API endpoints, frontend design system, and progress to date.

---

## 🎯 Project Overview

**PromptForge AI** is an advanced, full-stack prompt engineering workspace built to help developers and prompt engineers optimize, evaluate, convert, test, compare, and semantically search AI prompts.

### Key Objectives
1. **Optimization**: Transform raw or vague prompts into structured, highly detailed system/user prompts using OpenAI & LangChain.
2. **Multi-Dimensional Evaluation**: Score prompts across 8 distinct quality metrics (Clarity, Specificity, Context, Output Format, Constraints, Examples, Complexity, Hallucination Risk) using radar charts.
3. **Pattern Conversion**: Convert prompts into proven design patterns (Zero-Shot, Few-Shot, ReAct, Chain-of-Thought, Self-Reflection, Role-Based, JSON Output).
4. **Interactive Playground**: Execute prompts live against LLMs to measure execution speed, token counts, and output quality.
5. **Semantic Library**: Store prompts in a SQLite relational database paired with a **ChromaDB** vector database for vector similarity search (`text-embedding-3-small`).

---

## 🛠️ Technology Stack & Architecture

### Backend Stack
- **Framework**: Python 3.10+ with **FastAPI** & Uvicorn server (`http://127.0.0.1:8000`).
- **AI Core**: LangChain Core & OpenAI SDK (`gpt-4o-mini`).
- **Observability & Tracing**: **LangSmith** (`LANGSMITH_API_KEY`, `LANGCHAIN_TRACING_V2=true`, project: `PromptForge-AI`).
- **Vector Database**: **ChromaDB** (Persistent Client stored in `backend/chromadb_store/`, using `text-embedding-3-small`).
- **Relational Database**: **SQLite** (`backend/database/promptforge.db`) with SQLAlchemy ORM.
- **Data Validation**: Pydantic schemas.

### Frontend Stack
- **Framework**: **React 19** + **Vite** + **TypeScript** (`http://localhost:5173`).
- **Styling**: Custom **Dark Neon** CSS design system (`frontend/src/index.css`) + TailwindCSS v4.
- **Charts & Data Visuals**: Recharts (`RadarChart` for prompt scoring).
- **Icons**: Lucide React.
- **UI Feedback & Toasts**: Sonner toast notifications.
- **Animations**: Framer Motion.

---

## 📁 Repository Structure

```
PromptForge AI/
├── SKILL.md                          # Permanent AI Context & Skill file (this file)
├── README.md                         # Project documentation
├── tmp/                              # Temporary files directory
│   └── temp_project_summary.md       # Temporary snapshot summary
├── backend/                          # FastAPI Backend Application
│   ├── main.py                       # FastAPI entrypoint & CORS middleware
│   ├── seed.py                       # Database & ChromaDB seeder (20 prompts)
│   ├── requirements.txt              # Python package requirements
│   ├── database/                     # SQLAlchemy DB session & connection
│   ├── models/                       # DB Models (Prompt, History)
│   ├── routers/                      # API Endpoints
│   │   ├── prompts.py                # CRUD for Prompts & Favorites
│   │   ├── library.py                # Library query & vector search
│   │   └── history.py                # Activity log endpoints
│   ├── services/                     # Business Logic & AI Integrations
│   │   ├── optimizer.py              # Prompt optimization engine
│   │   ├── scorer.py                 # 8-dimensional scoring logic
│   │   ├── converter.py              # 7 prompt pattern converters
│   │   ├── tester.py                 # Live prompt execution & token tracking
│   │   └── chroma_service.py         # ChromaDB embedding & similarity search
│   └── chromadb_store/               # ChromaDB persistent storage directory
└── frontend/                         # React 19 Frontend Application
    ├── src/
    │   ├── main.tsx                  # React entry point
    │   ├── App.tsx                   # Main layout & router setup
    │   ├── index.css                 # Dark Neon design system & CSS tokens
    │   ├── pages/                    # Main views
    │   │   ├── PromptStudioPage.tsx  # Studio: Optimize, Score, Convert, Test
    │   │   ├── LibraryPage.tsx       # Vector library, Search, Add Custom Prompt
    │   │   ├── ComparePage.tsx       # Side-by-side prompt comparison tool
    │   │   ├── DashboardPage.tsx     # Overview metrics & quick access
    │   │   ├── SettingsPage.tsx      # API key & system settings
    │   │   └── LandingPage.tsx       # Public intro page
    │   ├── components/               # UI components (Navbar, Sidebar, Modals, RadarChart)
    │   ├── services/                 # API service functions (Axios)
    │   └── types/                    # TypeScript interfaces & types
```

---

## 🚀 Features Implemented & Working

| Feature | Description | File Location(s) |
|---|---|---|
| **AI Prompt Optimizer** | Uses LLM to restructure vague prompts into high-precision system prompts with explanation. | `backend/services/optimizer.py`, `frontend/src/pages/PromptStudioPage.tsx` |
| **8D Prompt Scorer** | Analyzes prompts across 8 dimensions (Clarity, Specificity, Context, Output Format, Constraints, Examples, Complexity, Hallucination Risk) & visualizes with Recharts Radar. | `backend/services/scorer.py`, `frontend/src/components/RadarChart.tsx` |
| **Pattern Converter** | Converts prompts into Zero-Shot, Few-Shot, ReAct, Chain-of-Thought, Self-Reflection, Role-Based, and JSON Output formats. | `backend/services/converter.py` |
| **Playground & Test Execution** | Runs prompts against `gpt-4o-mini`, reporting completion response, latency (ms), and token metrics. | `backend/services/tester.py` |
| **Side-by-Side Comparison** | Compares prompt versions, showing score delta, character changes, and cost estimations. | `frontend/src/pages/ComparePage.tsx` |
| **ChromaDB Semantic Search** | Cosine similarity vector search on stored prompts using `text-embedding-3-small`. | `backend/services/chroma_service.py`, `backend/routers/library.py` |
| **Custom Prompt Creation Modal** | Allows users to submit custom prompts via a clean modal interface on the Library page, persisting to SQLite & ChromaDB simultaneously. | `frontend/src/pages/LibraryPage.tsx` |
| **Database Seeding** | Populates SQLite DB and ChromaDB vector collection with 20 curated prompt templates. | `backend/seed.py` |
| **Activity History Logging** | Logs user actions (optimization, scoring, testing) to the DB history table. | `backend/routers/history.py` |

---

## 📡 API Endpoint Reference

| Endpoint | Method | Payload / Params | Description |
|---|---|---|---|
| `/api/optimize` | POST | `{ "prompt": string }` | Returns optimized prompt & explanation |
| `/api/score` | POST | `{ "prompt": string }` | Returns 8 dimension scores & improvement recommendations |
| `/api/convert` | POST | `{ "prompt": string, "pattern": string }` | Converts prompt to chosen design pattern |
| `/api/test` | POST | `{ "prompt": string, "model": string }` | Executes prompt and returns model output & token usage |
| `/api/prompts` | GET | `?category=string&search=string` | Fetches saved prompts with optional filtering |
| `/api/prompts` | POST | `{ "title", "content", "category", "tags", ... }` | Creates custom prompt in SQLite & ChromaDB |
| `/api/prompts/{id}` | DELETE | Path parameter `id` | Deletes prompt from SQLite & ChromaDB vector store |
| `/api/prompts/{id}/favorite` | PATCH | Path parameter `id` | Toggles favorite status (`is_favorite`) |
| `/api/search` | POST | `{ "query": string, "top_k": int }` | Returns semantically matching prompts via ChromaDB vector embeddings |
| `/api/history` | GET | None | Retrieves user action logs |

---

## 🎨 Design System Guidelines (Dark Neon Aesthetic)

When creating or modifying frontend components, adhere strictly to the project's **Dark Neon** styling rules:
- **Backgrounds**: Deep obsidian slate (`#09090B`, `#0C0C0E`).
- **Accent Neon Palette**:
  - **Electric Violet**: `#6C63FF` / `var(--accent-purple)`
  - **Cyan Neon**: `#00D4FF` / `var(--accent-cyan)`
  - **Magenta Neon**: `#FF4ECD` / `var(--accent-magenta)`
  - **Emerald Green**: `#22C55E` / `var(--accent-emerald)`
- **Glassmorphism**: Backdrop blur with semi-transparent dark borders (`border-white/10` or `border-[#6C63FF]/30`).
- **Typography**: Inter / System Sans for general text; **JetBrains Mono** for prompt code blocks.

---

## 🤖 Instructions for AI Agents Working on PromptForge AI

1. **Dual-Store Synchronization**: Always ensure that any action modifying prompt records (Create, Update, Delete) updates **both** SQLite (`database/promptforge.db`) **and** ChromaDB (`backend/chromadb_store/`).
2. **Environment Variables**: Backend operations requiring LLM or Embeddings rely on `OPENAI_API_KEY` set in `backend/.env`.
3. **Seed Script**: If the local SQLite database or ChromaDB index is cleared or corrupted, execute `python seed.py` inside the `backend/` directory to re-populate the vector index.
4. **Development Servers**:
   - Backend: Run with `python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload` from `backend/`.
   - Frontend: Run with `npm run dev` from `frontend/`.

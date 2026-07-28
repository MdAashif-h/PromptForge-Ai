"""PromptForge AI — FastAPI Backend Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from database.database import init_db
from routers import prompts, library, history, rag, agents, workspaces, analytics, evaluations, tools_router

app = FastAPI(
    title="PromptForge AI",
    description="AI-Powered Prompt Engineering API",
    version="1.0.0",
)

# CORS configuration for development and production (Vercel)
import os

origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(prompts.router)
app.include_router(library.router)
app.include_router(history.router)
app.include_router(rag.router)
app.include_router(agents.router)
app.include_router(workspaces.router)
app.include_router(analytics.router)
app.include_router(evaluations.router)
app.include_router(tools_router.router)



@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    init_db()


@app.get("/")
async def root():
    return {"message": "PromptForge AI API", "status": "running"}


@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "healthy"}


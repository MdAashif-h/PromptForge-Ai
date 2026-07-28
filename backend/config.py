"""Centralized RAG Configuration for PromptForge AI."""

import os
from dotenv import load_dotenv

load_dotenv()

# Chunking & Processing Defaults
CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
CHUNK_OVERLAP: int = int(os.getenv("RAG_CHUNK_OVERLAP", "150"))
DEFAULT_CHUNK_STRATEGY: str = os.getenv("RAG_CHUNK_STRATEGY", "Recursive")

# Vector Database Settings
DOCUMENT_COLLECTION: str = os.getenv("CHROMA_DOC_COLLECTION", "knowledge_base")
PROMPT_COLLECTION: str = os.getenv("CHROMA_PROMPT_COLLECTION", "prompt_embeddings")

# Retrieval & LLM Defaults
TOP_K: int = int(os.getenv("RAG_TOP_K", "4"))
SIMILARITY_THRESHOLD: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.7"))
EMBEDDING_MODEL: str = os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-3-small")
LLM_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# LangSmith Observability Configuration
LANGSMITH_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "PromptForge-AI")

# Supabase Configuration
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
DATABASE_URL: str = os.getenv("DATABASE_URL", "")

def is_supabase_configured() -> bool:
    """Check if valid Supabase URL and keys are populated in environment."""
    return bool(SUPABASE_URL and (SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY))

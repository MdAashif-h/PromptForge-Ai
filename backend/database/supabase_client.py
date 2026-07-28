"""Supabase Client & Dynamic DB Session Manager with automatic SQLite fallback."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from config import (
    is_supabase_configured,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL,
)
from .database import Base, engine as sqlite_engine, SessionLocal as SqliteSessionLocal

__all__ = [
    "supabase_client",
    "db_engine",
    "is_using_postgres",
    "is_supabase_configured",
    "get_db",
    "SqliteSessionLocal",
    "get_storage_bucket_name",
]


# 1. Supabase Client Initialization (Service Role Key for Backend)
supabase_client = None
if is_supabase_configured():
    try:
        from supabase import create_client, Client
        key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
        supabase_client = create_client(SUPABASE_URL, key)
        print("[Supabase Client] Successfully initialized Supabase Client.")
    except Exception as e:
        print(f"[Supabase Client] Warning initializing Supabase client: {e}")

# 2. Database Engine Selection & Automatic Fallback
db_engine = sqlite_engine
db_session_factory = SqliteSessionLocal
is_using_postgres = False

if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
    try:
        postgres_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"connect_timeout": 10}
        )
        # Test connection immediately
        with postgres_engine.connect() as conn:
            pass
        
        db_engine = postgres_engine
        db_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
        is_using_postgres = True
        print("[Database Engine] Successfully connected to Supabase PostgreSQL.")
        
        # Ensure all tables exist in Supabase PostgreSQL
        try:
            Base.metadata.create_all(bind=db_engine)
            print("[Database Schema] All tables created/verified on Supabase PostgreSQL.")
        except Exception as schema_err:
            print(f"[Database Schema] Warning creating schema on PostgreSQL: {schema_err}")
            
    except Exception as e:
        print(f"[Database Engine] Warning connecting to PostgreSQL, falling back to SQLite: {e}")
        db_engine = sqlite_engine
        db_session_factory = SqliteSessionLocal
        is_using_postgres = False

# Ensure local SQLite schema is also ready if falling back
if not is_using_postgres:
    try:
        Base.metadata.create_all(bind=sqlite_engine)
        print("[Database Engine] Using local SQLite database engine.")
    except Exception as e:
        print(f"[Database Engine] SQLite initialization notice: {e}")


def get_db() -> Session:
    """Dependency provider for FastAPI route endpoints with resilient fallback."""
    try:
        db = db_session_factory()
    except Exception as db_err:
        print(f"[Database Session] Operational error creating primary DB session, falling back to SQLite: {db_err}")
        db = SqliteSessionLocal()

    try:
        yield db
    finally:
        try:
            db.close()
        except Exception:
            pass


def get_storage_bucket_name() -> str:
    """Return configured storage bucket or fallback."""
    return "documents"


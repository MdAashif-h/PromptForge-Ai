"""SQLite database setup and session management."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATABASE_DIR, exist_ok=True)

DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'promptforge.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


from .supabase_client import get_db


def init_db():
    """Create all tables on both local SQLite engine and active Supabase engine."""
    from .models import Prompt, History, DocumentModel, WorkspaceModel, ProjectModel  # noqa: F401
    Base.metadata.create_all(bind=engine)
    try:
        from .supabase_client import db_engine
        if db_engine != engine:
            Base.metadata.create_all(bind=db_engine)
    except Exception as e:
        print(f"[init_db] Notice creating tables on active engine: {e}")

    # Ensure SQLite columns exist if table was previously created
    from sqlalchemy import text
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN workspace_id VARCHAR DEFAULT 'ws_default'"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN project_id VARCHAR DEFAULT 'proj_default'"))
        except Exception:
            pass



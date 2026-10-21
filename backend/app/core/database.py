"""
SQLAlchemy database engine and session factory.
Supports production PostgreSQL and development SQLite with explicit logging.
"""

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

logger = logging.getLogger("growsphere.database")

# Configure connection parameters based on engine type
connect_args = {}
db_url = settings.DATABASE_URL

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    logger.info("Using SQLite for local development only. Set DATABASE_URL or POSTGRES_* in .env for production.")
elif db_url.startswith("postgresql"):
    logger.info("Connected to PostgreSQL production database engine.")

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency — yields a DB session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

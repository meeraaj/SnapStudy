"""Database engine and session configuration."""

import os

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://snapstudy:snapstudy@localhost:5432/snapstudy"
)

engine = create_engine(DATABASE_URL, echo=False)


def init_db() -> None:
    """Import models and create all tables."""
    import src.models.user  # noqa: F401
    import src.models.subject  # noqa: F401
    import src.models.chapter  # noqa: F401
    import src.models.user_progress  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session():
    """Yield a SQLModel session for FastAPI dependency injection."""
    with Session(engine) as session:
        yield session

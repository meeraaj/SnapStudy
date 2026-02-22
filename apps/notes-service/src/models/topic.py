"""Minimal Topic reference for FK resolution — actual table managed by Alembic."""

import uuid as _uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class Topic(SQLModel, table=True):
    """Stub so SQLModel can resolve foreign_key='topics.id' references."""

    __tablename__ = "topics"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    chapter_id: _uuid.UUID = Field(foreign_key="chapters.id")
    name: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

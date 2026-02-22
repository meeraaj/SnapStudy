"""Minimal Chapter reference for FK resolution — actual table managed by Alembic."""

import uuid as _uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class Chapter(SQLModel, table=True):
    """Stub so SQLModel can resolve foreign_key='chapters.id' references."""

    __tablename__ = "chapters"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    subject_id: _uuid.UUID = Field(foreign_key="subjects.id")
    name: str = Field(max_length=255)
    weight: int = Field(default=1)
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

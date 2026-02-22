"""Minimal Subject reference for FK resolution — actual table managed by Alembic."""

import uuid as _uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class Subject(SQLModel, table=True):
    """Stub so SQLModel can resolve foreign_key='subjects.id' references."""

    __tablename__ = "subjects"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    user_id: _uuid.UUID = Field(foreign_key="users.id")
    name: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

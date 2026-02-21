"""SQLModel — Subject table definition."""

import uuid as _uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class Subject(SQLModel, table=True):
    """A study subject owned by a user (e.g. Mathematics, Physics)."""

    __tablename__ = "subjects"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    user_id: _uuid.UUID = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=255)
    description: str | None = None
    color_hex: str | None = Field(default=None, max_length=7)
    display_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

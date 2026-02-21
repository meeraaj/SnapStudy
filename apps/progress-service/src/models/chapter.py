"""SQLModel — Chapter table definition."""

import uuid as _uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class Chapter(SQLModel, table=True):
    """A chapter within a subject, carrying a difficulty weight (1-10)."""

    __tablename__ = "chapters"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    subject_id: _uuid.UUID = Field(foreign_key="subjects.id", index=True)
    name: str = Field(max_length=255)
    description: str | None = None
    weight: int = Field(default=1, ge=1, le=10)
    display_order: int = Field(default=0)
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

"""SQLModel — UserProgress table definition."""

import uuid as _uuid
from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class UserProgress(SQLModel, table=True):
    """Pre-computed progress snapshot per user per subject."""

    __tablename__ = "user_progress"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    user_id: _uuid.UUID = Field(foreign_key="users.id", index=True)
    subject_id: _uuid.UUID = Field(foreign_key="subjects.id")
    total_weight: int = Field(default=0)
    completed_weight: int = Field(default=0)
    completion_pct: Decimal = Field(default=Decimal("0.00"))
    last_calculated_at: datetime = Field(default_factory=datetime.now)

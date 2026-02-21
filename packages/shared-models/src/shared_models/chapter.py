"""Pydantic schemas for Chapter API responses and requests."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ChapterCreate(BaseModel):
    """Request body to create a chapter."""

    subject_id: uuid.UUID
    name: str = Field(max_length=255)
    description: str | None = None
    weight: int = Field(default=1, ge=1, le=10)
    display_order: int = 0


class ChapterResponse(BaseModel):
    """API response for a chapter."""

    id: uuid.UUID
    subject_id: uuid.UUID
    name: str
    description: str | None
    weight: int
    display_order: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

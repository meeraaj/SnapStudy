"""Pydantic schemas for Subject API responses and requests."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    """Request body to create a subject."""

    name: str = Field(max_length=255)
    description: str | None = None
    color_hex: str | None = Field(default=None, max_length=7)
    display_order: int = 0


class SubjectResponse(BaseModel):
    """API response for a subject."""

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None
    color_hex: str | None
    display_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

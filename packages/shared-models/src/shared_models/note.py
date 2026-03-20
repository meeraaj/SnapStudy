"""Pydantic schemas for PhotoNote API responses and requests."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    """Request body metadata when uploading a photo-note (file sent separately)."""

    topic_id: uuid.UUID | None = None
    caption: str | None = None
    page_number: int = Field(default=1, ge=1)


class NoteResponse(BaseModel):
    """API response for a photo-note."""

    id: uuid.UUID
    topic_id: uuid.UUID | None
    user_id: uuid.UUID
    blob_url: str
    file_name: str
    file_size_kb: int | None
    mime_type: str
    caption: str | None
    ocr_text: str | None
    ai_summary: str | None
    page_number: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

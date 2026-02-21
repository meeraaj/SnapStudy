"""SQLModel — PhotoNote table definition."""

import uuid as _uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class PhotoNote(SQLModel, table=True):
    """A photo of handwritten notes, linked to a topic."""

    __tablename__ = "photo_notes"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    topic_id: _uuid.UUID = Field(foreign_key="topics.id", index=True)
    user_id: _uuid.UUID = Field(foreign_key="users.id", index=True)
    blob_url: str
    blob_key: str
    file_name: str = Field(max_length=512)
    file_size_kb: int | None = None
    mime_type: str = Field(default="image/jpeg", max_length=100)
    caption: str | None = None
    ocr_text: str | None = None  # Extracted by Azure AI Document Intelligence
    page_number: int = Field(default=1)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

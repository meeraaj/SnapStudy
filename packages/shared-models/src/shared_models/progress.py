"""Pydantic schemas for progress API responses."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class ProgressResponse(BaseModel):
    """API response for a user's subject progress."""

    id: uuid.UUID
    user_id: uuid.UUID
    subject_id: uuid.UUID
    total_weight: int
    completed_weight: int
    completion_pct: float
    last_calculated_at: datetime

    model_config = {"from_attributes": True}

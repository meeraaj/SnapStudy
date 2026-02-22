"""Progress routes — weighted progress calculation."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from src.database import get_session
from src.services import calculate_subject_progress

from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/progress", tags=["progress"])


class ProgressResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    subject_id: uuid.UUID
    total_weight: int
    completed_weight: int
    completion_pct: float
    last_calculated_at: datetime
    model_config = {"from_attributes": True}


@router.get("/{subject_id}", response_model=ProgressResponse)
def get_progress(
    subject_id: uuid.UUID,
    user_id: uuid.UUID = Query(...),
    session: Session = Depends(get_session),
):
    """Get (and recalculate) weighted progress for a subject."""
    progress = calculate_subject_progress(session, user_id, subject_id)
    return progress

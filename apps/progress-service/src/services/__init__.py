"""Weighted progress calculation logic."""

from sqlmodel import Session, select

from src.models.chapter import Chapter
from src.models.user_progress import UserProgress

import uuid
from datetime import datetime
from decimal import Decimal


def calculate_subject_progress(session: Session, user_id: uuid.UUID, subject_id: uuid.UUID) -> UserProgress:
    """
    Recalculate weighted completion for a subject.

    Formula: completion_pct = SUM(weight WHERE completed) / SUM(weight) * 100
    """
    chapters = session.exec(
        select(Chapter).where(Chapter.subject_id == subject_id)
    ).all()

    total_weight = sum(ch.weight for ch in chapters)
    completed_weight = sum(ch.weight for ch in chapters if ch.is_completed)
    completion_pct = (
        Decimal(completed_weight) / Decimal(total_weight) * 100
        if total_weight > 0
        else Decimal("0.00")
    )

    # Upsert progress record
    progress = session.exec(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.subject_id == subject_id,
        )
    ).first()

    if progress is None:
        progress = UserProgress(
            user_id=user_id,
            subject_id=subject_id,
        )
        session.add(progress)

    progress.total_weight = total_weight
    progress.completed_weight = completed_weight
    progress.completion_pct = round(completion_pct, 2)
    progress.last_calculated_at = datetime.now()

    session.commit()
    session.refresh(progress)
    return progress

"""Make topic_id nullable in photo_notes

Revision ID: 002_make_topic_nullable
Revises: 001_initial
Create Date: 2026-03-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '002_make_topic_nullable'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('photo_notes', 'topic_id',
               existing_type=sa.UUID(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('photo_notes', 'topic_id',
               existing_type=sa.UUID(),
               nullable=False)

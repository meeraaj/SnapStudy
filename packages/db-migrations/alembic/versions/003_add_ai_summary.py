"""Add ai_summary column to photo_notes

Revision ID: 003_add_ai_summary
Revises: 002_make_topic_nullable
Create Date: 2026-03-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '003_add_ai_summary'
down_revision: Union[str, None] = '002_make_topic_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('photo_notes', sa.Column('ai_summary', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('photo_notes', 'ai_summary')

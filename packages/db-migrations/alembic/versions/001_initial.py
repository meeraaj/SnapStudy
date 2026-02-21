"""001 — Initial schema (multi-user)

Revision ID: 001_initial
Revises: None
Create Date: 2026-02-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users ────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Subjects ─────────────────────────────────────────────────
    op.create_table(
        "subjects",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color_hex", sa.String(7), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_subjects_user", "subjects", ["user_id"])

    # ── Chapters ─────────────────────────────────────────────────
    op.create_table(
        "chapters",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("subject_id", sa.Uuid(), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("weight", sa.SmallInteger(), nullable=False, server_default="1"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("weight BETWEEN 1 AND 10", name="ck_chapters_weight"),
    )
    op.create_index("idx_chapters_subject", "chapters", ["subject_id"])

    # ── Topics ───────────────────────────────────────────────────
    op.create_table(
        "topics",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("chapter_id", sa.Uuid(), sa.ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_topics_chapter", "topics", ["chapter_id"])

    # ── Photo Notes ──────────────────────────────────────────────
    op.create_table(
        "photo_notes",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("topic_id", sa.Uuid(), sa.ForeignKey("topics.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("blob_url", sa.Text(), nullable=False),
        sa.Column("blob_key", sa.Text(), nullable=False),
        sa.Column("file_name", sa.String(512), nullable=False),
        sa.Column("file_size_kb", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=False, server_default="image/jpeg"),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("ocr_text", sa.Text(), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_photo_notes_topic", "photo_notes", ["topic_id"])
    op.create_index("idx_photo_notes_user", "photo_notes", ["user_id"])

    # ── Exam Deadlines ───────────────────────────────────────────
    op.create_table(
        "exam_deadlines",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("subject_id", sa.Uuid(), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("exam_name", sa.String(255), nullable=False),
        sa.Column("exam_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_exam_deadlines_sub", "exam_deadlines", ["subject_id"])

    # ── User Progress ────────────────────────────────────────────
    op.create_table(
        "user_progress",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject_id", sa.Uuid(), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("total_weight", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_weight", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completion_pct", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("last_calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "subject_id", name="uq_user_progress_user_subject"),
    )
    op.create_index("idx_user_progress_user", "user_progress", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_progress")
    op.drop_table("exam_deadlines")
    op.drop_table("photo_notes")
    op.drop_table("topics")
    op.drop_table("chapters")
    op.drop_table("subjects")
    op.drop_table("users")

"""Initial schema — all six tables

Revision ID: 001
Revises:
Create Date: 2026-06-13
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("github_username", sa.String(255)),
        sa.Column("github_token", sa.Text),
        sa.Column("avatar_url", sa.Text),
        sa.Column("bio", sa.Text),
        sa.Column("linkedin_url", sa.Text),
        sa.Column("preferred_roles", postgresql.ARRAY(sa.Text)),
        sa.Column("location", sa.String(255)),
        sa.Column("open_to_work", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("contact_email", sa.String(255)),
        sa.Column("portfolio_public", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("university", sa.String(255)),
        sa.Column("graduation_year", sa.Integer),
        sa.Column("field_of_study", sa.String(255)),
        sa.Column("claimed_skills", postgresql.ARRAY(sa.Text)),
        sa.Column("avg_sentence_variance", sa.Float),
        sa.Column("company_name", sa.String(255)),
        sa.Column("industry", sa.String(255)),
        sa.Column("company_size", sa.String(50)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "verified_artifacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("artifact_type", sa.String(50), nullable=False),
        sa.Column("artifact_name", sa.String(255), nullable=False),
        sa.Column("artifact_url", sa.Text),
        sa.Column("confidence", sa.Float),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("ai_generated", sa.Boolean),
        sa.Column("metadata", postgresql.JSONB),
        sa.Column("hash", sa.String(64)),
        sa.Column("verified_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_verified_artifacts_user_id", "verified_artifacts", ["user_id"])

    op.create_table(
        "credential_ledger",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "artifact_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("verified_artifacts.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("leaf_hash", sa.String(64), nullable=False),
        sa.Column("root_hash", sa.String(64), nullable=False),
        sa.Column("block_index", sa.Integer, nullable=False),
        sa.Column("prev_hash", sa.String(64)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_credential_ledger_user_id", "credential_ledger", ["user_id"])

    op.create_table(
        "simuhire_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "candidate_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "employer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("simulation_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("stakeholder_persona", sa.String(100)),
        sa.Column(
            "conversation",
            postgresql.JSONB,
            nullable=False,
            server_default="[]",
        ),
        sa.Column("evaluator_scores", postgresql.JSONB),
        sa.Column("overall_score", sa.Integer),
        sa.Column("report", postgresql.JSONB),
        sa.Column("candidate_shared", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("retake_available_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_simuhire_sessions_candidate_id", "simuhire_sessions", ["candidate_id"])

    op.create_table(
        "job_listings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "employer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("company", sa.String(255), nullable=False),
        sa.Column("required_skills", postgresql.ARRAY(sa.Text)),
        sa.Column("require_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("require_simuhire", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("description", sa.Text),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_job_listings_employer_id", "job_listings", ["employer_id"])

    op.create_table(
        "consent_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("consent_type", sa.String(100), nullable=False),
        sa.Column(
            "granted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("ip_hash", sa.String(64)),
    )
    op.create_index("ix_consent_log_user_id", "consent_log", ["user_id"])


def downgrade() -> None:
    op.drop_table("consent_log")
    op.drop_table("job_listings")
    op.drop_table("simuhire_sessions")
    op.drop_table("credential_ledger")
    op.drop_table("verified_artifacts")
    op.drop_table("users")

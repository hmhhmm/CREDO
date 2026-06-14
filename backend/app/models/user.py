import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255))  # null for OAuth-only users
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # 'candidate' | 'employer'

    # GitHub OAuth
    github_username: Mapped[Optional[str]] = mapped_column(String(255))
    github_token: Mapped[Optional[str]] = mapped_column(Text)  # Fernet-encrypted

    # Candidate profile fields (editable)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)
    bio: Mapped[Optional[str]] = mapped_column(Text)
    linkedin_url: Mapped[Optional[str]] = mapped_column(Text)
    preferred_roles: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    open_to_work: Mapped[bool] = mapped_column(Boolean, default=False)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    portfolio_public: Mapped[bool] = mapped_column(Boolean, default=False)

    # Candidate academic fields (editable)
    university: Mapped[Optional[str]] = mapped_column(String(255))
    graduation_year: Mapped[Optional[int]] = mapped_column(Integer)
    field_of_study: Mapped[Optional[str]] = mapped_column(String(255))

    # Self-reported unverified skills
    claimed_skills: Mapped[Optional[list]] = mapped_column(ARRAY(Text))

    # Stored for authorship consistency check in Document Agent (F2 Agent B)
    avg_sentence_variance: Mapped[Optional[float]] = mapped_column(Float)

    # Employer-specific fields (editable)
    company_name: Mapped[Optional[str]] = mapped_column(String(255))
    industry: Mapped[Optional[str]] = mapped_column(String(255))
    company_size: Mapped[Optional[str]] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    verified_artifacts: Mapped[list["VerifiedArtifact"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    ledger_entries: Mapped[list["CredentialLedger"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    simuhire_sessions: Mapped[list["SimuhireSession"]] = relationship(
        foreign_keys="SimuhireSession.candidate_id",
        back_populates="candidate",
        cascade="all, delete-orphan",
    )
    job_listings: Mapped[list["JobListing"]] = relationship(
        back_populates="employer", cascade="all, delete-orphan"
    )
    consent_logs: Mapped[list["ConsentLog"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

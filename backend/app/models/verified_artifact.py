import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VerifiedArtifact(Base):
    __tablename__ = "verified_artifacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # 'github' | 'document' | 'credential' | 'simuhire'
    artifact_type: Mapped[str] = mapped_column(String(50), nullable=False)
    artifact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    artifact_url: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    # 'pending' | 'verified' | 'failed'
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    ai_generated: Mapped[Optional[bool]] = mapped_column(Boolean)
    # Scores and metadata — raw content NEVER stored (PDPA)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB)
    hash: Mapped[Optional[str]] = mapped_column(String(64))  # SHA-256 hex of artifact payload
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="verified_artifacts")
    ledger_entry: Mapped[Optional["CredentialLedger"]] = relationship(
        back_populates="artifact", uselist=False
    )

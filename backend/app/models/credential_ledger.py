import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CredentialLedger(Base):
    __tablename__ = "credential_ledger"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    artifact_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("verified_artifacts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    leaf_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    root_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    block_index: Mapped[int] = mapped_column(Integer, nullable=False)
    prev_hash: Mapped[Optional[str]] = mapped_column(String(64))  # null for first entry
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="ledger_entries")
    artifact: Mapped["VerifiedArtifact"] = relationship(back_populates="ledger_entry")

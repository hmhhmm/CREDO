"""
Consent log write helper — PDPA Section 4 compliance.
Every consent event must be recorded before the action that requires consent.
"""
import hashlib
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consent_log import ConsentLog

VALID_CONSENT_TYPES = frozenset({
    "registration",
    "github",
    "document",
    "credential",
    "simuhire",
})


async def log_consent(
    db: AsyncSession,
    user_id: uuid.UUID,
    consent_type: str,
    ip_address: Optional[str] = None,
) -> ConsentLog:
    """
    Write a consent_log row. ip_address is SHA-256 hashed before storage.
    Raises ValueError for unknown consent_type.
    """
    if consent_type not in VALID_CONSENT_TYPES:
        raise ValueError(f"Unknown consent_type: {consent_type!r}")

    ip_hash: Optional[str] = None
    if ip_address:
        ip_hash = hashlib.sha256(ip_address.encode()).hexdigest()

    entry = ConsentLog(user_id=user_id, consent_type=consent_type, ip_hash=ip_hash)
    db.add(entry)
    await db.flush()  # get generated id without committing outer transaction
    return entry


async def has_consent(
    db: AsyncSession,
    user_id: uuid.UUID,
    consent_type: str,
) -> bool:
    """Return True if at least one consent record exists for this user + type."""
    from sqlalchemy import select, exists as sa_exists

    stmt = select(
        sa_exists().where(
            ConsentLog.user_id == user_id,
            ConsentLog.consent_type == consent_type,
        )
    )
    result = await db.execute(stmt)
    return result.scalar()

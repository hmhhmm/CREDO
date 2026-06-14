"""
F4 — Atomic ledger write and integrity verification.

CRITICAL INVARIANT: every call to atomic_ledger_write must run inside an
active SQLAlchemy transaction. Caller is responsible for the transaction boundary.
verified_artifacts and credential_ledger are always written together or not at all.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.credential_ledger import CredentialLedger
from app.models.verified_artifact import VerifiedArtifact
from app.utils.ledger import compute_leaf_hash, compute_merkle_root


async def atomic_ledger_write(
    db: AsyncSession,
    artifact: VerifiedArtifact,
    confidence: float,
    verified_at: Optional[datetime] = None,
    extra_metadata: Optional[dict] = None,
) -> CredentialLedger:
    """
    Atomically:
    1. Updates artifact: status='verified', confidence, verified_at, hash, metadata
    2. Computes leaf hash from artifact payload
    3. Fetches all prior leaf hashes for this user (ordered by block_index)
    4. Computes new Merkle root over all leaves including the new one
    5. Inserts CredentialLedger row

    Must be called inside `async with db.begin()` or equivalent.
    Raises if confidence < 60 (caller should guard against this).
    """
    if confidence < 60:
        raise ValueError(
            f"atomic_ledger_write called with confidence {confidence} — "
            "only verified artifacts (confidence ≥ 60) may be written to the ledger"
        )

    if verified_at is None:
        verified_at = datetime.now(timezone.utc)

    # 1. Update artifact fields
    artifact.status = "verified"
    artifact.confidence = confidence
    artifact.verified_at = verified_at
    if extra_metadata is not None:
        artifact.metadata_ = extra_metadata

    # 2. Compute leaf hash using the canonical payload format
    leaf = compute_leaf_hash(
        user_id=str(artifact.user_id),
        artifact_name=artifact.artifact_name,
        artifact_type=artifact.artifact_type,
        confidence=confidence,
        verified_at_iso=verified_at.isoformat(),
        status="verified",
    )
    artifact.hash = leaf

    await db.flush()  # ensure artifact.id is available for FK

    # 3. Fetch all prior ledger entries for this user in block order
    result = await db.execute(
        select(CredentialLedger)
        .where(CredentialLedger.user_id == artifact.user_id)
        .order_by(CredentialLedger.block_index)
    )
    prior_entries = result.scalars().all()

    # 4. Compute new Merkle root over all leaves (prior + new)
    all_leaves = [e.leaf_hash for e in prior_entries] + [leaf]
    new_root = compute_merkle_root(all_leaves)
    prev_hash = prior_entries[-1].root_hash if prior_entries else None
    block_index = len(prior_entries)

    # 5. Insert ledger entry
    entry = CredentialLedger(
        user_id=artifact.user_id,
        artifact_id=artifact.id,
        leaf_hash=leaf,
        root_hash=new_root,
        block_index=block_index,
        prev_hash=prev_hash,
    )
    db.add(entry)
    await db.flush()
    return entry


async def verify_integrity(db: AsyncSession, user_id: uuid.UUID) -> dict:
    """
    Recompute Merkle root from all stored leaf hashes and compare to stored root.
    Returns intact=True if they match (ledger untampered), False otherwise.
    """
    result = await db.execute(
        select(CredentialLedger)
        .where(CredentialLedger.user_id == user_id)
        .order_by(CredentialLedger.block_index)
    )
    entries = result.scalars().all()

    if not entries:
        return {
            "intact": True,
            "entry_count": 0,
            "computed_root": None,
            "stored_root": None,
        }

    leaf_hashes = [e.leaf_hash for e in entries]
    computed_root = compute_merkle_root(leaf_hashes)
    stored_root = entries[-1].root_hash

    return {
        "intact": computed_root == stored_root,
        "entry_count": len(entries),
        "computed_root": computed_root,
        "stored_root": stored_root,
    }

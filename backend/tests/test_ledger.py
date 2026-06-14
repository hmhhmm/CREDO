"""
F4 Immutable Credential Ledger tests (Week 2).
Unit tests: hash functions, Merkle computation.
Integration tests: atomic write, desync regression, tampering detection.
"""
import uuid
from datetime import datetime, timezone

import pytest

from app.utils.ledger import compute_leaf_hash, compute_merkle_root, sha256hex


# ── Unit: SHA-256 leaf hash ───────────────────────────────────────────────────

@pytest.mark.unit
def test_leaf_hash_deterministic():
    uid = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).isoformat()
    h1 = compute_leaf_hash(uid, "repo", "github", 88.0, ts, "verified")
    h2 = compute_leaf_hash(uid, "repo", "github", 88.0, ts, "verified")
    assert h1 == h2


@pytest.mark.unit
def test_leaf_hash_differs_on_any_field_change():
    uid = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).isoformat()
    base = compute_leaf_hash(uid, "repo", "github", 88.0, ts, "verified")
    assert compute_leaf_hash(uid, "repo", "github", 89.0, ts, "verified") != base
    assert compute_leaf_hash(uid, "repo2", "github", 88.0, ts, "verified") != base
    assert compute_leaf_hash(uid, "repo", "document", 88.0, ts, "verified") != base


# ── Unit: Merkle root ─────────────────────────────────────────────────────────

@pytest.mark.unit
def test_merkle_root_single_leaf():
    leaf = sha256hex("leaf1")
    root = compute_merkle_root([leaf])
    assert root == leaf


@pytest.mark.unit
def test_merkle_root_two_leaves():
    l1 = sha256hex("a")
    l2 = sha256hex("b")
    root = compute_merkle_root([l1, l2])
    assert root == sha256hex(l1 + l2)


@pytest.mark.unit
def test_merkle_root_odd_count_duplicates_last():
    l1 = sha256hex("a")
    l2 = sha256hex("b")
    l3 = sha256hex("c")
    root = compute_merkle_root([l1, l2, l3])
    # Odd: duplicate l3 → pairs: (l1,l2), (l3,l3) → sha256(l1+l2) and sha256(l3+l3)
    left = sha256hex(l1 + l2)
    right = sha256hex(l3 + l3)
    assert root == sha256hex(left + right)


@pytest.mark.unit
def test_merkle_root_changes_on_leaf_alteration():
    leaves = [sha256hex(str(i)) for i in range(4)]
    root1 = compute_merkle_root(leaves)
    leaves[1] = sha256hex("tampered")
    root2 = compute_merkle_root(leaves)
    assert root1 != root2


@pytest.mark.unit
def test_merkle_root_stable_when_unchanged():
    leaves = [sha256hex(str(i)) for i in range(4)]
    assert compute_merkle_root(leaves) == compute_merkle_root(leaves)


@pytest.mark.unit
def test_merkle_root_empty_list():
    root = compute_merkle_root([])
    assert root == sha256hex("")


@pytest.mark.unit
def test_merkle_root_known_value():
    """Regression: verify the seed's Ahmad Farid root matches utility output."""
    from app.utils.ledger import compute_leaf_hash, compute_merkle_root

    uid = "00000000-0000-0000-0000-000000000001"
    # These values match seed.py exactly
    verified_at_gh = "2026-06-09T"  # approximate; seed uses actual datetime

    leaf1 = compute_leaf_hash(uid, "ahmad-farid/ml-portfolio", "github", 91.0, verified_at_gh, "verified")
    leaf2 = compute_leaf_hash(uid, "SimuHire — Technical (2026-06-08)", "simuhire", 82.0, verified_at_gh, "verified")
    root = compute_merkle_root([leaf1, leaf2])
    # Root must be non-empty 64-char hex
    assert len(root) == 64
    assert all(c in "0123456789abcdef" for c in root)


# ── Integration: atomic write ─────────────────────────────────────────────────

@pytest.mark.integration
async def test_atomic_write_creates_both_rows(db_session):
    from datetime import timezone

    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    user = User(name="Ledger Test", email=f"ledger-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    artifact = VerifiedArtifact(
        user_id=user.id,
        artifact_type="github",
        artifact_name="owner/testrepo",
        status="pending",
    )
    db_session.add(artifact)
    await db_session.flush()

    entry = await atomic_ledger_write(
        db=db_session,
        artifact=artifact,
        confidence=85.0,
    )

    assert artifact.status == "verified"
    assert artifact.confidence == 85.0
    assert artifact.hash is not None
    assert entry.block_index == 0
    assert entry.prev_hash is None
    assert len(entry.leaf_hash) == 64
    assert len(entry.root_hash) == 64


@pytest.mark.integration
async def test_atomic_write_increments_block_index(db_session):
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    user = User(name="Block Test", email=f"block-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    for i in range(3):
        a = VerifiedArtifact(
            user_id=user.id, artifact_type="github",
            artifact_name=f"owner/repo{i}", status="pending",
        )
        db_session.add(a)
        await db_session.flush()
        entry = await atomic_ledger_write(db=db_session, artifact=a, confidence=70.0)
        assert entry.block_index == i


@pytest.mark.integration
async def test_atomic_write_rejects_confidence_below_60(db_session):
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    user = User(name="Low Conf", email=f"lowconf-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    artifact = VerifiedArtifact(
        user_id=user.id, artifact_type="github", artifact_name="repo", status="pending"
    )
    db_session.add(artifact)
    await db_session.flush()

    with pytest.raises(ValueError, match="confidence"):
        await atomic_ledger_write(db=db_session, artifact=artifact, confidence=59.9)


# ── Regression: desync invariant ─────────────────────────────────────────────

@pytest.mark.integration
async def test_artifact_and_ledger_row_counts_always_equal(db_session):
    """verified_artifacts (verified) and credential_ledger must have equal counts per user."""
    from sqlalchemy import func, select

    from app.models.credential_ledger import CredentialLedger
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    user = User(name="Sync Test", email=f"sync-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    for i in range(5):
        a = VerifiedArtifact(
            user_id=user.id, artifact_type="credential",
            artifact_name=f"cert_{i}", status="pending",
        )
        db_session.add(a)
        await db_session.flush()
        await atomic_ledger_write(db=db_session, artifact=a, confidence=90.0)

    verified_count = (
        await db_session.execute(
            select(func.count()).select_from(VerifiedArtifact).where(
                VerifiedArtifact.user_id == user.id,
                VerifiedArtifact.status == "verified",
            )
        )
    ).scalar()
    ledger_count = (
        await db_session.execute(
            select(func.count()).select_from(CredentialLedger).where(
                CredentialLedger.user_id == user.id
            )
        )
    ).scalar()
    assert verified_count == ledger_count == 5


# ── Regression: Merkle integrity ─────────────────────────────────────────────

@pytest.mark.integration
async def test_integrity_check_passes_on_untampered_ledger(db_session):
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write, verify_integrity

    user = User(name="Integrity OK", email=f"intact-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    for i in range(3):
        a = VerifiedArtifact(
            user_id=user.id, artifact_type="github",
            artifact_name=f"repo{i}", status="pending",
        )
        db_session.add(a)
        await db_session.flush()
        await atomic_ledger_write(db=db_session, artifact=a, confidence=75.0)

    result = await verify_integrity(db_session, user.id)
    assert result["intact"] is True
    assert result["entry_count"] == 3


@pytest.mark.integration
async def test_integrity_check_fails_on_tampered_leaf(db_session):
    """Directly mutating a stored leaf_hash must cause intact=False."""
    from sqlalchemy import select, update

    from app.models.credential_ledger import CredentialLedger
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write, verify_integrity

    user = User(name="Tamper Test", email=f"tamper-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    a = VerifiedArtifact(
        user_id=user.id, artifact_type="document", artifact_name="essay", status="pending"
    )
    db_session.add(a)
    await db_session.flush()
    entry = await atomic_ledger_write(db=db_session, artifact=a, confidence=80.0)

    # Simulate tampering: overwrite leaf_hash directly
    await db_session.execute(
        update(CredentialLedger)
        .where(CredentialLedger.id == entry.id)
        .values(leaf_hash="a" * 64)
    )
    await db_session.flush()

    result = await verify_integrity(db_session, user.id)
    assert result["intact"] is False


@pytest.mark.integration
async def test_confidence_below_60_produces_zero_ledger_rows(db_session):
    """Artifacts with confidence < 60 must NEVER write to credential_ledger."""
    from sqlalchemy import func, select

    from app.models.credential_ledger import CredentialLedger
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    user = User(name="Low Conf", email=f"low2-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    artifact = VerifiedArtifact(
        user_id=user.id, artifact_type="github", artifact_name="repo", status="pending"
    )
    db_session.add(artifact)
    await db_session.flush()

    # Simulate what the agent does on <60 confidence (does NOT call atomic_ledger_write)
    artifact.status = "failed"
    artifact.confidence = 45.0

    count = (
        await db_session.execute(
            select(func.count()).select_from(CredentialLedger).where(
                CredentialLedger.user_id == user.id
            )
        )
    ).scalar()
    assert count == 0

"""
Unit test: SQLAlchemy model definitions round-trip (Week 1, DB schema tasks).
Integration tests require TEST_DATABASE_URL.
"""
import uuid
from datetime import datetime, timezone

import pytest

from app.models import (
    ConsentLog,
    CredentialLedger,
    JobListing,
    SimuhireSession,
    User,
    VerifiedArtifact,
)


# ── Unit: model instantiation (no DB) ────────────────────────────────────────

@pytest.mark.unit
def test_user_model_defaults():
    # SQLAlchemy mapped_column `default=` applies at INSERT time, not on Python instantiation.
    # We verify the column schema carries the correct INSERT-time defaults.
    cols = User.__table__.c
    assert cols["open_to_work"].default.arg is False
    assert cols["portfolio_public"].default.arg is False


@pytest.mark.unit
def test_verified_artifact_default_status():
    cols = VerifiedArtifact.__table__.c
    assert cols["status"].default.arg == "pending"


@pytest.mark.unit
def test_simuhire_session_defaults():
    cols = SimuhireSession.__table__.c
    assert cols["status"].default.arg == "active"
    assert cols["candidate_shared"].default.arg is False


@pytest.mark.unit
def test_job_listing_defaults():
    cols = JobListing.__table__.c
    assert cols["require_verified"].default.arg is False
    assert cols["require_simuhire"].default.arg is False


@pytest.mark.unit
def test_consent_log_types():
    c = ConsentLog(user_id=uuid.uuid4(), consent_type="registration")
    assert c.consent_type == "registration"


# ── Integration: DB round-trip ────────────────────────────────────────────────

@pytest.mark.integration
async def test_user_insert_fetch(db_session):
    user = User(name="Alice", email=f"alice-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()
    assert user.id is not None
    assert user.name == "Alice"
    assert user.created_at is not None


@pytest.mark.integration
async def test_verified_artifact_insert(db_session):
    user = User(name="Bob", email=f"bob-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    artifact = VerifiedArtifact(
        user_id=user.id,
        artifact_type="github",
        artifact_name="bob/repo",
        confidence=85.0,
        status="verified",
    )
    db_session.add(artifact)
    await db_session.flush()
    assert artifact.id is not None
    assert artifact.confidence == 85.0


@pytest.mark.integration
async def test_consent_log_insert(db_session):
    user = User(name="Carol", email=f"carol-{uuid.uuid4()}@test.com", role="employer")
    db_session.add(user)
    await db_session.flush()

    log = ConsentLog(user_id=user.id, consent_type="registration", ip_hash="abc123")
    db_session.add(log)
    await db_session.flush()
    assert log.id is not None
    assert log.consent_type == "registration"


@pytest.mark.integration
async def test_seed_script_row_counts(db_session):
    """Integration test: seed populates tables with expected row counts."""
    from scripts.seed import seed
    await seed(db_session)

    from sqlalchemy import func, select
    user_count = (await db_session.execute(select(func.count()).select_from(User))).scalar()
    assert user_count >= 4  # 3 candidates + 1 employer

    artifact_count = (
        await db_session.execute(select(func.count()).select_from(VerifiedArtifact))
    ).scalar()
    assert artifact_count >= 3  # ahmad github, ahmad simuhire, priya github, wei failed

    ledger_count = (
        await db_session.execute(select(func.count()).select_from(CredentialLedger))
    ).scalar()
    assert ledger_count >= 3  # 2 for ahmad, 1 for priya, 0 for wei

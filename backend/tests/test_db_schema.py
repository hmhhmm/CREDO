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
    u = User(name="Test", email="t@test.com", role="candidate")
    assert u.role == "candidate"
    assert u.open_to_work is False
    assert u.portfolio_public is False


@pytest.mark.unit
def test_verified_artifact_default_status():
    a = VerifiedArtifact(
        user_id=uuid.uuid4(),
        artifact_type="github",
        artifact_name="repo",
    )
    assert a.status == "pending"


@pytest.mark.unit
def test_simuhire_session_defaults():
    s = SimuhireSession(
        candidate_id=uuid.uuid4(),
        simulation_type="technical",
    )
    assert s.status == "active"
    assert s.candidate_shared is False


@pytest.mark.unit
def test_job_listing_defaults():
    j = JobListing(employer_id=uuid.uuid4(), title="SWE", company="Acme")
    assert j.require_verified is False
    assert j.require_simuhire is False


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

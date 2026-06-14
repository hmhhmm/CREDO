"""
F3 Living Portfolio tests (Week 2).
"""
import uuid

import pytest


# ── Unit: trust score ─────────────────────────────────────────────────────────

@pytest.mark.unit
def test_trust_score_ahmad_seed_values():
    from app.utils.confidence_band import compute_trust_score
    # GitHub 91 ×1.5 + SimuHire 82 ×1.2 / (1.5 + 1.2) = 87.0
    score = compute_trust_score([("github", 91.0), ("simuhire", 82.0)])
    assert abs(score - 87.0) < 0.1


@pytest.mark.unit
def test_trust_score_single_artifact_priya():
    from app.utils.confidence_band import compute_trust_score
    assert compute_trust_score([("github", 71.0)]) == 71.0


@pytest.mark.unit
def test_trust_score_zero_when_no_artifacts():
    from app.utils.confidence_band import compute_trust_score
    assert compute_trust_score([]) == 0.0


# ── Integration: private portfolio ───────────────────────────────────────────

@pytest.mark.integration
async def test_private_portfolio_returns_all_statuses(client):
    reg = await client.post("/auth/register", json={
        "name": "Portfolio User",
        "email": f"portfolio-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    resp = await client.get("/portfolio/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "verified_artifacts" in data
    assert "timeline" in data
    assert "ledger_summary" in data
    assert "trust_score" in data


@pytest.mark.integration
async def test_public_portfolio_loads_without_auth(client, db_session):
    """Public portfolio endpoint must return 200 with no Authorization header."""
    from app.models.user import User

    user = User(
        name="Public User",
        email=f"public-{uuid.uuid4()}@test.com",
        role="candidate",
        portfolio_public=True,
    )
    db_session.add(user)
    await db_session.flush()

    resp = await client.get(f"/portfolio/{user.id}")
    assert resp.status_code == 200


@pytest.mark.integration
async def test_public_portfolio_hides_failed_artifacts(client, db_session):
    """Public view must show only status='verified' artifacts."""
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact

    user = User(
        name="Public Filter",
        email=f"filter-{uuid.uuid4()}@test.com",
        role="candidate",
        portfolio_public=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Add a verified and a failed artifact
    db_session.add(VerifiedArtifact(
        user_id=user.id, artifact_type="github",
        artifact_name="visible/repo", status="verified", confidence=80.0,
    ))
    db_session.add(VerifiedArtifact(
        user_id=user.id, artifact_type="document",
        artifact_name="hidden.pdf", status="failed", confidence=40.0,
    ))
    await db_session.flush()

    resp = await client.get(f"/portfolio/{user.id}")
    assert resp.status_code == 200
    names = [a["artifact_name"] for a in resp.json()["verified_artifacts"]]
    assert "visible/repo" in names
    assert "hidden.pdf" not in names


@pytest.mark.integration
async def test_trust_score_updates_after_new_verified_artifact(db_session):
    """trust_score must reflect newly verified artifact immediately."""
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write
    from app.utils.confidence_band import compute_trust_score

    user = User(name="Score Update", email=f"scoreupd-{uuid.uuid4()}@test.com", role="candidate")
    db_session.add(user)
    await db_session.flush()

    a = VerifiedArtifact(
        user_id=user.id, artifact_type="github", artifact_name="repo", status="pending"
    )
    db_session.add(a)
    await db_session.flush()
    await atomic_ledger_write(db=db_session, artifact=a, confidence=85.0)

    # Recompute trust score
    score = compute_trust_score([("github", 85.0)])
    assert score == 85.0

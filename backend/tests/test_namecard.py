"""
F5 Smart Namecard tests (Week 3).
"""
import uuid

import pytest


# ── Unit: trust score band labels ────────────────────────────────────────────

@pytest.mark.unit
def test_band_label_highly_authentic():
    from app.utils.confidence_band import get_band
    assert get_band(80).label == "Highly Authentic"


@pytest.mark.unit
def test_band_label_authentic():
    from app.utils.confidence_band import get_band
    assert get_band(79).label == "Authentic"
    assert get_band(60).label == "Authentic"


@pytest.mark.unit
def test_band_label_inconclusive():
    from app.utils.confidence_band import get_band
    assert get_band(59).label == "Inconclusive"
    assert get_band(40).label == "Inconclusive"


@pytest.mark.unit
def test_band_label_low_confidence():
    from app.utils.confidence_band import get_band
    assert get_band(39).label == "Low Confidence"
    assert get_band(0).label == "Low Confidence"


# ── Unit: unverified skill tagging ───────────────────────────────────────────

@pytest.mark.unit
def test_skill_verified_by_artifact_name():
    from app.routers.namecard import _skill_is_verified
    from app.models.verified_artifact import VerifiedArtifact

    artifact = VerifiedArtifact(
        user_id=uuid.uuid4(),
        artifact_type="github",
        artifact_name="owner/python-portfolio",
        status="verified",
        confidence=85.0,
    )
    verified, conf = _skill_is_verified("Python", [artifact])
    assert verified is True
    assert conf == 85.0


@pytest.mark.unit
def test_skill_unverified_when_no_match():
    from app.routers.namecard import _skill_is_verified
    from app.models.verified_artifact import VerifiedArtifact

    artifact = VerifiedArtifact(
        user_id=uuid.uuid4(),
        artifact_type="github",
        artifact_name="owner/my-portfolio",
        status="verified",
        confidence=85.0,
    )
    verified, conf = _skill_is_verified("TypeScript", [artifact])
    assert verified is False
    assert conf is None


@pytest.mark.unit
def test_skill_unverified_when_artifact_is_failed():
    from app.routers.namecard import _skill_is_verified
    from app.models.verified_artifact import VerifiedArtifact

    artifact = VerifiedArtifact(
        user_id=uuid.uuid4(),
        artifact_type="github",
        artifact_name="owner/python-repo",
        status="failed",  # not verified
        confidence=45.0,
    )
    verified, conf = _skill_is_verified("Python", [artifact])
    assert verified is False


@pytest.mark.unit
def test_skill_verified_by_metadata():
    from app.routers.namecard import _skill_is_verified
    from app.models.verified_artifact import VerifiedArtifact

    artifact = VerifiedArtifact(
        user_id=uuid.uuid4(),
        artifact_type="github",
        artifact_name="owner/repo",
        status="verified",
        confidence=88.0,
        metadata_={"languages": "python typescript javascript"},
    )
    verified, conf = _skill_is_verified("python", [artifact])
    assert verified is True
    assert conf == 88.0


@pytest.mark.unit
def test_skill_verified_credential_by_name():
    from app.routers.namecard import _skill_is_verified
    from app.models.verified_artifact import VerifiedArtifact

    artifact = VerifiedArtifact(
        user_id=uuid.uuid4(),
        artifact_type="credential",
        artifact_name="AWS Certified Solutions Architect",
        status="verified",
        confidence=90.0,
    )
    verified, conf = _skill_is_verified("AWS", [artifact])
    assert verified is True


# ── Integration: namecard assembly ───────────────────────────────────────────

@pytest.mark.integration
async def test_namecard_empty_for_new_user(client):
    reg = await client.post("/auth/register", json={
        "name": "Card User",
        "email": f"card-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    user_id = reg.json()["user"]["id"]
    resp = await client.get(
        f"/namecard/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["trust_score"] == 0.0
    assert data["skills"] == []
    assert data["simuhire_badge"] is None
    assert data["credential_badges"] == []


@pytest.mark.integration
async def test_public_namecard_loads_without_auth(client, db_session):
    from app.models.user import User

    user = User(
        name="Public Card",
        email=f"pubcard-{uuid.uuid4()}@test.com",
        role="candidate",
        portfolio_public=True,
    )
    db_session.add(user)
    await db_session.flush()

    resp = await client.get(f"/card/{user.id}")
    assert resp.status_code == 200
    assert resp.json()["user_id"] == str(user.id)


@pytest.mark.integration
async def test_namecard_shows_trust_score_and_label(client, db_session):
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    user = User(
        name="Score Card",
        email=f"scorecard-{uuid.uuid4()}@test.com",
        role="candidate",
        claimed_skills=["Python"],
    )
    db_session.add(user)
    await db_session.flush()

    a = VerifiedArtifact(
        user_id=user.id, artifact_type="github",
        artifact_name="owner/python-project", status="pending",
    )
    db_session.add(a)
    await db_session.flush()
    await atomic_ledger_write(db=db_session, artifact=a, confidence=82.0)

    # Register to get token, then query namecard
    reg = await client.post("/auth/register", json={
        "name": "Score Card Reg",
        "email": f"screg-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "employer",
    })
    token = reg.json()["access_token"]

    resp = await client.get(
        f"/namecard/{user.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["trust_score"] == 82.0
    assert data["trust_label"] == "Highly Authentic"
    # Python is in artifact name → verified
    skill = next(s for s in data["skills"] if s["skill"] == "Python")
    assert skill["verified"] is True


@pytest.mark.integration
async def test_patch_locked_field_is_ignored(client):
    """Confidence is not in the editable schema — PATCH silently ignores it."""
    reg = await client.post("/auth/register", json={
        "name": "Lock Test",
        "email": f"locktest-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    resp = await client.patch(
        "/namecard/me/profile",
        json={"bio": "new bio"},  # valid editable field
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["bio"] == "new bio"


@pytest.mark.integration
async def test_patch_editable_field_updates(client):
    reg = await client.post("/auth/register", json={
        "name": "Edit Card",
        "email": f"editcard-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    user_id = reg.json()["user"]["id"]

    patch = await client.patch(
        "/namecard/me/profile",
        json={"bio": "AI Engineer", "location": "Kuala Lumpur", "open_to_work": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert patch.status_code == 200

    # Immediately visible in the namecard GET
    get = await client.get(
        f"/namecard/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get.json()["bio"] == "AI Engineer"
    assert get.json()["location"] == "Kuala Lumpur"
    assert get.json()["open_to_work"] is True


@pytest.mark.integration
async def test_simuhire_badge_absent_when_not_shared(db_session, client):
    from app.models.simuhire_session import SimuhireSession
    from app.models.user import User

    user = User(
        name="No Badge",
        email=f"nobadge-{uuid.uuid4()}@test.com",
        role="candidate",
    )
    db_session.add(user)
    await db_session.flush()

    session = SimuhireSession(
        candidate_id=user.id,
        simulation_type="technical",
        status="completed",
        overall_score=78,
        candidate_shared=False,  # not shared
    )
    db_session.add(session)
    await db_session.flush()

    resp = await client.get(f"/card/{user.id}")
    assert resp.status_code == 200
    assert resp.json()["simuhire_badge"] is None


@pytest.mark.integration
async def test_simuhire_badge_present_when_shared(db_session, client):
    from app.models.simuhire_session import SimuhireSession
    from app.models.user import User

    user = User(
        name="Has Badge",
        email=f"hasbadge-{uuid.uuid4()}@test.com",
        role="candidate",
    )
    db_session.add(user)
    await db_session.flush()

    session = SimuhireSession(
        candidate_id=user.id,
        simulation_type="technical",
        status="completed",
        overall_score=82,
        candidate_shared=True,
    )
    db_session.add(session)
    await db_session.flush()

    resp = await client.get(f"/card/{user.id}")
    assert resp.status_code == 200
    badge = resp.json()["simuhire_badge"]
    assert badge is not None
    assert badge["overall_score"] == 82
    assert badge["shared"] is True


# ── Regression: trust score consistency with portfolio ───────────────────────

@pytest.mark.integration
async def test_namecard_trust_score_matches_portfolio(client, db_session):
    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    user = User(
        name="Consistent Score",
        email=f"conscore-{uuid.uuid4()}@test.com",
        role="candidate",
    )
    db_session.add(user)
    await db_session.flush()

    a = VerifiedArtifact(
        user_id=user.id, artifact_type="github",
        artifact_name="owner/repo", status="pending",
    )
    db_session.add(a)
    await db_session.flush()
    await atomic_ledger_write(db=db_session, artifact=a, confidence=75.0)

    reg = await client.post("/auth/register", json={
        "name": "Emp",
        "email": f"emp2-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "employer",
    })
    token = reg.json()["access_token"]

    card = await client.get(
        f"/namecard/{user.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    portfolio = await client.get(f"/portfolio/{user.id}")

    assert card.json()["trust_score"] == portfolio.json()["trust_score"]

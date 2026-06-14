"""
F1 Authentication tests (Week 1).
Unit tests: bcrypt, JWT, consent helper.
Integration tests: register/login/profile flow, JWT rejection.
"""
import uuid
from datetime import timedelta

import pytest

from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.utils.confidence_band import ARTIFACT_WEIGHTS, compute_trust_score, get_band


# ── Unit: bcrypt ──────────────────────────────────────────────────────────────

@pytest.mark.unit
def test_password_hash_and_verify():
    hashed = hash_password("MyP@ssw0rd")
    assert verify_password("MyP@ssw0rd", hashed) is True


@pytest.mark.unit
def test_wrong_password_fails():
    hashed = hash_password("correct")
    assert verify_password("wrong", hashed) is False


@pytest.mark.unit
def test_hash_is_not_plaintext():
    hashed = hash_password("secret")
    assert hashed != "secret"
    assert hashed.startswith("$2b$")


# ── Unit: JWT ─────────────────────────────────────────────────────────────────

@pytest.mark.unit
def test_access_token_round_trip():
    uid = str(uuid.uuid4())
    token = create_access_token(uid, "candidate")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == uid
    assert payload["role"] == "candidate"
    assert payload["type"] == "access"


@pytest.mark.unit
def test_refresh_token_round_trip():
    uid = str(uuid.uuid4())
    token = create_refresh_token(uid)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == uid
    assert payload["type"] == "refresh"


@pytest.mark.unit
def test_access_token_not_valid_as_refresh():
    token = create_access_token(str(uuid.uuid4()), "employer")
    payload = decode_token(token)
    assert payload["type"] == "access"
    assert payload["type"] != "refresh"


@pytest.mark.unit
def test_decode_garbage_token_returns_none():
    assert decode_token("not.a.real.token") is None


@pytest.mark.unit
def test_decode_empty_string_returns_none():
    assert decode_token("") is None


# ── Unit: confidence band ─────────────────────────────────────────────────────

@pytest.mark.unit
def test_band_highly_authentic():
    band = get_band(80)
    assert band.label == "Highly Authentic"
    assert band.color == "verified"


@pytest.mark.unit
def test_band_authentic():
    assert get_band(60).label == "Authentic"
    assert get_band(79).label == "Authentic"


@pytest.mark.unit
def test_band_inconclusive():
    assert get_band(40).label == "Inconclusive"
    assert get_band(59).label == "Inconclusive"


@pytest.mark.unit
def test_band_low_confidence():
    assert get_band(0).label == "Low Confidence"
    assert get_band(39).label == "Low Confidence"


@pytest.mark.unit
def test_trust_score_empty():
    assert compute_trust_score([]) == 0.0


@pytest.mark.unit
def test_trust_score_ahmad_seed():
    # Ahmad: GitHub 91 (×1.5) + SimuHire 82 (×1.2) = 87.0
    score = compute_trust_score([("github", 91.0), ("simuhire", 82.0)])
    assert abs(score - 87.0) < 0.1


@pytest.mark.unit
def test_trust_score_priya_seed():
    # Priya: GitHub 71 only → 71.0
    score = compute_trust_score([("github", 71.0)])
    assert score == 71.0


@pytest.mark.unit
def test_trust_score_unknown_artifact_type_uses_weight_1():
    score = compute_trust_score([("unknown_type", 100.0)])
    assert score == 100.0


# ── Integration: register / login / profile ───────────────────────────────────

@pytest.mark.integration
async def test_register_creates_user_and_returns_tokens(client):
    resp = await client.post("/auth/register", json={
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.integration
async def test_register_duplicate_email_returns_409(client):
    payload = {
        "name": "Dup",
        "email": "dup@example.com",
        "password": "SecurePass1!",
        "role": "candidate",
    }
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.integration
async def test_login_returns_tokens(client):
    await client.post("/auth/register", json={
        "name": "Login Test",
        "email": "login@example.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    resp = await client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "SecurePass1!",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.integration
async def test_login_wrong_password_returns_401(client):
    await client.post("/auth/register", json={
        "name": "User401",
        "email": "user401@example.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    resp = await client.post("/auth/login", json={
        "email": "user401@example.com",
        "password": "WrongPass!",
    })
    assert resp.status_code == 401


@pytest.mark.integration
async def test_get_me_returns_profile(client):
    reg = await client.post("/auth/register", json={
        "name": "Me Test",
        "email": "me@example.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


@pytest.mark.integration
async def test_update_candidate_profile(client):
    reg = await client.post("/auth/register", json={
        "name": "Profile Test",
        "email": "profile@example.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    resp = await client.patch(
        "/candidates/me/profile",
        json={"bio": "I love Python", "location": "KL", "open_to_work": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["bio"] == "I love Python"
    assert data["location"] == "KL"
    assert data["open_to_work"] is True


# ── Regression: JWT rejections ────────────────────────────────────────────────

@pytest.mark.integration
async def test_expired_token_returns_401(client):
    # Manufacture an already-expired token by patching expiry
    from datetime import datetime, timedelta, timezone
    from jose import jwt
    from app.config import settings

    payload = {
        "sub": str(uuid.uuid4()),
        "role": "candidate",
        "type": "access",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401


@pytest.mark.integration
async def test_malformed_token_returns_401(client):
    resp = await client.get("/auth/me", headers={"Authorization": "Bearer not.a.valid.jwt"})
    assert resp.status_code == 401


@pytest.mark.integration
async def test_refresh_token_rejected_as_access(client):
    reg = await client.post("/auth/register", json={
        "name": "Refresh Test",
        "email": "refresh@example.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    refresh = reg.json()["refresh_token"]
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {refresh}"})
    assert resp.status_code == 401

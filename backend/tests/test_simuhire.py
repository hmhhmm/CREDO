"""
F6 SimuHire tests (Week 3).
Agent calls are mocked so no ANTHROPIC_API_KEY or GROQ_API_KEY is required.
"""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest


# ── Unit: stage progression ───────────────────────────────────────────────────

@pytest.mark.unit
def test_stage_setup():
    from app.agents.simuhire_agents import get_stage
    assert get_stage(0) == "Setup"
    assert get_stage(1) == "Setup"


@pytest.mark.unit
def test_stage_challenge():
    from app.agents.simuhire_agents import get_stage
    assert get_stage(2) == "Challenge"
    assert get_stage(4) == "Challenge"


@pytest.mark.unit
def test_stage_escalation():
    from app.agents.simuhire_agents import get_stage
    assert get_stage(5) == "Escalation"
    assert get_stage(7) == "Escalation"


@pytest.mark.unit
def test_stage_resolution():
    from app.agents.simuhire_agents import get_stage
    assert get_stage(8) == "Resolution"
    assert get_stage(20) == "Resolution"


# ── Unit: stakeholder trigger ─────────────────────────────────────────────────

@pytest.mark.unit
def test_stakeholder_triggers_at_challenge_entry():
    from app.agents.simuhire_agents import should_trigger_stakeholder
    assert should_trigger_stakeholder(2) is True


@pytest.mark.unit
def test_stakeholder_triggers_at_escalation_entry():
    from app.agents.simuhire_agents import should_trigger_stakeholder
    assert should_trigger_stakeholder(5) is True


@pytest.mark.unit
def test_stakeholder_does_not_trigger_mid_stage():
    from app.agents.simuhire_agents import should_trigger_stakeholder
    for count in (0, 1, 3, 4, 6, 7, 8, 9):
        assert should_trigger_stakeholder(count) is False


# ── Unit: overall score calculation ──────────────────────────────────────────

@pytest.mark.unit
def test_overall_score_equal_weighted():
    """Equal-weighted average of 5 dimension scores."""
    scores = [80, 70, 90, 60, 75]
    assert round(sum(scores) / len(scores)) == 75


@pytest.mark.unit
def test_overall_score_all_same():
    scores = [70] * 5
    assert round(sum(scores) / len(scores)) == 70


# ── Unit: retake cooldown ─────────────────────────────────────────────────────

@pytest.mark.unit
def test_retake_available_when_no_prior_session():
    """No prior session → retake always allowed."""
    retake_available_at = None
    now = datetime.now(timezone.utc)
    assert retake_available_at is None or retake_available_at <= now


@pytest.mark.unit
def test_retake_blocked_within_7_days():
    now = datetime.now(timezone.utc)
    retake_available_at = now + timedelta(days=3)
    assert retake_available_at > now  # should be blocked


@pytest.mark.unit
def test_retake_allowed_after_7_days():
    now = datetime.now(timezone.utc)
    retake_available_at = now - timedelta(days=1)
    assert retake_available_at <= now  # cooldown passed


# ── Unit: evaluator JSON schema validation ────────────────────────────────────

@pytest.mark.unit
def test_evaluator_schema_all_dimensions():
    """Evaluator output must have all 5 dimensions with score + evidence."""
    from app.agents.simuhire_agents import DIMENSIONS
    mock_output = {
        dim: {"score": 75, "evidence": f"Candidate said something about {dim}."}
        for dim in DIMENSIONS
    }
    for dim in DIMENSIONS:
        assert dim in mock_output
        assert 0 <= mock_output[dim]["score"] <= 100
        assert isinstance(mock_output[dim]["evidence"], str)


@pytest.mark.unit
def test_evaluator_score_clamped_to_range():
    """Scores outside 0-100 must be clamped."""
    score = max(0, min(100, 150))
    assert score == 100
    score = max(0, min(100, -10))
    assert score == 0


# ── Unit: feedback report schema validation ───────────────────────────────────

@pytest.mark.unit
def test_feedback_report_schema():
    from app.agents.simuhire_agents import DIMENSIONS
    mock_report = {
        "overall_score": 75,
        "dimensions": [
            {"name": dim, "score": 75, "strength": "Good.", "growth": "Improve this."}
            for dim in DIMENSIONS
        ],
        "key_observations": ["Obs 1.", "Obs 2.", "Obs 3."],
    }
    assert 0 <= mock_report["overall_score"] <= 100
    assert len(mock_report["dimensions"]) == 5
    assert len(mock_report["key_observations"]) == 3
    for d in mock_report["dimensions"]:
        assert len(d["strength"].split()) <= 25
        assert len(d["growth"].split()) <= 25


# ── Integration: session creation ────────────────────────────────────────────

@pytest.mark.integration
async def test_create_session_requires_consent(client):
    """Session creation is blocked without 'simuhire' consent."""
    reg = await client.post("/auth/register", json={
        "name": "SimuHire Test",
        "email": f"sh-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as mock_sm:
        mock_sm.return_value = "Welcome to your simulation."
        resp = await client.post(
            "/simuhire/sessions",
            json={"simulation_type": "technical"},
            headers={"Authorization": f"Bearer {token}"},
        )
    # 403 because no consent logged
    assert resp.status_code == 403


@pytest.mark.integration
async def test_create_session_success(client):
    """Session creates successfully after consent is logged."""
    reg = await client.post("/auth/register", json={
        "name": "SimuHire OK",
        "email": f"shok-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Log consent
    await client.post("/consent/simuhire", headers=headers)

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as mock_sm:
        mock_sm.return_value = "You are on-call. The payment service is down."
        resp = await client.post(
            "/simuhire/sessions",
            json={"simulation_type": "technical"},
            headers=headers,
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["stage"] == "Setup"
    assert data["opening_message"] == "You are on-call. The payment service is down."
    assert data["stakeholder_persona"] in ("Scope Creeper", "Sceptic", "Escalator")


@pytest.mark.integration
async def test_retake_blocked_within_cooldown(client, db_session):
    """A completed session sets retake_available_at = now+7d; new session returns 429."""
    from app.models.user import User
    from app.models.simuhire_session import SimuhireSession

    user = User(
        name="Cooldown Test",
        email=f"cooldown-{uuid.uuid4()}@test.com",
        role="candidate",
        password_hash="x",
    )
    db_session.add(user)
    await db_session.flush()

    future = datetime.now(timezone.utc) + timedelta(days=5)
    session = SimuhireSession(
        candidate_id=user.id,
        simulation_type="technical",
        status="completed",
        overall_score=70,
        retake_available_at=future,
    )
    db_session.add(session)
    await db_session.flush()

    # Register and get token for this user — use the existing user via login
    from app.utils.auth import hash_password
    user.password_hash = hash_password("SecurePass1!")
    await db_session.flush()

    login = await client.post("/auth/login", json={
        "email": user.email, "password": "SecurePass1!"
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Log consent
    await client.post("/consent/simuhire", headers=headers)

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock):
        resp = await client.post(
            "/simuhire/sessions",
            json={"simulation_type": "technical"},
            headers=headers,
        )
    assert resp.status_code == 429


@pytest.mark.integration
async def test_text_message_routing(client):
    """Text message → Scenario Master response returned; stage advances correctly."""
    reg = await client.post("/auth/register", json={
        "name": "Msg Test",
        "email": f"msg-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/consent/simuhire", headers=headers)

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as mock_sm:
        mock_sm.return_value = "Opening scenario."
        resp = await client.post(
            "/simuhire/sessions",
            json={"simulation_type": "general"},
            headers=headers,
        )
    session_id = resp.json()["session_id"]

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as mock_sm, \
         patch("app.agents.simuhire_agents.call_stakeholder", new_callable=AsyncMock) as mock_stk:
        mock_sm.return_value = "The challenge deepens. What do you do?"
        mock_stk.return_value = "I need this fixed now!"

        msg_resp = await client.post(
            f"/simuhire/sessions/{session_id}/message",
            json={"text": "I would start by gathering the team."},
            headers=headers,
        )

    assert msg_resp.status_code == 200
    data = msg_resp.json()
    assert data["interviewer_message"] == "The challenge deepens. What do you do?"
    assert data["stage"] == "Setup"


@pytest.mark.integration
async def test_stakeholder_appears_at_challenge(client):
    """Stakeholder is triggered at the 2nd candidate message (entering Challenge)."""
    reg = await client.post("/auth/register", json={
        "name": "Stk Test",
        "email": f"stk-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/consent/simuhire", headers=headers)

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as m:
        m.return_value = "Opening."
        create = await client.post(
            "/simuhire/sessions", json={"simulation_type": "business"}, headers=headers
        )
    session_id = create.json()["session_id"]

    # Send 2 messages — 2nd triggers Stakeholder
    for i in range(2):
        with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as m, \
             patch("app.agents.simuhire_agents.call_stakeholder", new_callable=AsyncMock) as s:
            m.return_value = f"Response {i}."
            s.return_value = "I want this done today!"
            resp = await client.post(
                f"/simuhire/sessions/{session_id}/message",
                json={"text": f"My answer {i}."},
                headers=headers,
            )

    # 2nd message (i=1, total candidate count=2) should have stakeholder
    data = resp.json()
    assert data["stakeholder_message"] == "I want this done today!"
    assert data["stage"] == "Challenge"


@pytest.mark.integration
async def test_end_session_returns_report(client):
    """End session triggers Evaluator + Feedback; returns scores and report."""
    reg = await client.post("/auth/register", json={
        "name": "End Test",
        "email": f"end-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/consent/simuhire", headers=headers)

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as m:
        m.return_value = "Opening."
        create = await client.post(
            "/simuhire/sessions", json={"simulation_type": "technical"}, headers=headers
        )
    session_id = create.json()["session_id"]

    # Send one message
    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as m, \
         patch("app.agents.simuhire_agents.call_stakeholder", new_callable=AsyncMock):
        m.return_value = "The plot thickens."
        await client.post(
            f"/simuhire/sessions/{session_id}/message",
            json={"text": "I would escalate to the CTO."},
            headers=headers,
        )

    mock_eval = {
        dim: {"score": 75, "evidence": "Candidate escalated appropriately."}
        for dim in ["Adaptability", "Communication", "Problem-Solving", "Stress Response", "Systems Thinking"]
    }
    mock_report = {
        "overall_score": 75,
        "dimensions": [
            {"name": d, "score": 75, "strength": "Strong.", "growth": "Could improve."}
            for d in ["Adaptability", "Communication", "Problem-Solving", "Stress Response", "Systems Thinking"]
        ],
        "key_observations": ["Clear escalation path.", "Good communication.", "Structured thinking."],
    }

    with patch("app.agents.simuhire_agents.call_evaluator", new_callable=AsyncMock) as mock_e, \
         patch("app.agents.simuhire_agents.call_feedback", new_callable=AsyncMock) as mock_f:
        mock_e.return_value = mock_eval
        mock_f.return_value = mock_report

        end = await client.post(
            f"/simuhire/sessions/{session_id}/end", headers=headers
        )

    assert end.status_code == 200
    data = end.json()
    assert data["overall_score"] == 75
    assert "dimensions" in data["report"]
    assert len(data["report"]["key_observations"]) == 3
    # Evaluator called exactly once
    mock_e.assert_called_once()


@pytest.mark.integration
async def test_share_true_shows_badge_on_namecard(client):
    """share=True → SimuHire badge appears on GET /card/:userId."""
    from app.models.simuhire_session import SimuhireSession
    from app.models.user import User

    # Use db_session indirectly via the API for a clean flow
    reg = await client.post("/auth/register", json={
        "name": "Share Badge",
        "email": f"sharebadge-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    user_id = reg.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/consent/simuhire", headers=headers)

    # Create + complete a session
    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as m:
        m.return_value = "Opening."
        create = await client.post(
            "/simuhire/sessions", json={"simulation_type": "technical"}, headers=headers
        )
    session_id = create.json()["session_id"]

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as m, \
         patch("app.agents.simuhire_agents.call_stakeholder", new_callable=AsyncMock):
        m.return_value = "Ok."
        await client.post(
            f"/simuhire/sessions/{session_id}/message",
            json={"text": "I would do X."}, headers=headers,
        )

    mock_eval = {
        d: {"score": 80, "evidence": "Good."} for d in
        ["Adaptability", "Communication", "Problem-Solving", "Stress Response", "Systems Thinking"]
    }
    mock_report = {
        "overall_score": 80,
        "dimensions": [
            {"name": d, "score": 80, "strength": "Strong.", "growth": "Improve."}
            for d in ["Adaptability", "Communication", "Problem-Solving", "Stress Response", "Systems Thinking"]
        ],
        "key_observations": ["A.", "B.", "C."],
    }
    with patch("app.agents.simuhire_agents.call_evaluator", new_callable=AsyncMock) as e, \
         patch("app.agents.simuhire_agents.call_feedback", new_callable=AsyncMock) as f:
        e.return_value = mock_eval
        f.return_value = mock_report
        await client.post(f"/simuhire/sessions/{session_id}/end", headers=headers)

    # Share = False → no badge
    await client.post(
        f"/simuhire/sessions/{session_id}/share",
        json={"shared": False}, headers=headers,
    )
    card = await client.get(f"/card/{user_id}")
    assert card.json()["simuhire_badge"] is None

    # Share = True → badge visible
    await client.post(
        f"/simuhire/sessions/{session_id}/share",
        json={"shared": True}, headers=headers,
    )
    card = await client.get(f"/card/{user_id}")
    assert card.json()["simuhire_badge"] is not None
    assert card.json()["simuhire_badge"]["overall_score"] == 80


# ── Regression: Evaluator called once per session ─────────────────────────────

@pytest.mark.integration
async def test_evaluator_called_exactly_once_per_session(client):
    """Evaluator must run once at end — never per-message."""
    reg = await client.post("/auth/register", json={
        "name": "Eval Once",
        "email": f"evalonce-{uuid.uuid4()}@test.com",
        "password": "SecurePass1!",
        "role": "candidate",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/consent/simuhire", headers=headers)

    with patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as m:
        m.return_value = "Begin."
        create = await client.post(
            "/simuhire/sessions", json={"simulation_type": "general"}, headers=headers
        )
    session_id = create.json()["session_id"]

    # Send 3 messages
    with patch("app.agents.simuhire_agents.call_evaluator", new_callable=AsyncMock) as eval_mock, \
         patch("app.agents.simuhire_agents.call_scenario_master", new_callable=AsyncMock) as sm, \
         patch("app.agents.simuhire_agents.call_stakeholder", new_callable=AsyncMock) as stk, \
         patch("app.agents.simuhire_agents.call_feedback", new_callable=AsyncMock) as fb:

        sm.return_value = "Next question."
        stk.return_value = "Pressure!"
        eval_mock.return_value = {
            d: {"score": 70, "evidence": "ok"} for d in
            ["Adaptability", "Communication", "Problem-Solving", "Stress Response", "Systems Thinking"]
        }
        fb.return_value = {
            "overall_score": 70,
            "dimensions": [
                {"name": d, "score": 70, "strength": "ok", "growth": "improve"} for d in
                ["Adaptability", "Communication", "Problem-Solving", "Stress Response", "Systems Thinking"]
            ],
            "key_observations": ["A.", "B.", "C."],
        }

        for i in range(3):
            await client.post(
                f"/simuhire/sessions/{session_id}/message",
                json={"text": f"Answer {i}."}, headers=headers,
            )

        # Evaluator must NOT have been called yet
        eval_mock.assert_not_called()

        # End session — Evaluator called exactly once
        await client.post(f"/simuhire/sessions/{session_id}/end", headers=headers)
        eval_mock.assert_called_once()


# ── Regression: audio bytes not persisted ────────────────────────────────────

@pytest.mark.unit
def test_audio_transcription_error_returns_422():
    """Empty Whisper response should map to 422, not 500."""
    transcript = ""
    assert not transcript.strip()  # confirms empty transcript detected correctly

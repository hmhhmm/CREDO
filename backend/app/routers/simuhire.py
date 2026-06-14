"""
F6 SimuHire endpoints.
  POST /simuhire/sessions                  — create session (consent + cooldown check)
  POST /simuhire/sessions/{id}/message     — send text message, get agent responses
  POST /simuhire/sessions/{id}/audio       — upload audio, transcribe via Groq Whisper, get responses
  POST /simuhire/sessions/{id}/end         — end session → Evaluator → Feedback → ledger write
  GET  /simuhire/sessions/{id}/report      — retrieve Behavioral Traits Report
  POST /simuhire/sessions/{id}/share       — set candidate_shared true/false
"""
import logging
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.agents.simuhire_agents import (
    call_evaluator,
    call_feedback,
    call_scenario_master,
    call_stakeholder,
    get_stage,
    should_trigger_stakeholder,
)
from app.config import settings
from app.database import get_db
from app.models.simuhire_session import SimuhireSession
from app.models.verified_artifact import VerifiedArtifact
from app.routers.deps import get_current_user, require_candidate, require_consent
from app.schemas.simuhire import (
    EndSessionResponse,
    MessageRequest,
    MessageResponse,
    ReportResponse,
    SessionCreateRequest,
    SessionCreateResponse,
    ShareRequest,
    ShareResponse,
)
from app.services.ledger_service import atomic_ledger_write
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["simuhire"])

VALID_SIMULATION_TYPES = {"technical", "business", "general"}
STAKEHOLDER_PERSONAS = ["Scope Creeper", "Sceptic", "Escalator"]
ALLOWED_AUDIO_TYPES = {
    "audio/webm", "audio/mp4", "audio/wav", "audio/mpeg",
    "audio/ogg", "audio/x-m4a", "application/octet-stream",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _candidate_message_count(conversation: list[dict]) -> int:
    return sum(1 for m in conversation if m["speaker"] == "candidate")


def _make_message(speaker: str, text: str, input_mode: str = "text") -> dict:
    return {
        "speaker": speaker,
        "text": text,
        "input_mode": input_mode,
        "timestamp": _now().isoformat(),
    }


async def _get_session_for_candidate(
    session_id: uuid.UUID,
    candidate_id: uuid.UUID,
    db: AsyncSession,
    require_active: bool = True,
) -> SimuhireSession:
    result = await db.execute(
        select(SimuhireSession).where(SimuhireSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session.candidate_id != candidate_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
    if require_active and session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is already '{session.status}'",
        )
    return session


# ── Session creation ──────────────────────────────────────────────────────────

@router.post(
    "/simuhire/sessions",
    response_model=SessionCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    body: SessionCreateRequest,
    current_user: Annotated[User, Depends(require_consent("simuhire"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SessionCreateResponse:
    """
    Create a new SimuHire session. Requires 'simuhire' consent (PDPA).
    Enforces 7-day retake cooldown per simulation_type.
    Returns the session ID and the Scenario Master's opening message.
    """
    if body.simulation_type not in VALID_SIMULATION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"simulation_type must be one of: {sorted(VALID_SIMULATION_TYPES)}",
        )

    # 7-day retake cooldown check
    cooldown_result = await db.execute(
        select(SimuhireSession).where(
            SimuhireSession.candidate_id == current_user.id,
            SimuhireSession.simulation_type == body.simulation_type,
            SimuhireSession.status == "completed",
            SimuhireSession.retake_available_at.is_not(None),
        )
    )
    prior = cooldown_result.scalars().all()
    for s in prior:
        if s.retake_available_at and s.retake_available_at > _now():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Retake cooldown active until "
                    f"{s.retake_available_at.isoformat()}. "
                    "SimuHire can only be retaken once per 7 days per simulation type."
                ),
            )

    persona = random.choice(STAKEHOLDER_PERSONAS)

    session = SimuhireSession(
        candidate_id=current_user.id,
        simulation_type=body.simulation_type,
        status="active",
        stakeholder_persona=persona,
        conversation=[],
    )
    db.add(session)
    await db.flush()

    logger.info(
        "SimuHire session created: id=%s type=%s persona=%s user=%s",
        session.id, body.simulation_type, persona, current_user.id,
    )

    # Get opening message from Scenario Master
    try:
        opening = await call_scenario_master([], body.simulation_type, "Setup")
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    # Store opening message in conversation
    session.conversation = [_make_message("interviewer", opening)]
    flag_modified(session, "conversation")

    return SessionCreateResponse(
        session_id=session.id,
        simulation_type=session.simulation_type,
        stakeholder_persona=persona,
        stage="Setup",
        opening_message=opening,
    )


# ── Text message ──────────────────────────────────────────────────────────────

@router.post("/simuhire/sessions/{session_id}/message", response_model=MessageResponse)
async def send_message(
    session_id: uuid.UUID,
    body: MessageRequest,
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Send a text message. Returns Scenario Master response and optional Stakeholder interjection."""
    return await _process_candidate_message(
        session_id=session_id,
        text=body.text.strip(),
        input_mode="text",
        current_user=current_user,
        db=db,
    )


# ── Audio message ─────────────────────────────────────────────────────────────

@router.post("/simuhire/sessions/{session_id}/audio", response_model=MessageResponse)
async def send_audio(
    session_id: uuid.UUID,
    file: UploadFile,
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    Upload an audio file (webm/mp4/wav/m4a). Transcribed via Groq Whisper,
    then piped into the same agent pipeline as typed text.
    Raw audio bytes are discarded after transcription (PDPA compliant).
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY is not set. Audio transcription unavailable.",
        )

    audio_bytes: Optional[bytes] = None
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) > settings.max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
            )

        # Transcribe via Groq Whisper
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        filename = file.filename or "audio.webm"

        try:
            transcription = await client.audio.transcriptions.create(
                file=(filename, audio_bytes),
                model="whisper-large-v3-turbo",
                response_format="text",
            )
        except Exception as exc:
            logger.exception("Whisper transcription failed for session %s", session_id)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Transcription failed: {exc}",
            )

        # Validate transcript
        transcript_text = (transcription or "").strip()
        if not transcript_text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Transcription returned empty result. Please re-record and try again.",
            )

        logger.info(
            "Audio transcribed for session %s: %d chars", session_id, len(transcript_text)
        )

    finally:
        # PDPA: discard audio bytes immediately after transcription
        if audio_bytes is not None:
            del audio_bytes

    return await _process_candidate_message(
        session_id=session_id,
        text=transcript_text,
        input_mode="audio",
        current_user=current_user,
        db=db,
    )


# ── Shared message pipeline ───────────────────────────────────────────────────

async def _process_candidate_message(
    session_id: uuid.UUID,
    text: str,
    input_mode: str,
    current_user: User,
    db: AsyncSession,
) -> MessageResponse:
    """Core pipeline: append candidate msg → call Scenario Master → optionally call Stakeholder."""
    session = await _get_session_for_candidate(session_id, current_user.id, db, require_active=True)

    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message text cannot be empty",
        )

    # Append candidate message
    conv = list(session.conversation)
    conv.append(_make_message("candidate", text, input_mode))

    # Determine stage AFTER candidate's message
    candidate_count = _candidate_message_count(conv)
    stage = get_stage(candidate_count)

    # Call Scenario Master
    try:
        interviewer_reply = await call_scenario_master(conv, session.simulation_type, stage)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    conv.append(_make_message("interviewer", interviewer_reply))

    # Conditionally call Stakeholder
    stakeholder_reply: Optional[str] = None
    if should_trigger_stakeholder(candidate_count):
        try:
            stakeholder_reply = await call_stakeholder(
                conv, session.stakeholder_persona, session.simulation_type
            )
            conv.append(_make_message("stakeholder", stakeholder_reply))
            logger.info(
                "Stakeholder '%s' triggered at candidate_count=%d session=%s",
                session.stakeholder_persona, candidate_count, session_id,
            )
        except RuntimeError as exc:
            logger.error("Stakeholder agent failed for session %s: %s", session_id, exc)
            # Non-fatal: continue without stakeholder interjection

    session.conversation = conv
    flag_modified(session, "conversation")

    return MessageResponse(
        interviewer_message=interviewer_reply,
        stakeholder_message=stakeholder_reply,
        stage=stage,
    )


# ── End session ───────────────────────────────────────────────────────────────

@router.post("/simuhire/sessions/{session_id}/end", response_model=EndSessionResponse)
async def end_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EndSessionResponse:
    """
    End the session. Runs Evaluator on full transcript (once), then Feedback agent.
    Atomically writes SimuHire result to verified_artifacts + credential_ledger if score ≥60.
    Sets retake_available_at = now + 7 days.
    """
    session = await _get_session_for_candidate(session_id, current_user.id, db, require_active=True)

    if len(session.conversation) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has too few messages to evaluate. Exchange at least one message first.",
        )

    logger.info("Ending SimuHire session %s for user %s", session_id, current_user.id)

    # ── Evaluator (called once on full transcript) ────────────────────────────
    try:
        evaluator_scores = await call_evaluator(session.conversation)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.exception("Evaluator failed for session %s", session_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {exc}",
        )

    # ── Feedback (receives evaluator scores only, not raw transcript) ─────────
    try:
        report = await call_feedback(evaluator_scores, session.simulation_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.exception("Feedback agent failed for session %s", session_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {exc}",
        )

    overall_score = int(report.get("overall_score", 0))
    completed_at = _now()

    # ── Persist session result ────────────────────────────────────────────────
    session.status = "completed"
    session.evaluator_scores = evaluator_scores
    session.report = report
    session.overall_score = overall_score
    session.completed_at = completed_at
    session.retake_available_at = completed_at + timedelta(days=7)
    flag_modified(session, "evaluator_scores")
    flag_modified(session, "report")

    # ── Atomic ledger write if score ≥ 60 ────────────────────────────────────
    ledger_written = False
    if overall_score >= 60:
        artifact_name = (
            f"SimuHire — {session.simulation_type.title()} "
            f"({completed_at.strftime('%Y-%m-%d')})"
        )
        artifact = VerifiedArtifact(
            user_id=current_user.id,
            artifact_type="simuhire",
            artifact_name=artifact_name,
            status="pending",
        )
        db.add(artifact)
        await db.flush()

        try:
            await atomic_ledger_write(
                db=db,
                artifact=artifact,
                confidence=float(overall_score),
                extra_metadata={
                    "simulation_type": session.simulation_type,
                    "overall_score": overall_score,
                    "session_id": str(session.id),
                },
            )
            ledger_written = True
            logger.info(
                "SimuHire ledger written: session=%s score=%d artifact=%s",
                session_id, overall_score, artifact.id,
            )
        except Exception as exc:
            logger.exception("Ledger write failed for SimuHire session %s", session_id)
            # Session result is still saved; ledger failure is logged but non-fatal here
    else:
        logger.info(
            "SimuHire score %d < 60 for session %s — no ledger write",
            overall_score, session_id,
        )

    return EndSessionResponse(
        session_id=session.id,
        overall_score=overall_score,
        report=report,
        evaluator_scores=evaluator_scores,
        ledger_written=ledger_written,
    )


# ── Report retrieval ──────────────────────────────────────────────────────────

@router.get("/simuhire/sessions/{session_id}/report", response_model=ReportResponse)
async def get_report(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportResponse:
    """
    Retrieve the Behavioral Traits Report.
    Candidates see their own report. Employers can only view if candidate_shared=True.
    """
    result = await db.execute(
        select(SimuhireSession).where(SimuhireSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user.role == "candidate" and session.candidate_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")

    if current_user.role == "employer" and not session.candidate_shared:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate has not shared this report",
        )

    if session.status != "completed" or session.report is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report not yet available. End the session first.",
        )

    return ReportResponse(
        session_id=session.id,
        simulation_type=session.simulation_type,
        overall_score=session.overall_score,
        report=session.report,
        evaluator_scores=session.evaluator_scores,
        candidate_shared=session.candidate_shared,
        completed_at=session.completed_at,
    )


# ── Share decision ────────────────────────────────────────────────────────────

@router.post("/simuhire/sessions/{session_id}/share", response_model=ShareResponse)
async def share_session(
    session_id: uuid.UUID,
    body: ShareRequest,
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ShareResponse:
    """Set whether this SimuHire report appears on the public namecard badge."""
    result = await db.execute(
        select(SimuhireSession).where(
            SimuhireSession.id == session_id,
            SimuhireSession.candidate_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only share a completed session",
        )

    session.candidate_shared = body.shared
    logger.info(
        "SimuHire share decision: session=%s shared=%s user=%s",
        session_id, body.shared, current_user.id,
    )

    return ShareResponse(session_id=session.id, candidate_shared=body.shared)

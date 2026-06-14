"""
Candidate-facing profile and browse routes.
  GET   /candidates              — employer browse (paginated; filters in Week 2)
  GET   /candidates/:id          — single candidate summary
  PATCH /candidates/me/profile   — update editable profile fields
"""
import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.simuhire_session import SimuhireSession
from app.models.user import User
from app.models.verified_artifact import VerifiedArtifact
from app.routers.deps import get_current_user, require_candidate
from app.schemas.user import CandidateProfileUpdate, CandidateSummary, UserResponse
from app.utils.confidence_band import compute_trust_score, get_band

router = APIRouter(tags=["candidates"])


async def _build_candidate_summary(user: User, db: AsyncSession) -> CandidateSummary:
    """Assemble a CandidateSummary for browse/namecard responses."""
    artifacts_result = await db.execute(
        select(VerifiedArtifact)
        .where(
            VerifiedArtifact.user_id == user.id,
            VerifiedArtifact.status == "verified",
        )
        .order_by(VerifiedArtifact.verified_at.desc())
    )
    verified_artifacts = artifacts_result.scalars().all()

    verified_skills = [
        {
            "name": a.artifact_name,
            "confidence": a.confidence,
            "artifact_type": a.artifact_type,
        }
        for a in verified_artifacts
        if a.artifact_type != "simuhire"
    ]

    simuhire_artifacts = [a for a in verified_artifacts if a.artifact_type == "simuhire"]
    trust_pairs = [(a.artifact_type, a.confidence) for a in verified_artifacts if a.confidence]
    trust_score = compute_trust_score(trust_pairs)
    band = get_band(trust_score)

    # Check SimuHire completion and share status
    session_result = await db.execute(
        select(SimuhireSession)
        .where(
            SimuhireSession.candidate_id == user.id,
            SimuhireSession.status == "completed",
        )
        .order_by(SimuhireSession.completed_at.desc())
        .limit(1)
    )
    latest_session = session_result.scalar_one_or_none()

    return CandidateSummary(
        id=user.id,
        name=user.name,
        university=user.university,
        graduation_year=user.graduation_year,
        field_of_study=user.field_of_study,
        avatar_url=user.avatar_url,
        location=user.location,
        open_to_work=user.open_to_work,
        trust_score=trust_score,
        trust_label=band.label,
        verified_skills=verified_skills,
        claimed_skills=user.claimed_skills,
        simuhire_completed=latest_session is not None,
        simuhire_shared=latest_session.candidate_shared if latest_session else False,
    )


def _candidate_rank_key(summary: CandidateSummary) -> tuple:
    """
    Ranking: verified candidates above unverified; SimuHire-completed above those without.
    Lower tuple value = higher rank (sort ascending then reverse).
    """
    has_verified = int(bool(summary.verified_skills))
    has_simuhire = int(summary.simuhire_completed)
    return (-has_verified, -has_simuhire, -summary.trust_score)


@router.get("/candidates", response_model=list[CandidateSummary])
async def browse_candidates(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    # Week 2 filters — parsed here so the schema is stable; filtering applied in Week 2
    verified_only: Optional[bool] = Query(None),
    min_trust_score: Optional[int] = Query(None, ge=0, le=100),
    skill_tags: Optional[list[str]] = Query(None),
    simuhire_completed: Optional[bool] = Query(None),
    university: Optional[str] = Query(None),
) -> list[CandidateSummary]:
    result = await db.execute(select(User).where(User.role == "candidate"))
    candidates = result.scalars().all()

    summaries = []
    for user in candidates:
        summary = await _build_candidate_summary(user, db)

        # ── Week 2 filters ────────────────────────────────────────────────────
        if verified_only and not summary.verified_skills:
            continue
        if min_trust_score is not None and summary.trust_score < min_trust_score:
            continue
        if simuhire_completed is not None and summary.simuhire_completed != simuhire_completed:
            continue
        if university and (not user.university or university.lower() not in user.university.lower()):
            continue
        if skill_tags:
            all_skills = {s["name"].lower() for s in summary.verified_skills}
            if user.claimed_skills:
                all_skills |= {s.lower() for s in user.claimed_skills}
            if not any(tag.lower() in all_skills for tag in skill_tags):
                continue

        summaries.append(summary)

    summaries.sort(key=_candidate_rank_key)
    start = (page - 1) * page_size
    return summaries[start : start + page_size]


@router.get("/candidates/{candidate_id}", response_model=CandidateSummary)
async def get_candidate(
    candidate_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CandidateSummary:
    result = await db.execute(
        select(User).where(User.id == candidate_id, User.role == "candidate")
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return await _build_candidate_summary(user, db)


@router.patch("/candidates/me/profile", response_model=UserResponse)
async def update_candidate_profile(
    body: CandidateProfileUpdate,
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    return UserResponse.model_validate(current_user)

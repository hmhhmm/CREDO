"""
F5 Smart Namecard endpoints.
  GET  /namecard/{user_id}       — authenticated namecard view
  GET  /card/{user_id}           — public namecard (no auth required)
  PATCH /namecard/me/profile     — update editable fields only
  GET  /namecard/{user_id}/qr   — QR code PNG for public namecard URL
"""
import io
import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.credential_ledger import CredentialLedger
from app.models.simuhire_session import SimuhireSession
from app.models.user import User
from app.models.verified_artifact import VerifiedArtifact
from app.routers.deps import get_current_user, require_candidate
from app.schemas.namecard import NamecardEditableUpdate, NamecardResponse, SimuHireBadge, SkillEntry
from app.utils.confidence_band import compute_trust_score, get_band

router = APIRouter(tags=["namecard"])


def _skill_is_verified(
    skill: str,
    verified_artifacts: list[VerifiedArtifact],
) -> tuple[bool, Optional[float]]:
    """
    Return (verified, confidence) for a claimed skill.
    A skill is considered verified when its name appears (case-insensitive) in
    any verified artifact's name or in the text representation of its metadata.
    """
    needle = skill.lower()
    for artifact in verified_artifacts:
        if artifact.status != "verified":
            continue
        if needle in artifact.artifact_name.lower():
            return True, artifact.confidence
        if artifact.metadata_ and needle in str(artifact.metadata_).lower():
            return True, artifact.confidence
    return False, None


async def _build_namecard(
    user: User,
    db: AsyncSession,
    public: bool = False,
) -> NamecardResponse:
    # Verified artifacts
    result = await db.execute(
        select(VerifiedArtifact).where(VerifiedArtifact.user_id == user.id)
    )
    artifacts = result.scalars().all()
    verified = [a for a in artifacts if a.status == "verified"]

    # Trust score
    trust_pairs = [(a.artifact_type, a.confidence) for a in verified if a.confidence is not None]
    trust_score = compute_trust_score(trust_pairs)
    band = get_band(trust_score)

    # Skill entries — claimed skills tagged verified/unverified
    claimed = user.claimed_skills or []
    skills: list[SkillEntry] = []
    for skill in claimed:
        is_verified, conf = _skill_is_verified(skill, verified)
        skills.append(SkillEntry(skill=skill, verified=is_verified, confidence=conf))

    # Credential badges — names of verified credential artifacts
    credential_badges = [
        a.artifact_name
        for a in verified
        if a.artifact_type == "credential"
    ]

    # Latest Merkle root hash
    ledger_result = await db.execute(
        select(CredentialLedger)
        .where(CredentialLedger.user_id == user.id)
        .order_by(CredentialLedger.block_index.desc())
        .limit(1)
    )
    latest_ledger = ledger_result.scalar_one_or_none()
    audit_hash = latest_ledger.root_hash if latest_ledger else None

    # SimuHire badge — only if candidate_shared=True
    simuhire_badge: Optional[SimuHireBadge] = None
    session_result = await db.execute(
        select(SimuhireSession)
        .where(
            SimuhireSession.candidate_id == user.id,
            SimuhireSession.status == "completed",
            SimuhireSession.candidate_shared.is_(True),
            SimuhireSession.overall_score.is_not(None),
        )
        .order_by(SimuhireSession.overall_score.desc())
        .limit(1)
    )
    best_session = session_result.scalar_one_or_none()
    if best_session:
        simuhire_badge = SimuHireBadge(
            session_id=best_session.id,
            simulation_type=best_session.simulation_type,
            overall_score=best_session.overall_score,
            shared=True,
        )

    # Contact email — only expose on public view when portfolio_public=True
    contact_email = None
    if not public or user.portfolio_public:
        contact_email = user.contact_email

    return NamecardResponse(
        user_id=user.id,
        name=user.name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        linkedin_url=user.linkedin_url,
        github_username=user.github_username,
        preferred_roles=user.preferred_roles,
        location=user.location,
        contact_email=contact_email,
        open_to_work=user.open_to_work,
        trust_score=trust_score,
        trust_label=band.label,
        skills=skills,
        simuhire_badge=simuhire_badge,
        credential_badges=credential_badges,
        audit_hash=audit_hash,
        public_url=f"{settings.FRONTEND_URL}/card/{user.id}",
    )


@router.get("/namecard/{user_id}/qr")
async def get_namecard_qr(user_id: uuid.UUID) -> StreamingResponse:
    """Generate a QR code PNG pointing to the public namecard URL."""
    try:
        import qrcode  # type: ignore
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="qrcode package not installed",
        )
    url = f"{settings.FRONTEND_URL}/card/{user_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@router.get("/namecard/{user_id}", response_model=NamecardResponse)
async def get_namecard(
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NamecardResponse:
    """
    Authenticated namecard view. Candidates see their own card; employers can
    browse any candidate. Locked fields are computed — never writable.
    """
    result = await db.execute(
        select(User).where(User.id == user_id, User.role == "candidate")
    )
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return await _build_namecard(target, db, public=False)


@router.get("/card/{user_id}", response_model=NamecardResponse)
async def get_public_namecard(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NamecardResponse:
    """Public namecard — no authentication required. Contact email gated by portfolio_public."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.role == "candidate")
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return await _build_namecard(user, db, public=True)


@router.patch("/namecard/me/profile", response_model=NamecardResponse)
async def update_namecard_profile(
    updates: NamecardEditableUpdate,
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NamecardResponse:
    """
    Update editable namecard fields. Locked fields (trust_score, verified skills,
    SimuHire badge, audit_hash) are ignored even if included in the payload.
    """
    editable_map = {
        "avatar_url": updates.avatar_url,
        "bio": updates.bio,
        "linkedin_url": updates.linkedin_url,
        "github_username": updates.github_username,
        "preferred_roles": updates.preferred_roles,
        "location": updates.location,
        "contact_email": updates.contact_email,
        "open_to_work": updates.open_to_work,
        "claimed_skills": updates.claimed_skills,
    }
    for field, value in editable_map.items():
        if value is not None:
            setattr(current_user, field, value)

    await db.flush()
    return await _build_namecard(current_user, db, public=False)

"""
F3 — Living Portfolio endpoints.
  GET /portfolio/me           — private view (all artifacts, timeline, ledger)
  GET /portfolio/{user_id}    — public view (verified only, no auth required)
  GET /artifacts/{id}         — expand single artifact metadata
  POST /portfolio/me/share    — toggle public URL sharing
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.credential_ledger import CredentialLedger
from app.models.user import User
from app.models.verified_artifact import VerifiedArtifact
from app.routers.deps import get_current_user, require_candidate
from app.schemas.artifact import (
    ArtifactResponse,
    LedgerSummary,
    PortfolioResponse,
    TimelineNode,
)
from app.schemas.user import UserResponse
from app.utils.confidence_band import compute_trust_score, get_band

router = APIRouter(tags=["portfolio"])


async def _build_portfolio(user: User, db: AsyncSession, public: bool) -> PortfolioResponse:
    # Fetch artifacts
    stmt = select(VerifiedArtifact).where(VerifiedArtifact.user_id == user.id)
    if public:
        stmt = stmt.where(VerifiedArtifact.status == "verified")
    stmt = stmt.order_by(VerifiedArtifact.created_at.desc())

    result = await db.execute(stmt)
    artifacts = result.scalars().all()

    # Trust score from verified artifacts only
    trust_pairs = [
        (a.artifact_type, a.confidence)
        for a in artifacts
        if a.status == "verified" and a.confidence is not None
    ]
    trust_score = compute_trust_score(trust_pairs)
    band = get_band(trust_score)

    # Timeline (oldest first)
    timeline = [
        TimelineNode(
            artifact_id=a.id,
            artifact_name=a.artifact_name,
            artifact_type=a.artifact_type,
            confidence=a.confidence,
            verified_at=a.verified_at,
            created_at=a.created_at,
        )
        for a in sorted(artifacts, key=lambda x: x.created_at)
        if a.status == "verified"
    ]

    # Ledger summary (latest root hash + count)
    ledger_result = await db.execute(
        select(CredentialLedger)
        .where(CredentialLedger.user_id == user.id)
        .order_by(CredentialLedger.block_index.desc())
        .limit(1)
    )
    latest_entry = ledger_result.scalar_one_or_none()
    ledger_count_result = await db.execute(
        select(CredentialLedger).where(CredentialLedger.user_id == user.id)
    )
    entry_count = len(ledger_count_result.scalars().all())

    ledger_summary = LedgerSummary(
        root_hash=latest_entry.root_hash if latest_entry else None,
        entry_count=entry_count,
    )

    return PortfolioResponse(
        id=user.id,
        name=user.name,
        university=user.university,
        graduation_year=user.graduation_year,
        field_of_study=user.field_of_study,
        avatar_url=user.avatar_url,
        trust_score=trust_score,
        trust_label=band.label,
        verified_artifacts=[ArtifactResponse.model_validate(a) for a in artifacts],
        timeline=timeline,
        ledger_summary=ledger_summary,
        public_url=f"/portfolio/{user.id}",
        contact_email=user.contact_email if (public and user.portfolio_public) else None,
    )


@router.get("/portfolio/me", response_model=PortfolioResponse)
async def get_private_portfolio(
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PortfolioResponse:
    """Private portfolio: all artifacts (pending, verified, failed) + full ledger."""
    return await _build_portfolio(current_user, db, public=False)


@router.get("/portfolio/{user_id}", response_model=PortfolioResponse)
async def get_public_portfolio(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PortfolioResponse:
    """
    Public portfolio — no auth required.
    Only status='verified' artifacts shown. Contact email only if portfolio_public=True.
    """
    result = await db.execute(
        select(User).where(User.id == user_id, User.role == "candidate")
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return await _build_portfolio(user, db, public=True)


@router.get("/artifacts/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact_detail(
    artifact_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ArtifactResponse:
    """Expand a single artifact's full metadata + scores."""
    result = await db.execute(
        select(VerifiedArtifact).where(VerifiedArtifact.id == artifact_id)
    )
    artifact = result.scalar_one_or_none()
    if artifact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    if current_user.role == "candidate" and artifact.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your artifact")
    return ArtifactResponse.model_validate(artifact)


@router.post("/portfolio/me/share")
async def toggle_portfolio_visibility(
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
    public: bool = True,
) -> dict:
    """Toggle the public portfolio URL on or off."""
    current_user.portfolio_public = public
    return {
        "portfolio_public": public,
        "public_url": f"/portfolio/{current_user.id}" if public else None,
    }

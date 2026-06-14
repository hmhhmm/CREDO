"""
F4 — Credential Ledger endpoints.
  GET /ledger/{user_id}         — full audit trail (block index, hashes, timestamps)
  GET /ledger/{user_id}/verify  — recompute Merkle root and return intact flag
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.credential_ledger import CredentialLedger
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.artifact import LedgerEntryResponse, LedgerIntegrityResponse
from app.services.ledger_service import verify_integrity

router = APIRouter(prefix="/ledger", tags=["ledger"])


async def _get_candidate_or_404(user_id: uuid.UUID, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.id == user_id, User.role == "candidate"))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return user


@router.get("/{user_id}", response_model=list[LedgerEntryResponse])
async def get_audit_trail(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[LedgerEntryResponse]:
    """
    Full audit trail for a candidate. Accessible by:
    - The candidate themselves
    - Any authenticated employer
    """
    await _get_candidate_or_404(user_id, db)

    if current_user.role == "candidate" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidates may only view their own ledger",
        )

    result = await db.execute(
        select(CredentialLedger)
        .where(CredentialLedger.user_id == user_id)
        .order_by(CredentialLedger.block_index)
    )
    return [LedgerEntryResponse.model_validate(e) for e in result.scalars().all()]


@router.get("/{user_id}/verify", response_model=LedgerIntegrityResponse)
async def check_integrity(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LedgerIntegrityResponse:
    """
    Public integrity check — no auth required.
    Recomputes Merkle root from stored leaves and compares to stored root.
    intact=True → ledger untampered; intact=False → tampering detected.
    """
    await _get_candidate_or_404(user_id, db)
    result = await verify_integrity(db, user_id)
    return LedgerIntegrityResponse(**result)

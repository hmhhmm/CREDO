"""
Employer-facing profile routes.
  GET   /employers/me/profile   — own employer profile
  PATCH /employers/me/profile   — update editable employer fields
"""
from typing import Annotated

from fastapi import APIRouter, Depends

from app.database import get_db
from app.models.user import User
from app.routers.deps import require_employer
from app.schemas.user import EmployerProfileUpdate, UserResponse
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["employers"])


@router.get("/employers/me/profile", response_model=UserResponse)
async def get_employer_profile(
    current_user: Annotated[User, Depends(require_employer)],
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/employers/me/profile", response_model=UserResponse)
async def update_employer_profile(
    body: EmployerProfileUpdate,
    current_user: Annotated[User, Depends(require_employer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    return UserResponse.model_validate(current_user)

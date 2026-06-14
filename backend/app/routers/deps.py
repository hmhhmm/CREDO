"""
Shared FastAPI dependencies: auth middleware, DB session injection.
"""
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.auth import decode_token

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


async def require_candidate(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != "candidate":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidates only")
    return user


async def require_employer(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != "employer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employers only")
    return user


def require_consent(consent_type: str):
    """
    Returns a FastAPI dependency that blocks the endpoint if the current
    candidate has not logged consent for the given artifact type (PDPA S4).
    Usage: Depends(require_consent("github"))
    """
    async def _check(
        current_user: Annotated[User, Depends(require_candidate)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        from app.utils.consent import has_consent

        if not await has_consent(db, current_user.id, consent_type):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Consent for '{consent_type}' not recorded. "
                    "POST /consent/{consent_type} before uploading."
                ),
            )
        return current_user

    return _check

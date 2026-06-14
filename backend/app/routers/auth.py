"""
F1 Authentication routes:
  POST /auth/register      — email/password registration
  POST /auth/login         — email/password login
  POST /auth/refresh       — refresh access token
  GET  /auth/github        — initiate GitHub OAuth (for login/registration)
  GET  /auth/github/callback — GitHub OAuth callback
  GET  /auth/me            — current user profile
"""
import hashlib
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.utils.consent import log_consent
from app.utils.crypto import encrypt_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        company_name=body.company_name if body.role == "employer" else None,
    )
    db.add(user)
    await db.flush()  # get user.id before consent log

    await log_consent(
        db,
        user_id=user.id,
        consent_type="registration",
        ip_address=request.client.host if request.client else None,
    )

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    import uuid as _uuid

    result = await db.execute(select(User).where(User.id == _uuid.UUID(payload["sub"])))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.get("/github")
async def github_oauth_start() -> dict:
    """
    Returns the GitHub OAuth authorization URL.
    Client redirects the user here; GitHub then redirects back to /auth/github/callback.

    PAUSE: GITHUB_CLIENT_ID must be set before this endpoint is usable.
    """
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth not configured — set GITHUB_CLIENT_ID",
        )
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        "&scope=read:user,user:email,repo"
    )
    return {"authorization_url": url}


@router.get("/github/callback", response_model=TokenResponse)
async def github_oauth_callback(
    code: str,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """
    Exchange GitHub code for access token, upsert user, return JWT pair.

    PAUSE: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set.
    """
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth not configured",
        )

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_resp.json()

    gh_token = token_data.get("access_token")
    if not gh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub OAuth failed — no access token returned",
        )

    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/vnd.github+json"},
        )
        emails_resp = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/vnd.github+json"},
        )

    gh_user = user_resp.json()
    gh_emails = emails_resp.json()

    primary_email = next(
        (e["email"] for e in gh_emails if e.get("primary") and e.get("verified")),
        gh_user.get("email"),
    )
    if not primary_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account has no verified primary email",
        )

    result = await db.execute(select(User).where(User.email == primary_email))
    user = result.scalar_one_or_none()

    encrypted_token = encrypt_token(gh_token) if settings.FERNET_KEY else gh_token

    if user is None:
        user = User(
            name=gh_user.get("name") or gh_user.get("login", "GitHub User"),
            email=primary_email,
            role="candidate",
            github_username=gh_user.get("login"),
            github_token=encrypted_token,
            avatar_url=gh_user.get("avatar_url"),
            bio=gh_user.get("bio"),
        )
        db.add(user)
        await db.flush()
        await log_consent(
            db,
            user_id=user.id,
            consent_type="registration",
            ip_address=request.client.host if request.client else None,
        )
    else:
        user.github_username = gh_user.get("login")
        user.github_token = encrypted_token

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserResponse:
    return UserResponse.model_validate(current_user)

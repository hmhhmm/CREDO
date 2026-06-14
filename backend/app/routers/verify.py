"""
F2 — Verification endpoints.
  POST /consent/{consent_type}       — log per-artifact consent (PDPA)
  GET  /verify/repos                 — list candidate's GitHub repos
  POST /verify/github                — trigger GitHub Agent ARQ job
  GET  /verify/artifacts/{id}        — poll artifact status
  POST /verify/document              — trigger Document Agent ARQ job
  POST /verify/credential            — trigger Credential Agent ARQ job
"""
import hashlib
import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status

logger = logging.getLogger(__name__)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.verified_artifact import VerifiedArtifact
from app.routers.deps import get_current_user, require_candidate, require_consent
from app.schemas.artifact import ArtifactResponse, VerifyGitHubRequest, VerifyTriggerResponse
from app.utils.consent import log_consent

router = APIRouter(tags=["verify"])


# ── Consent endpoint (PDPA) ───────────────────────────────────────────────────

@router.post("/consent/{consent_type}", status_code=status.HTTP_201_CREATED)
async def record_consent(
    consent_type: str,
    request: Request,
    current_user: Annotated[User, Depends(require_candidate)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Log per-artifact consent before any upload. Must be called before verify endpoints."""
    valid_types = {"github", "document", "credential", "simuhire"}
    if consent_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"consent_type must be one of {sorted(valid_types)}",
        )
    await log_consent(
        db,
        user_id=current_user.id,
        consent_type=consent_type,
        ip_address=request.client.host if request.client else None,
    )
    return {"consented": True, "consent_type": consent_type}


# ── GitHub Agent ──────────────────────────────────────────────────────────────

@router.get("/verify/repos")
async def list_github_repos(
    current_user: Annotated[User, Depends(require_candidate)],
) -> list[dict]:
    """
    Returns the candidate's public GitHub repos.
    Requires github_token stored from OAuth flow.
    """
    if not current_user.github_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub not connected. Complete GitHub OAuth first.",
        )
    from github import Github

    from app.utils.crypto import decrypt_token

    try:
        token = decrypt_token(current_user.github_token) if settings.FERNET_KEY else current_user.github_token
        g = Github(token)
        gh_user = g.get_user()
        repos = gh_user.get_repos(type="owner", sort="updated")
        return [
            {
                "full_name": r.full_name,
                "name": r.name,
                "description": r.description,
                "language": r.language,
                "stars": r.stargazers_count,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in list(repos)[:50]
        ]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API error: {exc}",
        )


@router.post("/verify/github", response_model=VerifyTriggerResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_github_verification(
    body: VerifyGitHubRequest,
    current_user: Annotated[User, Depends(require_consent("github"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VerifyTriggerResponse:
    """
    Enqueues a GitHub analysis ARQ job.
    Returns artifact_id immediately; poll GET /verify/artifacts/{id} for result.
    """
    if not current_user.github_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub not connected. Complete GitHub OAuth first.",
        )

    artifact = VerifiedArtifact(
        user_id=current_user.id,
        artifact_type="github",
        artifact_name=body.repo_full_name,
        artifact_url=f"https://github.com/{body.repo_full_name}",
        status="pending",
    )
    db.add(artifact)
    await db.flush()

    job_id: str | None = None
    try:
        from arq import create_pool
        from arq.connections import RedisSettings

        pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
        job = await pool.enqueue_job(
            "run_github_analysis",
            str(artifact.id),
            body.repo_full_name,
        )
        await pool.aclose()
        job_id = job.job_id if job else None
    except Exception as exc:
        logger.exception("Failed to enqueue GitHub analysis job for artifact %s", artifact.id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Verification queue unavailable: {exc}",
        )

    return VerifyTriggerResponse(
        artifact_id=artifact.id,
        status="pending",
        job_id=job_id,
    )


# ── Poll endpoint (all agents) ────────────────────────────────────────────────

@router.get("/verify/artifacts/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact_status(
    artifact_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ArtifactResponse:
    """Poll the status of any verification artifact."""
    result = await db.execute(
        select(VerifiedArtifact).where(VerifiedArtifact.id == artifact_id)
    )
    artifact = result.scalar_one_or_none()
    if artifact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")

    if current_user.role == "candidate" and artifact.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your artifact")

    return ArtifactResponse.model_validate(artifact)


# ── Document Agent ────────────────────────────────────────────────────────────

@router.post(
    "/verify/document",
    response_model=VerifyTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_document_verification(
    file: UploadFile,
    current_user: Annotated[User, Depends(require_consent("document"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VerifyTriggerResponse:
    """
    Accepts PDF or DOCX (≤10MB). Content is read into memory only — never written to disk.
    Enqueues Document Agent ARQ job.
    """
    allowed = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in allowed and not (
        (file.filename or "").lower().endswith((".pdf", ".docx"))
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only PDF and DOCX files are accepted",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
        )

    # Hash the file for storage (content itself is discarded after job)
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    filename = file.filename or "document"

    artifact = VerifiedArtifact(
        user_id=current_user.id,
        artifact_type="document",
        artifact_name=filename,
        status="pending",
        hash=file_hash,
    )
    db.add(artifact)
    await db.flush()

    job_id: str | None = None
    try:
        from arq import create_pool
        from arq.connections import RedisSettings

        pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
        job = await pool.enqueue_job(
            "run_document_analysis",
            str(artifact.id),
            file_bytes,   # passed to job; discarded from memory after job completes
            filename,
        )
        await pool.aclose()
        job_id = job.job_id if job else None
    except Exception as exc:
        logger.exception("Failed to enqueue Document analysis job for artifact %s", artifact.id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Verification queue unavailable: {exc}",
        )
    finally:
        # PDPA: discard file bytes from this scope regardless of job outcome
        del file_bytes

    return VerifyTriggerResponse(artifact_id=artifact.id, status="pending", job_id=job_id)


# ── Credential Agent ──────────────────────────────────────────────────────────

@router.post(
    "/verify/credential",
    response_model=VerifyTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_credential_verification(
    file: UploadFile,
    current_user: Annotated[User, Depends(require_consent("credential"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VerifyTriggerResponse:
    """
    Accepts JPG, PNG, or PDF certificate (≤10MB). Read into memory only — never written to disk.
    Enqueues Credential Agent ARQ job.

    NOTE: Requires system Tesseract (tesseract-ocr) to be installed for OCR.
    Install: https://github.com/UB-Mannheim/tesseract/wiki (Windows)
             apt install tesseract-ocr (Linux)
    """
    allowed_ext = (".jpg", ".jpeg", ".png", ".pdf")
    fname = (file.filename or "").lower()
    if not any(fname.endswith(ext) for ext in allowed_ext):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only JPG, PNG, and PDF certificates are accepted",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
        )

    file_hash = hashlib.sha256(file_bytes).hexdigest()
    filename = file.filename or "certificate"

    artifact = VerifiedArtifact(
        user_id=current_user.id,
        artifact_type="credential",
        artifact_name=filename,
        status="pending",
        hash=file_hash,
    )
    db.add(artifact)
    await db.flush()

    job_id: str | None = None
    try:
        from arq import create_pool
        from arq.connections import RedisSettings

        pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
        job = await pool.enqueue_job(
            "run_credential_analysis",
            str(artifact.id),
            file_bytes,
            filename,
            str(current_user.id),
            current_user.name,
        )
        await pool.aclose()
        job_id = job.job_id if job else None
    except Exception as exc:
        logger.exception("Failed to enqueue Credential analysis job for artifact %s", artifact.id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Verification queue unavailable: {exc}",
        )
    finally:
        del file_bytes

    return VerifyTriggerResponse(artifact_id=artifact.id, status="pending", job_id=job_id)

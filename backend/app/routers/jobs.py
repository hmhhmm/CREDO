"""
Job listings routes (F1).
  POST   /jobs             — employer creates listing
  GET    /jobs             — public listing of all jobs
  GET    /jobs/:id         — single job listing
  PATCH  /jobs/:id         — employer updates own listing
  DELETE /jobs/:id         — employer deletes own listing
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.job_listing import JobListing
from app.models.user import User
from app.routers.deps import require_employer
from app.schemas.job import JobListingCreate, JobListingResponse, JobListingUpdate

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobListingResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    body: JobListingCreate,
    current_user: Annotated[User, Depends(require_employer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobListingResponse:
    listing = JobListing(
        employer_id=current_user.id,
        title=body.title,
        company=body.company or current_user.company_name or "",
        required_skills=body.required_skills,
        require_verified=body.require_verified,
        require_simuhire=body.require_simuhire,
        description=body.description,
    )
    db.add(listing)
    await db.flush()
    return JobListingResponse.model_validate(listing)


@router.get("", response_model=list[JobListingResponse])
async def list_jobs(db: Annotated[AsyncSession, Depends(get_db)]) -> list[JobListingResponse]:
    result = await db.execute(select(JobListing).order_by(JobListing.created_at.desc()))
    return [JobListingResponse.model_validate(j) for j in result.scalars().all()]


@router.get("/{job_id}", response_model=JobListingResponse)
async def get_job(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobListingResponse:
    result = await db.execute(select(JobListing).where(JobListing.id == job_id))
    listing = result.scalar_one_or_none()
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job listing not found")
    return JobListingResponse.model_validate(listing)


@router.patch("/{job_id}", response_model=JobListingResponse)
async def update_job(
    job_id: uuid.UUID,
    body: JobListingUpdate,
    current_user: Annotated[User, Depends(require_employer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobListingResponse:
    result = await db.execute(select(JobListing).where(JobListing.id == job_id))
    listing = result.scalar_one_or_none()
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job listing not found")
    if listing.employer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your listing")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(listing, field, value)
    return JobListingResponse.model_validate(listing)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_employer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    result = await db.execute(select(JobListing).where(JobListing.id == job_id))
    listing = result.scalar_one_or_none()
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job listing not found")
    if listing.employer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your listing")
    await db.delete(listing)

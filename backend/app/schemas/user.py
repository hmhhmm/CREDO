import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class CandidateProfileUpdate(BaseModel):
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_username: Optional[str] = None
    preferred_roles: Optional[list[str]] = None
    location: Optional[str] = None
    open_to_work: Optional[bool] = None
    contact_email: Optional[EmailStr] = None
    portfolio_public: Optional[bool] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    field_of_study: Optional[str] = None
    claimed_skills: Optional[list[str]] = None


class EmployerProfileUpdate(BaseModel):
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    avatar_url: Optional[str]
    bio: Optional[str]
    linkedin_url: Optional[str]
    github_username: Optional[str]
    preferred_roles: Optional[list[str]]
    location: Optional[str]
    open_to_work: bool
    portfolio_public: bool
    university: Optional[str]
    graduation_year: Optional[int]
    field_of_study: Optional[str]
    claimed_skills: Optional[list[str]]
    # Employer fields
    company_name: Optional[str]
    industry: Optional[str]
    company_size: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CandidateSummary(BaseModel):
    """Compact view used in employer browse grid and namecard list."""
    id: uuid.UUID
    name: str
    university: Optional[str]
    graduation_year: Optional[int]
    field_of_study: Optional[str]
    avatar_url: Optional[str]
    location: Optional[str]
    open_to_work: bool
    trust_score: float
    trust_label: str
    verified_skills: list[dict]   # [{name, confidence, artifact_type}]
    claimed_skills: Optional[list[str]]
    simuhire_completed: bool
    simuhire_shared: bool

    model_config = {"from_attributes": True}

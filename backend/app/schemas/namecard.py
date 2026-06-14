"""
F5 Smart Namecard — request/response schemas.
"""
import uuid
from typing import Optional

from pydantic import BaseModel


class SkillEntry(BaseModel):
    skill: str
    verified: bool
    confidence: Optional[float] = None  # set when a matching verified artifact exists


class SimuHireBadge(BaseModel):
    session_id: uuid.UUID
    simulation_type: str
    overall_score: int
    shared: bool


class NamecardResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    # Editable (user-writable) fields
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_username: Optional[str] = None
    preferred_roles: Optional[list[str]] = None
    location: Optional[str] = None
    contact_email: Optional[str] = None
    open_to_work: bool = False
    # Locked (computed) fields — never writable via API
    trust_score: float
    trust_label: str
    skills: list[SkillEntry]
    simuhire_badge: Optional[SimuHireBadge] = None
    credential_badges: list[str]
    audit_hash: Optional[str] = None
    public_url: str


class NamecardEditableUpdate(BaseModel):
    """Only the user-editable fields are accepted on PATCH."""
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_username: Optional[str] = None
    preferred_roles: Optional[list[str]] = None
    location: Optional[str] = None
    contact_email: Optional[str] = None
    open_to_work: Optional[bool] = None
    claimed_skills: Optional[list[str]] = None

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JobListingCreate(BaseModel):
    title: str
    company: str
    required_skills: Optional[list[str]] = None
    require_verified: bool = False
    require_simuhire: bool = False
    description: Optional[str] = None


class JobListingUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    required_skills: Optional[list[str]] = None
    require_verified: Optional[bool] = None
    require_simuhire: Optional[bool] = None
    description: Optional[str] = None


class JobListingResponse(BaseModel):
    id: uuid.UUID
    employer_id: uuid.UUID
    title: str
    company: str
    required_skills: Optional[list[str]]
    require_verified: bool
    require_simuhire: bool
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

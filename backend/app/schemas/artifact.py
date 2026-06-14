import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ArtifactResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    artifact_type: str
    artifact_name: str
    artifact_url: Optional[str]
    confidence: Optional[float]
    status: str
    ai_generated: Optional[bool]
    metadata: Optional[dict] = Field(None, alias="metadata_")
    hash: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class LedgerEntryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    artifact_id: uuid.UUID
    leaf_hash: str
    root_hash: str
    block_index: int
    prev_hash: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class LedgerIntegrityResponse(BaseModel):
    intact: bool
    entry_count: int
    computed_root: Optional[str]
    stored_root: Optional[str]


class VerifyGitHubRequest(BaseModel):
    repo_full_name: str  # "owner/repo"


class VerifyTriggerResponse(BaseModel):
    artifact_id: uuid.UUID
    status: str
    job_id: Optional[str]


class TimelineNode(BaseModel):
    artifact_id: uuid.UUID
    artifact_name: str
    artifact_type: str
    confidence: Optional[float]
    verified_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class LedgerSummary(BaseModel):
    root_hash: Optional[str]
    entry_count: int


class PortfolioResponse(BaseModel):
    id: uuid.UUID
    name: str
    university: Optional[str]
    graduation_year: Optional[int]
    field_of_study: Optional[str]
    avatar_url: Optional[str]
    trust_score: float
    trust_label: str
    verified_artifacts: list[ArtifactResponse]
    timeline: list[TimelineNode]
    ledger_summary: LedgerSummary
    public_url: str
    # Only present on public view when portfolio_public=True
    contact_email: Optional[str] = None

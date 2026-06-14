"""
F6 SimuHire — request/response schemas.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SessionCreateRequest(BaseModel):
    simulation_type: str  # 'technical' | 'business' | 'general'


class SessionCreateResponse(BaseModel):
    session_id: uuid.UUID
    simulation_type: str
    stakeholder_persona: str
    stage: str
    opening_message: str  # first Scenario Master message


class MessageRequest(BaseModel):
    text: str


class MessageResponse(BaseModel):
    interviewer_message: str
    stakeholder_message: Optional[str] = None
    stage: str


class EndSessionResponse(BaseModel):
    session_id: uuid.UUID
    overall_score: int
    report: dict
    evaluator_scores: dict
    ledger_written: bool


class ReportResponse(BaseModel):
    session_id: uuid.UUID
    simulation_type: str
    overall_score: int
    report: dict
    evaluator_scores: dict
    candidate_shared: bool
    completed_at: Optional[datetime]


class ShareRequest(BaseModel):
    shared: bool


class ShareResponse(BaseModel):
    session_id: uuid.UUID
    candidate_shared: bool

"""
Demo seed script — inserts 3 candidate profiles for the June 15 prototype demo.

  Ahmad Farid  — trust 87 (GitHub verified + SimuHire shared)
  Priya Nair   — trust 71 (GitHub verified, no SimuHire)
  Wei Chen     — trust  0 (GitHub failed, no verified artifacts → "Low Confidence" band)

Run: python -m scripts.seed

Trust score note: Wei Chen's GitHub attempt returns confidence 38 (<60),
so it is NOT written to the ledger and his trust score is 0.
The "Low Confidence" band (score < 40) correctly describes this state.
"""
import asyncio
import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models import (
    ConsentLog,
    CredentialLedger,
    SimuhireSession,
    User,
    VerifiedArtifact,
)
from app.utils.auth import hash_password


def _sha256(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()


def _leaf_hash(
    user_id: str,
    artifact_name: str,
    artifact_type: str,
    confidence: float,
    verified_at: str,
    status: str,
) -> str:
    payload = f"{user_id}|{artifact_name}|{artifact_type}|{confidence}|{verified_at}|{status}"
    return _sha256(payload)


def _merkle_root(leaf_hashes: list[str]) -> str:
    """Compute Merkle root from an ordered list of leaf hashes (pairwise SHA-256)."""
    if not leaf_hashes:
        return _sha256("")
    nodes = list(leaf_hashes)
    while len(nodes) > 1:
        if len(nodes) % 2 == 1:
            nodes.append(nodes[-1])  # duplicate last node if odd count
        nodes = [_sha256(nodes[i] + nodes[i + 1]) for i in range(0, len(nodes), 2)]
    return nodes[0]


async def seed(db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)

    # ── Ahmad Farid ──────────────────────────────────────────────────────────
    # GitHub confidence 91, SimuHire confidence 82 → trust = (91×1.5 + 82×1.2)/(1.5+1.2) = 87.0
    ahmad = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        name="Ahmad Farid",
        email="ahmad.farid@demo.credo.app",
        password_hash=hash_password("Demo1234!"),
        role="candidate",
        university="Universiti Malaya",
        field_of_study="Computer Science",
        graduation_year=2025,
        location="Kuala Lumpur",
        open_to_work=True,
        portfolio_public=True,
        claimed_skills=["Python", "Machine Learning", "SQL", "Docker"],
    )

    priya = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
        name="Priya Nair",
        email="priya.nair@demo.credo.app",
        password_hash=hash_password("Demo1234!"),
        role="candidate",
        university="Universiti Teknologi Malaysia",
        field_of_study="Software Engineering",
        graduation_year=2025,
        location="Johor Bahru",
        open_to_work=True,
        portfolio_public=True,
        claimed_skills=["React", "Node.js", "TypeScript"],
    )

    wei = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
        name="Wei Chen",
        email="wei.chen@demo.credo.app",
        password_hash=hash_password("Demo1234!"),
        role="candidate",
        university="Universiti Putra Malaysia",
        field_of_study="Information Technology",
        graduation_year=2026,
        location="Petaling Jaya",
        open_to_work=False,
        portfolio_public=False,
    )

    # Demo employer for job listings
    talentbank = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000010"),
        name="Talentbank HR",
        email="hr@talentbank.demo.credo.app",
        password_hash=hash_password("Demo1234!"),
        role="employer",
        company_name="Talentbank",
        industry="Human Resources",
    )

    for u in [ahmad, priya, wei, talentbank]:
        db.add(u)
    await db.flush()

    # ── Consent logs ─────────────────────────────────────────────────────────
    for uid in [ahmad.id, priya.id, wei.id, talentbank.id]:
        db.add(ConsentLog(user_id=uid, consent_type="registration"))

    # ── Ahmad — GitHub verified artifact ─────────────────────────────────────
    ahmad_github_id = uuid.UUID("00000000-0001-0000-0000-000000000001")
    ahmad_verified_at_gh = now - timedelta(days=5)
    ahmad_gh = VerifiedArtifact(
        id=ahmad_github_id,
        user_id=ahmad.id,
        artifact_type="github",
        artifact_name="ahmad-farid/ml-portfolio",
        artifact_url="https://github.com/ahmad-farid/ml-portfolio",
        confidence=91.0,
        status="verified",
        ai_generated=False,
        metadata_={
            "commit_count": 47,
            "commit_score": 92,
            "ast_score": 90,
            "orig_bonus": 100,
            "complexity_label": "High",
            "flag_count": 0,
        },
        hash=_leaf_hash(
            str(ahmad.id),
            "ahmad-farid/ml-portfolio",
            "github",
            91.0,
            ahmad_verified_at_gh.isoformat(),
            "verified",
        ),
        verified_at=ahmad_verified_at_gh,
    )
    db.add(ahmad_gh)
    db.add(ConsentLog(user_id=ahmad.id, consent_type="github"))

    # ── Ahmad — SimuHire session + artifact ──────────────────────────────────
    ahmad_simuhire_id = uuid.UUID("00000000-0002-0000-0000-000000000001")
    ahmad_verified_at_sh = now - timedelta(days=3)
    ahmad_sh = VerifiedArtifact(
        id=ahmad_simuhire_id,
        user_id=ahmad.id,
        artifact_type="simuhire",
        artifact_name="SimuHire — Technical (2026-06-08)",
        confidence=82.0,
        status="verified",
        metadata_={
            "simulation_type": "technical",
            "overall_score": 82,
            "dimensions": {
                "adaptability": 85,
                "communication": 78,
                "problem_solving": 88,
                "stress_response": 80,
                "systems_thinking": 79,
            },
        },
        hash=_leaf_hash(
            str(ahmad.id),
            "SimuHire — Technical (2026-06-08)",
            "simuhire",
            82.0,
            ahmad_verified_at_sh.isoformat(),
            "verified",
        ),
        verified_at=ahmad_verified_at_sh,
    )
    db.add(ahmad_sh)
    db.add(ConsentLog(user_id=ahmad.id, consent_type="simuhire"))

    # Linked SimuHire session record
    db.add(
        SimuhireSession(
            id=uuid.UUID("00000000-0003-0000-0000-000000000001"),
            candidate_id=ahmad.id,
            simulation_type="technical",
            status="completed",
            stakeholder_persona="Sceptic",
            conversation=[
                {"speaker": "interviewer", "text": "Welcome, Ahmad. Let's begin...", "input_mode": "text", "timestamp": (now - timedelta(days=3, hours=1)).isoformat()},
            ],
            evaluator_scores={
                "adaptability": {"score": 85, "evidence": "Revised caching strategy after spec change."},
                "communication": {"score": 78, "evidence": "Responses were clear but occasionally verbose."},
                "problem_solving": {"score": 88, "evidence": "Identified root cause in second exchange."},
                "stress_response": {"score": 80, "evidence": "Maintained composure during Sceptic's challenge."},
                "systems_thinking": {"score": 79, "evidence": "Considered downstream effects on load balancer."},
            },
            overall_score=82,
            report={
                "overall_score": 82,
                "key_observations": [
                    "Adapted technical strategy rapidly when requirements shifted mid-session.",
                    "Consistently grounded responses in system constraints rather than abstract solutions.",
                    "Initial diagnosis narrowed too quickly before checking all available logs.",
                ],
                "dimensions": {
                    "adaptability": {
                        "score": 85,
                        "strength": "Revised the caching strategy within two exchanges after the stakeholder changed the latency requirement.",
                        "growth": "Initial diagnosis assumed a database issue before checking the load balancer logs provided in the brief.",
                    },
                    "communication": {"score": 78, "strength": "Explained the trade-off between latency and consistency clearly.", "growth": "Response to stakeholder's follow-up question restated the problem rather than advancing the solution."},
                    "problem_solving": {"score": 88, "strength": "Identified the root cause in the second exchange by correlating the error logs.", "growth": "Did not propose a fallback plan if the primary fix did not hold."},
                    "stress_response": {"score": 80, "strength": "Maintained a composed tone when the Sceptic challenged the chosen approach.", "growth": "Paused for an extended period before responding to the escalation prompt."},
                    "systems_thinking": {"score": 79, "strength": "Considered the downstream effect on the load balancer before committing to a fix.", "growth": "No significant friction observed in this session regarding cross-service dependencies."},
                },
            },
            candidate_shared=True,
            completed_at=ahmad_verified_at_sh,
            retake_available_at=ahmad_verified_at_sh + timedelta(days=7),
        )
    )
    await db.flush()

    # ── Ahmad — Ledger entries ────────────────────────────────────────────────
    leaf1 = ahmad_gh.hash
    leaf2 = ahmad_sh.hash
    root_after_block0 = _merkle_root([leaf1])
    root_after_block1 = _merkle_root([leaf1, leaf2])

    db.add(CredentialLedger(
        user_id=ahmad.id,
        artifact_id=ahmad_github_id,
        leaf_hash=leaf1,
        root_hash=root_after_block0,
        block_index=0,
        prev_hash=None,
    ))
    db.add(CredentialLedger(
        user_id=ahmad.id,
        artifact_id=ahmad_simuhire_id,
        leaf_hash=leaf2,
        root_hash=root_after_block1,
        block_index=1,
        prev_hash=root_after_block0,
    ))

    # ── Priya — GitHub verified artifact ─────────────────────────────────────
    priya_github_id = uuid.UUID("00000000-0001-0000-0000-000000000002")
    priya_verified_at = now - timedelta(days=10)
    priya_leaf = _leaf_hash(
        str(priya.id),
        "priya-nair/ecommerce-app",
        "github",
        71.0,
        priya_verified_at.isoformat(),
        "verified",
    )
    priya_gh = VerifiedArtifact(
        id=priya_github_id,
        user_id=priya.id,
        artifact_type="github",
        artifact_name="priya-nair/ecommerce-app",
        artifact_url="https://github.com/priya-nair/ecommerce-app",
        confidence=71.0,
        status="verified",
        ai_generated=False,
        metadata_={
            "commit_count": 22,
            "commit_score": 70,
            "ast_score": 72,
            "orig_bonus": 100,
            "complexity_label": "Medium",
            "flag_count": 0,
        },
        hash=priya_leaf,
        verified_at=priya_verified_at,
    )
    db.add(priya_gh)
    db.add(ConsentLog(user_id=priya.id, consent_type="github"))

    priya_root = _merkle_root([priya_leaf])
    db.add(CredentialLedger(
        user_id=priya.id,
        artifact_id=priya_github_id,
        leaf_hash=priya_leaf,
        root_hash=priya_root,
        block_index=0,
        prev_hash=None,
    ))

    # ── Wei Chen — GitHub FAILED artifact (confidence 38 < 60, no ledger entry) ──
    db.add(VerifiedArtifact(
        user_id=wei.id,
        artifact_type="github",
        artifact_name="wei-chen/study-notes",
        artifact_url="https://github.com/wei-chen/study-notes",
        confidence=38.0,
        status="failed",  # < 60 — NOT written to ledger
        metadata_={
            "commit_count": 3,
            "commit_score": 40,
            "ast_score": 30,
            "orig_bonus": 100,
            "complexity_label": "Low",
            "flag_count": 1,
            "fail_reason": "Fewer than 5 commits; commit span < 1 day",
        },
    ))
    db.add(ConsentLog(user_id=wei.id, consent_type="github"))

    await db.flush()
    print("✓ Seed complete.")
    print("  Ahmad Farid  — trust 87.0 (GitHub 91 + SimuHire 82, shared)")
    print("  Priya Nair   — trust 71.0 (GitHub 71)")
    print("  Wei Chen     — trust  0.0 (GitHub failed, no ledger entries)")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as db:
        async with db.begin():
            await seed(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

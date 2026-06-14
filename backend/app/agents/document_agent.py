"""
F2 Agent B — Document Agent.
Accepts PDF or DOCX; analyses for AI generation probability, writing complexity,
and authorship consistency.

⚠ PAUSE REQUIRED: The AI text detection step calls Groq llama-3.1-8b-instant.
  Set GROQ_API_KEY in .env before enabling detect_ai_probability().
  Until then, that function raises RuntimeError and the endpoint is functional
  but the key must be set before the Grand Finale (Section 16.0).

confidence = (100 - ai_probability)×0.5 + writing_complexity×0.3 + vocabulary_diversity×0.2
"""
import logging
import math
import re
from typing import Optional

logger = logging.getLogger(__name__)


# ── Text extraction ───────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from PDF bytes using pdfplumber (replaces pdf-parse)."""
    import io

    import pdfplumber

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract all text from DOCX bytes using python-docx (replaces mammoth)."""
    import io

    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Route to correct extractor based on file extension."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if lower.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    raise ValueError(f"Unsupported document type: {filename}")


# ── Writing complexity scorers ────────────────────────────────────────────────

def _tokenize_sentences(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s for s in sentences if s.strip()]


def _tokenize_words(text: str) -> list[str]:
    return re.findall(r"\b[a-zA-Z']+\b", text.lower())


def compute_vocabulary_diversity(text: str) -> float:
    """
    Type-token ratio: unique words / total words, normalised to 0-100.
    Longer texts naturally have lower TTR; we apply a logarithmic correction.
    """
    words = _tokenize_words(text)
    if len(words) < 10:
        return 0.0
    unique = len(set(words))
    total = len(words)
    # Raw TTR decreases with length; use log-corrected form (RTTR)
    rttr = unique / math.sqrt(total)
    # Normalise: RTTR of ~10 = very diverse; map linearly, cap at 100
    return min(100.0, round(rttr / 10 * 100, 1))


def compute_sentence_variance(text: str) -> float:
    """
    Sentence length variance normalised to 0-100.
    Higher variance = more natural human writing.
    """
    sentences = _tokenize_sentences(text)
    if len(sentences) < 3:
        return 0.0
    lengths = [len(_tokenize_words(s)) for s in sentences]
    mean = sum(lengths) / len(lengths)
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    std_dev = math.sqrt(variance)
    # Normalise: std_dev of 8+ = highly varied; std_dev of 0 = uniform AI output
    return min(100.0, round(std_dev / 8 * 100, 1))


def compute_writing_complexity(text: str) -> float:
    """
    Combined writing complexity = average of vocabulary diversity and sentence variance.
    """
    vd = compute_vocabulary_diversity(text)
    sv = compute_sentence_variance(text)
    return round((vd + sv) / 2, 1)


# ── Authorship consistency ────────────────────────────────────────────────────

def check_authorship_consistency(
    current_variance: float,
    prior_avg_variance: Optional[float],
    tolerance: float = 25.0,
) -> dict:
    """
    From 2nd submission onward: compare current sentence variance against
    stored avg_sentence_variance. Significant deviation flags potential
    authorship inconsistency (different author or heavy AI assistance).
    Skipped on first submission (prior_avg_variance is None).
    """
    if prior_avg_variance is None:
        return {"checked": False, "consistent": True, "deviation": None}

    deviation = abs(current_variance - prior_avg_variance)
    consistent = deviation <= tolerance
    return {
        "checked": True,
        "consistent": consistent,
        "deviation": round(deviation, 1),
        "prior_avg_variance": round(prior_avg_variance, 1),
        "current_variance": round(current_variance, 1),
    }


# ── AI text detection (⚠ requires GROQ_API_KEY) ──────────────────────────────

async def detect_ai_probability(text: str) -> tuple[float, str]:
    """
    Send text to Groq llama-3.1-8b-instant to estimate AI generation probability.
    Returns (ai_probability 0-100, verdict).

    ⚠ PAUSE: GROQ_API_KEY must be set in .env before calling this function.
    Without the key, raises RuntimeError with a clear message.
    Free tier: https://console.groq.com
    """
    from app.config import settings

    if not settings.GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. "
            "Provide it in .env before enabling the Document Agent AI detection step. "
            "Get a free key at https://console.groq.com"
        )

    from groq import AsyncGroq

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    # Limit to first 3000 chars to control token usage
    sample = text[:3000]

    prompt = (
        "You are an AI-generated text detector. Analyse the following text and return "
        "a JSON object with exactly two keys:\n"
        '- "ai_probability": integer 0-100 (probability the text was AI-generated)\n'
        '- "verdict": one of "human", "likely_human", "uncertain", "likely_ai", "ai"\n\n'
        "Respond with valid JSON only, no markdown, no explanation.\n\n"
        f"Text:\n{sample}"
    )

    response = await client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=60,
        response_format={"type": "json_object"},
    )

    import json

    raw = response.choices[0].message.content or "{}"
    data = json.loads(raw)
    ai_prob = max(0, min(100, int(data.get("ai_probability", 50))))
    verdict = data.get("verdict", "uncertain")
    return float(ai_prob), verdict


# ── Confidence formula ────────────────────────────────────────────────────────

def compute_document_confidence(
    ai_probability: float,
    writing_complexity: float,
    vocabulary_diversity: float,
) -> float:
    return round(
        (100 - ai_probability) * 0.5
        + writing_complexity * 0.3
        + vocabulary_diversity * 0.2,
        1,
    )


# ── ARQ Job ───────────────────────────────────────────────────────────────────

async def run_document_analysis(
    ctx: dict,
    artifact_id: str,
    file_bytes: bytes,
    filename: str,
) -> None:
    """
    ARQ job: analyses document content and writes result to verified_artifacts.
    Raw text is extracted in-memory and never persisted (PDPA compliance).
    """
    import uuid as _uuid

    from sqlalchemy import select

    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    logger.info("Document agent starting: artifact=%s file=%s", artifact_id, filename)
    artifact_uuid = _uuid.UUID(artifact_id)
    text: Optional[str] = None

    try:
        async with ctx["session_factory"]() as db:
            async with db.begin():
                result = await db.execute(
                    select(VerifiedArtifact).where(VerifiedArtifact.id == artifact_uuid)
                )
                artifact = result.scalar_one_or_none()
                if artifact is None:
                    logger.warning("Document agent: artifact %s not found, skipping", artifact_id)
                    return

                user_result = await db.execute(
                    select(User).where(User.id == artifact.user_id)
                )
                user = user_result.scalar_one_or_none()

                # Extract text (in memory only)
                try:
                    text = extract_text(file_bytes, filename)
                except Exception as exc:
                    logger.error("Text extraction failed for artifact %s: %s", artifact_id, exc)
                    artifact.status = "failed"
                    artifact.metadata_ = {"error": f"Text extraction failed: {exc}"}
                    return

                if not text or len(text.strip()) < 100:
                    logger.warning(
                        "Document agent: artifact %s too short or unreadable", artifact_id
                    )
                    artifact.status = "failed"
                    artifact.metadata_ = {"error": "Document too short or unreadable"}
                    return

                # Writing complexity (no API key needed)
                vocabulary_diversity = compute_vocabulary_diversity(text)
                sentence_variance = compute_sentence_variance(text)
                writing_complexity = compute_writing_complexity(text)

                # Authorship consistency (skip on first submission)
                prior_avg = user.avg_sentence_variance if user else None
                authorship = check_authorship_consistency(sentence_variance, prior_avg)

                # AI text detection (requires GROQ_API_KEY)
                try:
                    ai_probability, verdict = await detect_ai_probability(text)
                    ai_generated = ai_probability >= 70
                except RuntimeError as exc:
                    logger.error("AI detection failed for artifact %s: %s", artifact_id, exc)
                    artifact.status = "failed"
                    artifact.metadata_ = {"error": str(exc)}
                    return

                # Confidence
                confidence = compute_document_confidence(
                    ai_probability, writing_complexity, vocabulary_diversity
                )

                metadata = {
                    "ai_probability": ai_probability,
                    "ai_verdict": verdict,
                    "writing_complexity": writing_complexity,
                    "vocabulary_diversity": vocabulary_diversity,
                    "sentence_variance": round(sentence_variance, 1),
                    "authorship_consistency": authorship,
                    # Raw text NOT stored — PDPA compliant
                }

                if confidence >= 60:
                    await atomic_ledger_write(
                        db=db,
                        artifact=artifact,
                        confidence=confidence,
                        extra_metadata=metadata,
                    )
                    logger.info(
                        "Document agent verified: artifact=%s confidence=%.1f ai_prob=%.0f verdict=%s",
                        artifact_id, confidence, ai_probability, verdict,
                    )
                else:
                    artifact.status = "failed"
                    artifact.confidence = confidence
                    artifact.ai_generated = ai_generated
                    artifact.metadata_ = metadata
                    logger.info(
                        "Document agent failed (low confidence): artifact=%s confidence=%.1f ai_prob=%.0f verdict=%s",
                        artifact_id, confidence, ai_probability, verdict,
                    )

                # Update user's avg_sentence_variance for authorship consistency check on next doc
                if user and confidence >= 60:
                    if user.avg_sentence_variance is None:
                        user.avg_sentence_variance = sentence_variance
                    else:
                        user.avg_sentence_variance = (
                            user.avg_sentence_variance + sentence_variance
                        ) / 2

    except Exception:
        logger.exception("Unexpected error in Document agent for artifact %s", artifact_id)
        raise
    finally:
        # PDPA: discard extracted text from memory
        if text is not None:
            del text
        del file_bytes

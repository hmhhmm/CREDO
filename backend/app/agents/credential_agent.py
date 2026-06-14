"""
F2 Agent C — Credential Agent.
Accepts certificate image (JPG/PNG) or PDF.
OCR → issuer registry fuzzy match → name match → confidence rule.

⚠ System requirement: Tesseract-OCR must be installed.
  Windows: https://github.com/UB-Mannheim/tesseract/wiki
  Linux:   apt install tesseract-ocr
  Mac:     brew install tesseract

Confidence rules (from PRD):
  issuer_match AND name_match  → 90 (Verified)
  issuer_match AND name_mismatch → 50 (manual review)
  no issuer_match              → 30 (Unverified)

Image/PDF bytes are discarded from memory immediately after OCR (PDPA compliant).
"""
import io
import re
from typing import Optional

from rapidfuzz import fuzz

from app.data.issuer_registry import MALAYSIAN_ISSUERS

ISSUER_MATCH_THRESHOLD = 80  # rapidfuzz score 0-100


# ── OCR extraction ────────────────────────────────────────────────────────────

def _ocr_image_bytes(image_bytes: bytes) -> str:
    """Run pytesseract on raw image bytes. Returns extracted text."""
    import pytesseract
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(img)


def _ocr_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF certificate.
    Tries pdfplumber first (fastest for text-based PDFs).
    Falls back to pytesseract on the first page if pdfplumber yields no text.
    """
    import pdfplumber

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages_text = [p.extract_text() or "" for p in pdf.pages]
    text = "\n".join(pages_text).strip()
    if text:
        return text

    # Fallback: render first page as image and OCR
    # Requires pdf2image + poppler; if unavailable, return empty
    try:
        from pdf2image import convert_from_bytes  # type: ignore

        images = convert_from_bytes(pdf_bytes, first_page=1, last_page=1)
        if images:
            import pytesseract

            return pytesseract.image_to_string(images[0])
    except ImportError:
        pass
    return ""


def extract_ocr_text(file_bytes: bytes, filename: str) -> str:
    """Route to correct OCR method based on file extension."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _ocr_pdf_bytes(file_bytes)
    if lower.endswith((".jpg", ".jpeg", ".png")):
        return _ocr_image_bytes(file_bytes)
    raise ValueError(f"Unsupported credential file type: {filename}")


# ── Field extraction from OCR text ───────────────────────────────────────────

def extract_fields_from_text(text: str) -> dict:
    """
    Heuristically extract key fields from OCR output.
    Returns dict with keys: institution, candidate_name, date, title.
    All values may be None if not found.
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # Date: look for patterns like "15 June 2024", "2024-06-15", "June 2024"
    date_pattern = re.compile(
        r"\b(\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{4}|\d{4}[-/]\d{2}[-/]\d{2})\b"
    )
    date_match = date_pattern.search(text)
    date = date_match.group(0) if date_match else None

    # Institution: look for lines containing keywords typical of cert issuers
    institution = None
    institution_keywords = ["university", "institute", "college", "academy", "school",
                             "association", "board", "council", "corporation", "ministry"]
    for line in lines:
        if any(kw in line.lower() for kw in institution_keywords) and len(line) > 5:
            institution = line
            break

    # Title: look for lines containing "certificate", "diploma", "award", "degree"
    title = None
    title_keywords = ["certificate", "diploma", "award", "degree", "distinction",
                       "achievement", "completion", "excellence", "merit"]
    for line in lines:
        if any(kw in line.lower() for kw in title_keywords) and len(line) > 5:
            title = line
            break

    # Candidate name: heuristically the first all-caps line or first proper-name line
    # after "awarded to", "presented to", "this certifies that"
    candidate_name = None
    presented_pattern = re.compile(
        r"(?:awarded to|presented to|this certifies that|certify that|name of|recipient)[:\s]+([^\n]+)",
        re.IGNORECASE,
    )
    pm = presented_pattern.search(text)
    if pm:
        candidate_name = pm.group(1).strip()
    else:
        # Fallback: find first line that looks like a proper name (2-4 words, title case)
        for line in lines:
            words = line.split()
            if 2 <= len(words) <= 5 and all(w[0].isupper() for w in words if w.isalpha()):
                candidate_name = line
                break

    return {
        "institution": institution,
        "candidate_name": candidate_name,
        "date": date,
        "title": title,
    }


# ── Issuer matching ───────────────────────────────────────────────────────────

def match_issuer(extracted_institution: Optional[str]) -> tuple[bool, Optional[str], float]:
    """
    Fuzzy match extracted institution against MALAYSIAN_ISSUERS.
    Returns (matched: bool, best_match: str|None, score: float).
    """
    if not extracted_institution:
        return False, None, 0.0

    best_score = 0.0
    best_match = None
    for issuer in MALAYSIAN_ISSUERS:
        score = fuzz.ratio(extracted_institution.lower(), issuer.lower())
        if score > best_score:
            best_score = score
            best_match = issuer

    matched = best_score >= ISSUER_MATCH_THRESHOLD
    return matched, best_match if matched else None, best_score


# ── Name matching ─────────────────────────────────────────────────────────────

def match_candidate_name(
    extracted_name: Optional[str],
    registered_name: str,
) -> bool:
    """
    Compare OCR-extracted name against registered user name.
    Allows for:
    - Full match
    - Partial match (Chinese names, initials, aliases)
    - Initials match (e.g., "W.C." matches "Wei Chen")
    """
    if not extracted_name:
        return False

    # Normalise
    ext = extracted_name.lower().strip()
    reg = registered_name.lower().strip()

    # Exact or close match
    if fuzz.ratio(ext, reg) >= 80:
        return True

    # Partial match (substring)
    if fuzz.partial_ratio(ext, reg) >= 85:
        return True

    # Initials match (e.g., "W. C." → "Wei Chen")
    reg_parts = reg.split()
    if reg_parts:
        initials = "".join(p[0] for p in reg_parts if p)
        ext_stripped = re.sub(r"[^a-z]", "", ext)
        if ext_stripped == initials:
            return True

    return False


# ── Confidence rule ───────────────────────────────────────────────────────────

def compute_credential_confidence(issuer_matched: bool, name_matched: bool) -> int:
    """
    PRD confidence rules:
      issuer_match AND name_match  → 90
      issuer_match AND name_mismatch → 50
      no issuer_match              → 30
    """
    if issuer_matched and name_matched:
        return 90
    if issuer_matched and not name_matched:
        return 50
    return 30


# ── ARQ Job ───────────────────────────────────────────────────────────────────

async def run_credential_analysis(
    ctx: dict,
    artifact_id: str,
    file_bytes: bytes,
    filename: str,
    user_id: str,
    user_name: str,
) -> None:
    """
    ARQ job: OCR → issuer match → name match → confidence rule → DB write.
    Image/PDF bytes discarded immediately after OCR (PDPA compliant).
    """
    import uuid as _uuid

    from sqlalchemy import select

    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write

    artifact_uuid = _uuid.UUID(artifact_id)
    ocr_text: Optional[str] = None

    try:
        async with ctx["session_factory"]() as db:
            async with db.begin():
                result = await db.execute(
                    select(VerifiedArtifact).where(VerifiedArtifact.id == artifact_uuid)
                )
                artifact = result.scalar_one_or_none()
                if artifact is None:
                    return

                # OCR extraction
                try:
                    ocr_text = extract_ocr_text(file_bytes, filename)
                except Exception as exc:
                    artifact.status = "failed"
                    artifact.metadata_ = {"error": f"OCR failed: {exc}"}
                    return
                finally:
                    # PDPA: discard image bytes immediately after OCR
                    del file_bytes

                if not ocr_text or len(ocr_text.strip()) < 20:
                    artifact.status = "failed"
                    artifact.metadata_ = {
                        "error": "OCR returned insufficient text. "
                        "Upload a clearer image or ensure Tesseract is installed."
                    }
                    return

                # Extract fields
                fields = extract_fields_from_text(ocr_text)

                # Issuer match
                issuer_matched, matched_issuer, issuer_score = match_issuer(fields["institution"])

                # Name match
                name_matched = match_candidate_name(fields["candidate_name"], user_name)

                # Confidence
                confidence = compute_credential_confidence(issuer_matched, name_matched)

                metadata = {
                    "ocr_institution": fields["institution"],
                    "ocr_candidate_name": fields["candidate_name"],
                    "ocr_date": fields["date"],
                    "ocr_title": fields["title"],
                    "issuer_matched": issuer_matched,
                    "matched_issuer": matched_issuer,
                    "issuer_score": round(issuer_score, 1),
                    "name_matched": name_matched,
                    # Raw OCR text NOT stored — PDPA compliant
                }

                if confidence >= 60:
                    await atomic_ledger_write(
                        db=db,
                        artifact=artifact,
                        confidence=float(confidence),
                        extra_metadata=metadata,
                    )
                else:
                    artifact.status = "failed"
                    artifact.confidence = float(confidence)
                    artifact.metadata_ = metadata

    finally:
        if ocr_text is not None:
            del ocr_text

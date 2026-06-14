"""
Single source of truth for trust score → band label mapping.
Mirrors the frontend confidenceBand.js util (src/utils/confidenceBand.js).
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class ConfidenceBand:
    label: str
    color: str  # design token name


def get_band(score: float) -> ConfidenceBand:
    """Map a 0–100 trust score to its band label and color token."""
    if score >= 80:
        return ConfidenceBand(label="Highly Authentic", color="verified")
    if score >= 60:
        return ConfidenceBand(label="Authentic", color="blue")
    if score >= 40:
        return ConfidenceBand(label="Inconclusive", color="pending")
    return ConfidenceBand(label="Low Confidence", color="alert")


# Weights used by the trust score calculation (F3 / F5)
ARTIFACT_WEIGHTS: dict[str, float] = {
    "github": 1.5,
    "document": 1.0,
    "credential": 1.0,
    "simuhire": 1.2,
}


def compute_trust_score(verified_confidences: list[tuple[str, float]]) -> float:
    """
    Compute weighted trust score from a list of (artifact_type, confidence) pairs.
    Only 'verified' status artifacts should be passed in.
    Returns 0.0 when no artifacts are provided.
    """
    if not verified_confidences:
        return 0.0

    total_weight = 0.0
    weighted_sum = 0.0
    for artifact_type, confidence in verified_confidences:
        weight = ARTIFACT_WEIGHTS.get(artifact_type, 1.0)
        weighted_sum += confidence * weight
        total_weight += weight

    return round(weighted_sum / total_weight, 1)

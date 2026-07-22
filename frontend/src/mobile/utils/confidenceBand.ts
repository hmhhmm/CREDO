// Ported from frontend/src/utils/confidenceBand.js
export interface ConfidenceBand {
  label: string;
  color: string;
  hex: string;
}

export function getConfidenceBand(score: number): ConfidenceBand {
  if (score >= 80) return { label: "Highly Authentic", color: "verified", hex: "#1F7A5C" };
  if (score >= 60) return { label: "Authentic", color: "blue", hex: "#2F6E8F" };
  if (score >= 40) return { label: "Inconclusive", color: "pending", hex: "#D9A441" };
  return { label: "Low Confidence", color: "alert", hex: "#C4503A" };
}

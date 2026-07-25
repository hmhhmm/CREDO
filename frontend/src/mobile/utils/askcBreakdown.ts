// Derives an illustrative ASKC (Attitude / Skills / Knowledge / Consistency) breakdown from
// data the app already has. The real backend (backend/app/routers/namecard.py) only computes
// one flat trust_score today — there is no per-pillar score stored anywhere — so this is a
// frontend-side approximation for the Home hero card's expanded view, not a value the backend
// returns. It follows Section 05 of the charter: a pillar with zero verified signal reads as
// "Not yet verified" in neutral grey, never a red zero.
import type { NamecardResponse, PortfolioResponse } from "../lib/api";

export type AskcPillar = "attitude" | "skills" | "knowledge" | "consistency";

export interface AskcScore {
  pillar: AskcPillar;
  label: string;
  score: number | null; // null = not yet verified
}

export function deriveAskcBreakdown(namecard: NamecardResponse, portfolio: PortfolioResponse | null): AskcScore[] {
  const verifiedArtifacts = portfolio?.verified_artifacts.filter((a) => a.status === "verified") ?? [];
  const githubArtifacts = verifiedArtifacts.filter((a) => a.artifact_type === "github");
  const credentialArtifacts = verifiedArtifacts.filter((a) => a.artifact_type === "credential");
  const documentArtifacts = verifiedArtifacts.filter((a) => a.artifact_type === "document");

  const avgConfidence = (items: { confidence: number | null }[]) => {
    const withConfidence = items.filter((a) => a.confidence != null) as { confidence: number }[];
    if (withConfidence.length === 0) return null;
    return Math.round(withConfidence.reduce((sum, a) => sum + a.confidence, 0) / withConfidence.length);
  };

  return [
    {
      pillar: "attitude",
      label: "Attitude",
      score: namecard.simuhire_badge ? Math.round(namecard.simuhire_badge.overall_score) : null,
    },
    {
      pillar: "skills",
      label: "Skills",
      score: avgConfidence(githubArtifacts),
    },
    {
      pillar: "knowledge",
      label: "Knowledge",
      score: avgConfidence([...credentialArtifacts, ...documentArtifacts]),
    },
    {
      pillar: "consistency",
      label: "Consistency",
      // A small modifier, not a fourth independent pillar (charter §05) — approximated here
      // from verification depth (how many artifacts) and recency, capped at 100.
      score:
        verifiedArtifacts.length > 0
          ? Math.min(100, verifiedArtifacts.length * 20 + (portfolio?.ledger_summary.entry_count ?? 0) * 5)
          : null,
    },
  ];
}

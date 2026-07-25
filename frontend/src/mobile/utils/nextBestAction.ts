// AI Career Coach (C8) — "Next Best Action" on Home. Picked from the candidate's actual
// state (what's linked, what's verified, what SimuHire has or hasn't run), not a fixed
// script — a candidate with GitHub already linked never sees "link your GitHub," etc.
// Ordered by leverage: an entirely missing verification channel outranks improving one
// that's already partially there.
import type { NamecardResponse, SkillEntry } from "../lib/api";

export type ActionKind = "link_github" | "improve_skill" | "run_simuhire" | "verify_more" | "all_strong";

export interface NextBestAction {
  kind: ActionKind;
  headline: string;
  body: string;
}

function lowestConfidenceVerifiedSkill(skills: SkillEntry[]): SkillEntry | null {
  const verified = skills.filter((s) => s.verified && s.confidence != null);
  if (verified.length === 0) return null;
  return verified.reduce((lowest, s) => (s.confidence! < lowest.confidence! ? s : lowest));
}

export function deriveNextBestAction(namecard: NamecardResponse): NextBestAction {
  const unverifiedClaims = namecard.skills.filter((s) => !s.verified);
  const weakSkill = lowestConfidenceVerifiedSkill(namecard.skills);

  if (!namecard.github_username) {
    return {
      kind: "link_github",
      headline: "Link your GitHub",
      body: "Your repositories become verified proof instead of a claimed skill line — most candidates see their score move the same day.",
    };
  }

  if (weakSkill && weakSkill.confidence! < 75) {
    return {
      kind: "improve_skill",
      headline: `Strengthen ${weakSkill.skill}`,
      body: `Verified at ${Math.round(weakSkill.confidence!)}/100 — a newer repository or credential in ${weakSkill.skill} would push this into your strongest tier.`,
    };
  }

  if (!namecard.simuhire_badge) {
    return {
      kind: "run_simuhire",
      headline: "Run a SimuHire simulation",
      body: "Your Attitude pillar has no signal yet — a 2-minute practice interview gives employers real behavioral evidence, not just a resume claim.",
    };
  }

  if (unverifiedClaims.length > 0) {
    return {
      kind: "verify_more",
      headline: `Verify ${unverifiedClaims[0].skill}`,
      body: `You've claimed ${unverifiedClaims.length} skill${unverifiedClaims.length === 1 ? "" : "s"} that ${unverifiedClaims.length === 1 ? "isn't" : "aren't"} backed by evidence yet.`,
    };
  }

  return {
    kind: "all_strong",
    headline: "Your profile is in strong shape",
    body: "Every claimed skill is verified and SimuHire is on file — keep it current as you build.",
  };
}

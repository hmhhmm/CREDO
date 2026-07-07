// Reconciles real backend response shapes with the (web-ported) Candidate type used by
// SmartNamecard/ScoreRing, mirroring web's adapters.js approach.
import type { Artifact, ArtifactType, Candidate } from "../data/types";
import type { ArtifactResponse, NamecardResponse } from "./api";

// SmartNamecard's Front face derives its GitHub/Credential/Document badge dots from
// candidate.artifacts, but NamecardResponse doesn't expose per-artifact-type status at all
// (only an aggregate skills list + an unrelated credential_badges array) — only
// PortfolioResponse.verified_artifacts has the real artifact_type/status pairing. Callers
// that want accurate badges must fetch the portfolio too and merge via this helper.
export function artifactResponsesToArtifacts(artifacts: ArtifactResponse[]): Artifact[] {
  return artifacts
    .filter((a): a is ArtifactResponse & { artifact_type: ArtifactType } =>
      ["github", "credential", "document"].includes(a.artifact_type)
    )
    .map((a) => ({
      id: a.id,
      type: a.artifact_type,
      name: a.artifact_name,
      confidence: a.confidence ?? 0,
      status: a.status,
      date: a.verified_at ?? a.created_at,
      metadata: a.metadata ?? {},
    }));
}

export function namecardResponseToCandidate(n: NamecardResponse): Candidate {
  return {
    id: n.user_id,
    name: n.name,
    field: "",
    university: "",
    year: "",
    location: n.location ?? "",
    openToWork: n.open_to_work,
    avatar: n.avatar_url,
    bio: n.bio ?? "",
    linkedinUrl: n.linkedin_url,
    githubUrl: n.github_username ? `https://github.com/${n.github_username}` : null,
    trustScore: Math.round(n.trust_score),
    verifiedSkills: n.skills
      .filter((s) => s.verified)
      .map((s) => ({
        name: s.skill,
        confidence: s.confidence ? Math.round(s.confidence) : 0,
        verified: true,
      })),
    claimedSkills: n.skills.filter((s) => !s.verified).map((s) => s.skill),
    simuHire: n.simuhire_badge
      ? {
          completed: true,
          shared: n.simuhire_badge.shared,
          type: n.simuhire_badge.simulation_type,
          overallScore: n.simuhire_badge.overall_score,
        }
      : { completed: false, shared: false },
    artifacts: [],
    ledger: [],
    merkleRoot: n.audit_hash,
  };
}

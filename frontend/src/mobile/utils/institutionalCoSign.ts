// Bridge A ("Verify Together", Candidate <-> University) — whether the candidate's own
// university has actually co-signed one of their verified credentials via Institutional
// Credential Issuer (U5). Real, not decorative: reads CredentialIssuerContext's isIssued,
// which is the same store University's CohortDetailScreen writes to when a university
// admin taps "Issue" on a real student artifact.
import { universities } from "../data/generateDataset";
import type { PortfolioResponse } from "../lib/api";

export interface CoSignStatus {
  isCoSigned: boolean;
  universityName: string | null;
  coSignedArtifactName: string | null;
}

export function deriveCoSignStatus(
  candidateUniversityName: string | null | undefined,
  portfolio: PortfolioResponse | null,
  isIssued: (universityId: string, artifactId: string) => boolean
): CoSignStatus {
  const university = candidateUniversityName ? universities.find((u) => u.name === candidateUniversityName) : null;
  if (!university || !portfolio) {
    return { isCoSigned: false, universityName: university?.name ?? null, coSignedArtifactName: null };
  }

  const credentialArtifacts = portfolio.verified_artifacts.filter(
    (a) => a.artifact_type === "credential" && a.status === "verified"
  );
  const coSigned = credentialArtifacts.find((a) => isIssued(university.id, a.id));

  return {
    isCoSigned: !!coSigned,
    universityName: university.name,
    coSignedArtifactName: coSigned?.artifact_name ?? null,
  };
}

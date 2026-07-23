export type ArtifactType = "github" | "credential" | "document";
export type ArtifactStatus = "verified" | "pending" | "empty" | "failed";

export interface Artifact {
  id: string;
  type: ArtifactType;
  name: string;
  confidence: number;
  status: ArtifactStatus;
  date: string;
  metadata: Record<string, unknown>;
}

export interface VerifiedSkill {
  name: string;
  confidence: number;
  verified: boolean;
}

export interface LedgerEntry {
  blockIndex: number;
  leafHash: string;
  prevHash: string;
  timestamp: string;
}

export interface SimuHireSummary {
  completed: boolean;
  shared: boolean;
  type?: string;
  overallScore?: number;
  dimensions?: Record<string, number>;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  field: string;
  university: string;
  year: string;
  location: string;
  openToWork: boolean;
  avatar: string | null;
  bio: string;
  linkedinUrl: string | null;
  githubUrl: string | null;
  trustScore: number;
  verifiedSkills: VerifiedSkill[];
  claimedSkills: string[];
  simuHire: SimuHireSummary;
  artifacts: Artifact[];
  ledger: LedgerEntry[];
  merkleRoot: string | null;
}

export type EmploymentType = "full-time" | "internship" | "contract";
export type JobStatus = "open" | "closed";

export interface RequiredSkill {
  name: string;
  verifiedOnly: boolean;
}

export interface JobListing {
  id: string;
  title: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requiredSkills: RequiredSkill[];
  status: JobStatus;
  createdAt: string;
}

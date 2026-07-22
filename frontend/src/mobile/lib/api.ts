import { API_BASE_URL, MOCK_MODE } from "./config";
import { tokenStore } from "./tokenStore";
import { mockApi } from "./mockApi";
import type { EmploymentType, JobStatus } from "../data/types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; formData?: FormData } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, formData } = options;
  const headers: Record<string, string> = {};
  if (!formData) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = await tokenStore.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData ?? (body ? JSON.stringify(body) : undefined),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    // FastAPI error bodies are {"detail": "..."} or {"detail": [{"msg": "...", ...}]} for
    // pydantic validation errors — surface the human-readable message, not raw JSON.
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      } else if (Array.isArray(parsed.detail)) {
        message = parsed.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join("; ") || text;
      }
    } catch {
      // not JSON — keep the raw text
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "candidate" | "employer";
  company_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "employer";
  avatar_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_username: string | null;
  location: string | null;
  open_to_work: boolean;
  university: string | null;
  graduation_year: number | null;
  field_of_study: string | null;
  claimed_skills: string[] | null;
  company_name: string | null;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    MOCK_MODE ? mock().register(payload) : request<TokenResponse>("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload: LoginPayload) =>
    MOCK_MODE ? mock().login(payload) : request<TokenResponse>("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => (MOCK_MODE ? mock().me() : request<UserResponse>("/auth/me")),
};

// ── Candidates (Employer Discover) ───────────────────────────────────────────
export interface CandidateSummary {
  id: string;
  name: string;
  university: string | null;
  graduation_year: number | null;
  field_of_study: string | null;
  avatar_url: string | null;
  location: string | null;
  open_to_work: boolean;
  trust_score: number;
  trust_label: string;
  verified_skills: { name: string; confidence: number; artifact_type: string }[];
  claimed_skills: string[] | null;
  simuhire_completed: boolean;
  simuhire_shared: boolean;
}

export const candidatesApi = {
  list: () => (MOCK_MODE ? mock().candidatesList() : request<CandidateSummary[]>("/candidates")),
};

// ── Jobs (Employer) ───────────────────────────────────────────────────────────
export interface JobListingResponse {
  id: string;
  title: string;
  location: string;
  employment_type: EmploymentType;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  required_skills: { name: string; verified_only: boolean }[];
  status: JobStatus;
  created_at: string;
}

export interface JobCreatePayload {
  title: string;
  location: string;
  employment_type: EmploymentType;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  required_skills: { name: string; verified_only: boolean }[];
}

export const jobsApi = {
  list: () =>
    MOCK_MODE ? mock().jobsList() : request<JobListingResponse[]>("/jobs"),
  create: (payload: JobCreatePayload) =>
    MOCK_MODE ? mock().jobsCreate(payload) : request<JobListingResponse>("/jobs", { method: "POST", body: payload }),
  close: (id: string) =>
    MOCK_MODE ? mock().jobsClose(id) : request<JobListingResponse>(`/jobs/${id}/close`, { method: "PATCH" }),
};

// ── Namecard (Candidate Card tab) ────────────────────────────────────────────
export interface SkillEntry {
  skill: string;
  verified: boolean;
  confidence: number | null;
}

export interface SimuHireBadge {
  session_id: string;
  simulation_type: string;
  overall_score: number;
  shared: boolean;
}

export interface NamecardResponse {
  user_id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_username: string | null;
  location: string | null;
  open_to_work: boolean;
  trust_score: number;
  trust_label: string;
  skills: SkillEntry[];
  simuhire_badge: SimuHireBadge | null;
  credential_badges: string[];
  audit_hash: string | null;
  public_url: string;
}

export const namecardApi = {
  get: (userId: string) => (MOCK_MODE ? mock().namecardGet(userId) : request<NamecardResponse>(`/namecard/${userId}`)),
};

// ── Verify (C1) ───────────────────────────────────────────────────────────────
export interface ArtifactResponse {
  id: string;
  user_id: string;
  artifact_type: string;
  artifact_name: string;
  artifact_url: string | null;
  confidence: number | null;
  status: "pending" | "verified" | "failed";
  ai_generated: boolean | null;
  metadata: Record<string, unknown> | null;
  hash: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface VerifyTriggerResponse {
  artifact_id: string;
  status: string;
  job_id: string | null;
}

export interface GitHubRepo {
  full_name: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  updated_at: string | null;
}

// expo-document-picker's DocumentPickerAsset shape differs by platform: web assets carry a
// real `file: File` (the only thing FormData.append can actually use as a Blob on web —
// its `uri` is just a throwaway blob: object URL); native assets have no `file` property at
// all, but RN's fetch/FormData polyfill knows how to read a {uri,name,type} object directly.
interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string | null;
  file?: File;
}

function appendPickedFile(form: FormData, picked: PickedFile) {
  if (picked.file) {
    form.append("file", picked.file, picked.name);
  } else {
    form.append("file", { uri: picked.uri, name: picked.name, type: picked.mimeType ?? "application/octet-stream" } as unknown as Blob);
  }
}

export const verifyApi = {
  consent: (consentType: "github" | "document" | "credential") =>
    MOCK_MODE ? mock().verifyConsent() : request<{ consented: boolean; consent_type: string }>(`/consent/${consentType}`, { method: "POST" }),
  listGithubRepos: () => (MOCK_MODE ? mock().verifyListRepos() : request<GitHubRepo[]>("/verify/repos")),
  triggerGithub: (repoFullName: string) =>
    MOCK_MODE ? mock().verifyTrigger() : request<VerifyTriggerResponse>("/verify/github", { method: "POST", body: { repo_full_name: repoFullName } }),
  triggerDocument: (file: PickedFile) => {
    if (MOCK_MODE) return mock().verifyTrigger();
    const form = new FormData();
    appendPickedFile(form, file);
    return request<VerifyTriggerResponse>("/verify/document", { method: "POST", formData: form });
  },
  triggerCredential: (file: PickedFile) => {
    if (MOCK_MODE) return mock().verifyTrigger();
    const form = new FormData();
    appendPickedFile(form, file);
    return request<VerifyTriggerResponse>("/verify/credential", { method: "POST", formData: form });
  },
  getArtifact: (artifactId: string) => (MOCK_MODE ? mock().getArtifact(artifactId) : request<ArtifactResponse>(`/verify/artifacts/${artifactId}`)),
};

// ── Portfolio (C2 ledger summary + C4 living portfolio) ──────────────────────
export interface TimelineNode {
  artifact_id: string;
  artifact_name: string;
  artifact_type: string;
  confidence: number | null;
  verified_at: string | null;
  created_at: string;
}

export interface LedgerSummary {
  root_hash: string | null;
  entry_count: number;
}

export interface PortfolioResponse {
  id: string;
  name: string;
  university: string | null;
  graduation_year: number | null;
  field_of_study: string | null;
  avatar_url: string | null;
  trust_score: number;
  trust_label: string;
  verified_artifacts: ArtifactResponse[];
  timeline: TimelineNode[];
  ledger_summary: LedgerSummary;
  public_url: string;
  contact_email: string | null;
}

export const portfolioApi = {
  me: () => (MOCK_MODE ? mock().portfolioMe() : request<PortfolioResponse>("/portfolio/me")),
  get: (userId: string) => (MOCK_MODE ? mock().portfolioGet(userId) : request<PortfolioResponse>(`/portfolio/${userId}`, { auth: false })),
};

// ── Ledger (C2 full chain + integrity check) ─────────────────────────────────
export interface LedgerEntryResponse {
  id: string;
  user_id: string;
  artifact_id: string;
  leaf_hash: string;
  root_hash: string;
  block_index: number;
  prev_hash: string | null;
  created_at: string;
}

export interface LedgerIntegrityResponse {
  intact: boolean;
  entry_count: number;
  computed_root: string | null;
  stored_root: string | null;
}

export const ledgerApi = {
  list: (userId: string) => (MOCK_MODE ? mock().ledgerList(userId) : request<LedgerEntryResponse[]>(`/ledger/${userId}`)),
  verify: (userId: string) => (MOCK_MODE ? mock().ledgerVerify(userId) : request<LedgerIntegrityResponse>(`/ledger/${userId}/verify`)),
};

// ── SimuHire (C5) ─────────────────────────────────────────────────────────────
export type SimulationType = "technical" | "business" | "general";

export interface SessionCreateResponse {
  session_id: string;
  simulation_type: SimulationType;
  stakeholder_persona: string;
  stage: string;
  opening_message: string;
}

export interface MessageResponse {
  interviewer_message: string;
  stakeholder_message: string | null;
  stage: string;
}

export interface EndSessionResponse {
  session_id: string;
  overall_score: number;
  report: Record<string, unknown>;
  evaluator_scores: Record<string, number>;
  ledger_written: boolean;
}

export interface ReportResponse {
  session_id: string;
  simulation_type: SimulationType;
  overall_score: number;
  report: Record<string, unknown>;
  evaluator_scores: Record<string, number>;
  candidate_shared: boolean;
  completed_at: string | null;
}

export const simuhireApi = {
  consent: () =>
    MOCK_MODE ? mock().simuhireConsent() : request<{ consented: boolean; consent_type: string }>("/consent/simuhire", { method: "POST" }),
  createSession: (simulationType: SimulationType) =>
    MOCK_MODE ? mock().simuhireCreate(simulationType) : request<SessionCreateResponse>("/simuhire/sessions", { method: "POST", body: { simulation_type: simulationType } }),
  sendMessage: (sessionId: string, text: string) =>
    MOCK_MODE ? mock().simuhireMessage(sessionId, text) : request<MessageResponse>(`/simuhire/sessions/${sessionId}/message`, { method: "POST", body: { text } }),
  endSession: (sessionId: string) =>
    MOCK_MODE ? mock().simuhireEnd(sessionId) : request<EndSessionResponse>(`/simuhire/sessions/${sessionId}/end`, { method: "POST" }),
  getReport: (sessionId: string) => (MOCK_MODE ? mock().simuhireReport(sessionId) : request<ReportResponse>(`/simuhire/sessions/${sessionId}/report`)),
  share: (sessionId: string, shared: boolean) =>
    MOCK_MODE
      ? mock().simuhireShare(sessionId, shared)
      : request<{ session_id: string; candidate_shared: boolean }>(`/simuhire/sessions/${sessionId}/share`, {
          method: "POST",
          body: { shared },
        }),
};

// WEB PORT: the Expo version defers this with require() to dodge a circular dependency.
// There is no runtime cycle to dodge — mockApi's only import from this file is `import
// type`, which is erased — and `require` does not exist in an ES module, so on the web it
// throws and every mocked call fails. A static import is both correct and cycle-free here.
function mock() {
  return mockApi;
}

// Mock API layer — returns rich, backend-shaped data with zero network calls, so the whole
// app demos fully offline. Gated by MOCK_MODE in config.ts; each *Api function in api.ts
// delegates here when the flag is on. Shapes mirror the real Pydantic responses exactly.
//
// Previously this file carried its own tiny, disconnected roster (3 candidates, 3 jobs,
// a different "Ahmad Farid" than the Employer/University side's "Ahmad Rahim"). It now
// adapts the same connected dataset every other role reads from (generateDataset.ts) —
// so a candidate discoverable in Employer's Discover tab and a university's Cohorts tab
// is the same person the candidate side logs in as, not a coincidence of matching names.
import type {
  UserResponse,
  TokenResponse,
  RegisterPayload,
  LoginPayload,
  CandidateSummary,
  NamecardResponse,
  PortfolioResponse,
  ArtifactResponse,
  LedgerEntryResponse,
  LedgerIntegrityResponse,
  VerifyTriggerResponse,
  GitHubRepo,
  SessionCreateResponse,
  MessageResponse,
  EndSessionResponse,
  ReportResponse,
  SimulationType,
  JobListingResponse,
  JobCreatePayload,
  TimelineNode,
} from "./api";
import { allCandidates, allEmployers, allJobs, demoCandidate, demoEmployer } from "../data/generateDataset";
import type { Employer, Job } from "../data/generateDataset";
import { getConfidenceBand } from "../utils/confidenceBand";
import { tokenStore } from "./tokenStore";
import type { Artifact, Candidate } from "../data/types";

const delay = <T>(value: T, ms = 350): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

// ── Adapters: Candidate/Job (the rich internal shape) -> backend-mirroring responses ──
function artifactToResponse(a: Artifact, userId: string): ArtifactResponse {
  return {
    id: a.id,
    user_id: userId,
    artifact_type: a.type,
    artifact_name: a.name,
    artifact_url: a.type === "github" ? `https://github.com/${a.name}` : null,
    confidence: a.confidence,
    status: a.status === "empty" ? "pending" : a.status,
    ai_generated: a.type === "document" ? false : null,
    metadata: a.metadata,
    hash: a.status === "verified" ? `${a.id}-hash` : null,
    verified_at: a.status === "verified" ? `${a.date}T09:00:00Z` : null,
    created_at: `${a.date}T09:00:00Z`,
  };
}

function candidateToSummary(c: Candidate): CandidateSummary {
  const band = getConfidenceBand(c.trustScore);
  return {
    id: c.id,
    name: c.name,
    university: c.university,
    graduation_year: Number(c.year) || null,
    field_of_study: c.field,
    avatar_url: c.avatar,
    location: c.location,
    open_to_work: c.openToWork,
    trust_score: c.trustScore,
    trust_label: c.trustScore === 0 ? "Get Started" : band.label,
    verified_skills: c.artifacts
      .filter((a) => a.status === "verified")
      .map((a) => ({ name: a.name, confidence: a.confidence, artifact_type: a.type })),
    claimed_skills: c.claimedSkills,
    simuhire_completed: c.simuHire.completed,
    simuhire_shared: c.simuHire.shared,
  };
}

function candidateToNamecard(c: Candidate, userId: string): NamecardResponse {
  const band = getConfidenceBand(c.trustScore);
  const verifiedNames = new Set(c.verifiedSkills.map((s) => s.name));
  const skills = [
    ...c.verifiedSkills.map((s) => ({ skill: s.name, verified: true, confidence: s.confidence })),
    ...c.claimedSkills.filter((s) => !verifiedNames.has(s)).map((s) => ({ skill: s, verified: false, confidence: null })),
  ];
  return {
    user_id: userId,
    name: c.name,
    avatar_url: c.avatar,
    bio: c.bio,
    linkedin_url: c.linkedinUrl,
    github_username: c.githubUrl ? c.githubUrl.split("/").pop() ?? null : null,
    location: c.location,
    open_to_work: c.openToWork,
    trust_score: c.trustScore,
    trust_label: c.trustScore === 0 ? "Get Started" : band.label,
    skills,
    simuhire_badge: c.simuHire.completed
      ? { session_id: `sess-${c.id}`, simulation_type: (c.simuHire.type ?? "technical").toLowerCase(), overall_score: c.simuHire.overallScore ?? 0, shared: c.simuHire.shared }
      : null,
    credential_badges: c.artifacts.filter((a) => a.type === "credential" && a.status === "verified").map((a) => a.name),
    audit_hash: c.merkleRoot,
    public_url: `http://localhost:5173/card/${userId}`,
  };
}

function candidateToPortfolio(c: Candidate, userId: string): PortfolioResponse {
  const band = getConfidenceBand(c.trustScore);
  const verifiedArtifacts = c.artifacts.filter((a) => a.status === "verified").map((a) => artifactToResponse(a, userId));
  const timeline: TimelineNode[] = [
    ...verifiedArtifacts.map((a) => ({
      artifact_id: a.id,
      artifact_name: a.artifact_name,
      artifact_type: a.artifact_type,
      confidence: a.confidence,
      verified_at: a.verified_at,
      created_at: a.created_at,
    })),
    ...(c.simuHire.completed
      ? [{ artifact_id: `sess-${c.id}`, artifact_name: `SimuHire — ${c.simuHire.type}`, artifact_type: "simuhire", confidence: c.simuHire.overallScore ?? null, verified_at: a_now(), created_at: a_now() }]
      : []),
  ].sort((x, y) => (y.verified_at ?? "").localeCompare(x.verified_at ?? ""));

  return {
    id: userId,
    name: c.name,
    university: c.university,
    graduation_year: Number(c.year) || null,
    field_of_study: c.field,
    avatar_url: c.avatar,
    trust_score: c.trustScore,
    trust_label: c.trustScore === 0 ? "Get Started" : band.label,
    verified_artifacts: verifiedArtifacts,
    timeline,
    ledger_summary: { root_hash: c.merkleRoot, entry_count: c.ledger.length },
    public_url: `http://localhost:5173/card/${userId}`,
    contact_email: null,
  };
}
function a_now() {
  return new Date().toISOString();
}

function candidateToLedgerEntries(c: Candidate, userId: string): LedgerEntryResponse[] {
  const verified = c.artifacts.filter((a) => a.status === "verified").sort((a, b) => a.date.localeCompare(b.date));
  return c.ledger.map((entry, i) => ({
    id: `led-${userId}-${entry.blockIndex}`,
    user_id: userId,
    artifact_id: verified[i]?.id ?? `${c.id}-art-${i}`,
    leaf_hash: entry.leafHash,
    root_hash: c.merkleRoot ?? "",
    block_index: entry.blockIndex,
    prev_hash: entry.blockIndex === 0 ? null : entry.prevHash,
    created_at: entry.timestamp,
  }));
}

function jobToResponse(j: Job): JobListingResponse {
  return {
    id: j.id,
    title: j.title,
    location: j.location,
    employment_type: j.employmentType,
    salary_min: j.salaryMin,
    salary_max: j.salaryMax,
    description: j.description,
    required_skills: j.requiredSkills.map((s) => ({ name: s.name, verified_only: s.verifiedOnly })),
    status: j.status,
    created_at: j.createdAt,
  };
}

// ── Identity resolution: which candidate/employer is "logged in" ───────────────────
// Any email/password combination logs in successfully (dev-phase bypass — see login()
// below) but a *recognized* seeded email (firstname.lastname@gmail.com, generated in
// generateDataset.ts) resolves to that real person's data and a name-specific welcome.
// Anything unrecognized falls back to the stable demo identity, same as before.
//
// The mock access token itself encodes the resolved id ("mock-access:<id>") so identity
// survives a page reload — AuthContext's loadMe() calls me() with only the stored token,
// no separate session store would survive that reload.
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function resolveCandidateByEmail(email: string): Candidate {
  const found = allCandidates.find((c) => c.email.toLowerCase() === normalizeEmail(email));
  return found ?? demoCandidate;
}

function resolveEmployerByEmail(email: string): Employer {
  const found = allEmployers.find((e) => e.email.toLowerCase() === normalizeEmail(email));
  return found ?? demoEmployer;
}

function candidateToUserResponse(c: Candidate): UserResponse {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    role: "candidate",
    avatar_url: c.avatar,
    bio: c.bio,
    linkedin_url: c.linkedinUrl,
    github_username: c.githubUrl ? c.githubUrl.split("/").pop() ?? null : null,
    location: c.location,
    open_to_work: c.openToWork,
    university: c.university,
    graduation_year: Number(c.year) || null,
    field_of_study: c.field,
    claimed_skills: c.claimedSkills,
    company_name: null,
  };
}

// UserResponse is candidate-shaped, but company_name already exists on it for exactly
// this case: an employer login riding the same AuthContext/UserResponse without needing
// a parallel context. name is the contact person (Amirul Hassan), company_name is the
// employer's own welcome-message anchor (TechCorp Malaysia).
function employerToUserResponse(e: Employer): UserResponse {
  return {
    id: e.id,
    name: e.contactName,
    email: e.email,
    role: "employer",
    avatar_url: null,
    bio: null,
    linkedin_url: null,
    github_username: null,
    location: e.city,
    open_to_work: false,
    university: null,
    graduation_year: null,
    field_of_study: null,
    claimed_skills: null,
    company_name: e.name,
  };
}

// The full connected roster (minus whichever candidate is currently signed in, who sees
// their own profile via portfolioMe rather than in this discovery list) — 120 real,
// cross-referenced candidates instead of 3 hand-picked ones.
function candidateListExcluding(id: string): CandidateSummary[] {
  return allCandidates.filter((c) => c.id !== id).map(candidateToSummary);
}

// Tracks which employer owns each job — JobListingResponse itself has no employer_id field
// (a real backend would scope by auth token without the client needing to see it), so this
// mock layer keeps that association alongside the response instead of losing it.
let mockJobs: { employerId: string; job: JobListingResponse }[] = allJobs.map((j) => ({
  employerId: j.employerId,
  job: jobToResponse(j),
}));

// SimuHire — a fully scripted session so the whole flow works offline.
const SIMUHIRE_SCRIPT: { interviewer: string; stakeholder?: string; stage: string }[] = [
  {
    interviewer:
      "Welcome. You're a junior engineer, three months in. A bug report just came in: the contact form's Submit button stops responding for ~20% of users — they click, nothing happens, no error. Your tech lead is in a 2-hour meeting. Where do you start?",
    stage: "Setup",
  },
  {
    interviewer: "Good instinct checking the console. You find intermittent 500s from the submit endpoint. What's your next move?",
    stakeholder: "Just a heads-up — a key client is watching this form closely today.",
    stage: "Challenge",
  },
  {
    interviewer:
      "You correlate the errors with a deploy 40 minutes ago. Connection-pool exhaustion looks likely. The fix is a one-line config change, but you can't deploy to prod without approval. What do you do?",
    stage: "Escalation",
  },
  {
    interviewer:
      "You message your lead with a clear summary and a proposed rollback, and mitigate by scaling the pool in staging first. Nicely handled. That wraps the scenario — end the session to see your report.",
    stage: "Resolution",
  },
];

let scriptIndex = 0;

// The mock access token encodes both the resolved role and id, e.g.
// "mock-access:candidate:liyana-ng-10" or "mock-access:employer:apexgroup" — that's what
// lets me() (called on every page load with only the persisted token, see AuthContext.
// loadMe) resolve back to the same person after a reload, without a separate in-memory
// session that a refresh would wipe.
const TOKEN_PREFIX = "mock-access:";
function tokenForCandidate(c: Candidate): string {
  return `${TOKEN_PREFIX}candidate:${c.id}`;
}
function tokenForEmployer(e: Employer): string {
  return `${TOKEN_PREFIX}employer:${e.id}`;
}
function candidateFromToken(token: string | null): Candidate {
  if (!token?.startsWith(`${TOKEN_PREFIX}candidate:`)) return demoCandidate;
  const id = token.slice(`${TOKEN_PREFIX}candidate:`.length);
  return allCandidates.find((c) => c.id === id) ?? demoCandidate;
}
function employerFromToken(token: string | null): Employer {
  if (!token?.startsWith(`${TOKEN_PREFIX}employer:`)) return demoEmployer;
  const id = token.slice(`${TOKEN_PREFIX}employer:`.length);
  return allEmployers.find((e) => e.id === id) ?? demoEmployer;
}

// The real, persisted token (localStorage-backed AsyncStorage) — not an in-memory
// variable, so identity survives a page reload the same way a real session would.
async function currentCandidate(): Promise<Candidate> {
  const token = await tokenStore.getAccessToken();
  return candidateFromToken(token);
}
// Exported for employerData.ts's useCurrentEmployer() — UserResponse (and so
// AuthContext.user) is candidate-shaped, so the Employer side reads its own session
// straight off the same persisted token rather than forcing Employer identity through a
// Candidate-typed context value.
export async function currentEmployer(): Promise<Employer> {
  const token = await tokenStore.getAccessToken();
  return employerFromToken(token);
}

export const mockApi = {
  register: (_payload: RegisterPayload): Promise<TokenResponse> =>
    delay({ access_token: tokenForCandidate(demoCandidate), refresh_token: "mock-refresh", token_type: "bearer" }),
  login: (payload: LoginPayload): Promise<TokenResponse> => {
    // Any email/password combination succeeds (dev-phase bypass) — only a *recognized*
    // seeded email changes who you're signed in as. University has no login flow through
    // here (see universityData.ts) since it's a no-auth demo entry per the original brief.
    const token =
      payload.role === "employer"
        ? tokenForEmployer(resolveEmployerByEmail(payload.email))
        : tokenForCandidate(resolveCandidateByEmail(payload.email));
    return delay({ access_token: token, refresh_token: "mock-refresh", token_type: "bearer" });
  },
  me: async (): Promise<UserResponse> => {
    const token = await tokenStore.getAccessToken();
    if (token?.startsWith(`${TOKEN_PREFIX}employer:`)) return delay(employerToUserResponse(employerFromToken(token)));
    return delay(candidateToUserResponse(candidateFromToken(token)));
  },

  candidatesList: async (): Promise<CandidateSummary[]> => delay(candidateListExcluding((await currentCandidate()).id)),

  namecardGet: async (userId: string): Promise<NamecardResponse> => {
    const c = allCandidates.find((cand) => cand.id === userId) ?? (await currentCandidate());
    return delay(candidateToNamecard(c, c.id));
  },

  portfolioMe: async (): Promise<PortfolioResponse> => {
    const c = await currentCandidate();
    return delay(candidateToPortfolio(c, c.id));
  },
  portfolioGet: async (userId: string): Promise<PortfolioResponse> => {
    const c = allCandidates.find((cand) => cand.id === userId) ?? (await currentCandidate());
    return delay(candidateToPortfolio(c, c.id));
  },

  ledgerList: async (userId: string): Promise<LedgerEntryResponse[]> => {
    const c = allCandidates.find((cand) => cand.id === userId) ?? (await currentCandidate());
    return delay(candidateToLedgerEntries(c, c.id));
  },
  ledgerVerify: async (userId: string): Promise<LedgerIntegrityResponse> => {
    const c = allCandidates.find((cand) => cand.id === userId) ?? (await currentCandidate());
    return delay({
      intact: true,
      entry_count: c.ledger.length,
      computed_root: c.merkleRoot,
      stored_root: c.merkleRoot,
    });
  },

  verifyConsent: () => delay({ consented: true, consent_type: "mock" }),
  verifyListRepos: async (): Promise<GitHubRepo[]> => {
    const c = await currentCandidate();
    const handle = c.githubUrl ? c.githubUrl.split("/").pop() : c.id;
    const fieldSlug = c.field.toLowerCase().replace(/\s+/g, "-");
    return delay([
      { full_name: `${handle}/${fieldSlug}-portfolio`, name: `${fieldSlug}-portfolio`, description: `${c.field} experiments & deployments`, language: "Python", stars: 24, updated_at: "2026-06-29T09:14:32Z" },
      { full_name: `${handle}/data-pipeline`, name: "data-pipeline", description: "ETL toolkit", language: "Python", stars: 8, updated_at: "2026-05-02T09:14:32Z" },
    ]);
  },
  verifyTrigger: (): Promise<VerifyTriggerResponse> => delay({ artifact_id: "art-new-mock", status: "pending", job_id: "job-mock" }),
  // First poll returns pending, then verified — simulates the agent finishing.
  getArtifact: (() => {
    let polls = 0;
    return async (artifactId: string): Promise<ArtifactResponse> => {
      const c = await currentCandidate();
      const existing = c.artifacts.find((a) => a.id === artifactId);
      if (existing) return delay(artifactToResponse(existing, c.id));
      polls += 1;
      const done = polls >= 2;
      return delay({
        id: artifactId,
        user_id: c.id,
        artifact_type: "document",
        artifact_name: "Uploaded document",
        artifact_url: null,
        confidence: done ? 84 : null,
        status: done ? "verified" : "pending",
        ai_generated: done ? false : null,
        metadata: {},
        hash: done ? "b7c8d9e0f1a2b3c4d5e6" : null,
        verified_at: done ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      });
    };
  })(),

  simuhireConsent: () => delay({ consented: true, consent_type: "simuhire" }),
  simuhireCreate: (simulationType: SimulationType): Promise<SessionCreateResponse> => {
    scriptIndex = 0;
    return delay({
      session_id: "sess-mock",
      simulation_type: simulationType,
      stakeholder_persona: "Client Success",
      stage: SIMUHIRE_SCRIPT[0].stage,
      opening_message: SIMUHIRE_SCRIPT[0].interviewer,
    });
  },
  simuhireMessage: (_sessionId: string, _text: string): Promise<MessageResponse> => {
    scriptIndex = Math.min(scriptIndex + 1, SIMUHIRE_SCRIPT.length - 1);
    const step = SIMUHIRE_SCRIPT[scriptIndex];
    return delay({ interviewer_message: step.interviewer, stakeholder_message: step.stakeholder ?? null, stage: step.stage }, 700);
  },
  simuhireEnd: (_sessionId: string): Promise<EndSessionResponse> =>
    delay({
      session_id: "sess-mock",
      overall_score: 82,
      report: {},
      evaluator_scores: { adaptability: 88, communication: 76, problemSolving: 85, stressResponse: 79, systemsThinking: 82 },
      ledger_written: true,
    }),
  simuhireReport: (_sessionId: string): Promise<ReportResponse> =>
    delay({
      session_id: "sess-mock",
      simulation_type: "technical",
      overall_score: 82,
      report: {},
      evaluator_scores: { adaptability: 88, communication: 76, problemSolving: 85, stressResponse: 79, systemsThinking: 82 },
      candidate_shared: false,
      completed_at: new Date().toISOString(),
    }),
  simuhireShare: (_sessionId: string, shared: boolean) => delay({ session_id: "sess-mock", candidate_shared: shared }),

  jobsList: async (): Promise<JobListingResponse[]> => {
    const employer = await currentEmployer();
    return delay(mockJobs.filter((mj) => mj.employerId === employer.id).map((mj) => mj.job));
  },

  jobsCreate: async (payload: JobCreatePayload): Promise<JobListingResponse> => {
    const employer = await currentEmployer();
    const newJob: JobListingResponse = {
      id: `job-${Date.now()}`,
      title: payload.title,
      location: payload.location,
      employment_type: payload.employment_type,
      salary_min: payload.salary_min,
      salary_max: payload.salary_max,
      description: payload.description,
      required_skills: payload.required_skills,
      status: "open",
      created_at: new Date().toISOString(),
    };
    mockJobs = [{ employerId: employer.id, job: newJob }, ...mockJobs];
    return delay(newJob);
  },

  jobsClose: (id: string): Promise<JobListingResponse> => {
    mockJobs = mockJobs.map((mj) => (mj.job.id === id ? { ...mj, job: { ...mj.job, status: "closed" } } : mj));
    const updated = mockJobs.find((mj) => mj.job.id === id)?.job;
    if (!updated) throw new Error("Job not found");
    return delay(updated);
  },
};

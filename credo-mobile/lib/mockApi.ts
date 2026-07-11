// Mock API layer — returns rich, backend-shaped data with zero network calls, so the whole
// app demos fully offline. Gated by MOCK_MODE in config.ts; each *Api function in api.ts
// delegates here when the flag is on. Shapes mirror the real Pydantic responses exactly.
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
} from "./api";

const delay = <T>(value: T, ms = 350): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

const DEMO_ID = "00000000-0000-0000-0000-000000000001";

// The signed-in demo candidate.
export const mockUser: UserResponse = {
  id: DEMO_ID,
  name: "Ahmad Farid",
  email: "ahmad.farid@demo.credo.app",
  role: "candidate",
  avatar_url: null,
  bio: "Final-year CS student specialising in ML and distributed systems.",
  linkedin_url: "https://linkedin.com/in/ahmadfarid",
  github_username: "ahmad-farid",
  location: "Kuala Lumpur",
  open_to_work: true,
  university: "Universiti Malaya",
  graduation_year: 2025,
  field_of_study: "Computer Science",
  claimed_skills: ["Python", "Machine Learning", "SQL", "Docker"],
  company_name: null,
};

const mockArtifacts: ArtifactResponse[] = [
  {
    id: "art-github-1",
    user_id: DEMO_ID,
    artifact_type: "github",
    artifact_name: "ahmad-farid/ml-portfolio",
    artifact_url: "https://github.com/ahmad-farid/ml-portfolio",
    confidence: 91,
    status: "verified",
    ai_generated: false,
    metadata: { commits: 47, complexity: "High", flags: 0 },
    hash: "e37d6f6d4a1c93b8f2c7e109a4d55b2e8f0119d",
    verified_at: "2026-06-29T09:14:32Z",
    created_at: "2026-06-29T09:14:32Z",
  },
  {
    id: "art-cred-1",
    user_id: DEMO_ID,
    artifact_type: "credential",
    artifact_name: "AWS Certified Developer – Associate",
    artifact_url: null,
    confidence: 88,
    status: "verified",
    ai_generated: null,
    metadata: { issuer: "Amazon Web Services", nameMatch: true },
    hash: "36f4cdd9b21e77a0c4e8f19d2b85a3c7d1109ab",
    verified_at: "2026-06-24T14:27:08Z",
    created_at: "2026-06-24T14:27:08Z",
  },
  {
    id: "art-doc-1",
    user_id: DEMO_ID,
    artifact_type: "document",
    artifact_name: "Final Year Research Paper.pdf",
    artifact_url: null,
    confidence: 79,
    status: "verified",
    ai_generated: false,
    metadata: { aiProbability: 8, writingComplexity: 82 },
    hash: "a1f8b2d1c9e04b7c3d6e2f9a5b8c1d4e7f2b119",
    verified_at: "2026-06-18T11:43:51Z",
    created_at: "2026-06-18T11:43:51Z",
  },
];

const mockNamecard: NamecardResponse = {
  user_id: DEMO_ID,
  name: "Ahmad Farid",
  avatar_url: null,
  bio: "Final-year CS student specialising in ML and distributed systems.",
  linkedin_url: "https://linkedin.com/in/ahmadfarid",
  github_username: "ahmad-farid",
  location: "Kuala Lumpur",
  open_to_work: true,
  trust_score: 87,
  trust_label: "Highly Authentic",
  skills: [
    { skill: "Python", verified: true, confidence: 94 },
    { skill: "Machine Learning", verified: true, confidence: 88 },
    { skill: "SQL", verified: true, confidence: 79 },
    { skill: "Docker", verified: true, confidence: 71 },
    { skill: "Kubernetes", verified: false, confidence: null },
    { skill: "Go", verified: false, confidence: null },
  ],
  simuhire_badge: {
    session_id: "sess-1",
    simulation_type: "technical",
    overall_score: 82,
    shared: true,
  },
  credential_badges: ["AWS Certified Developer"],
  audit_hash: "f2b9c3e7a1d04a8b5c2e6f1d9a3b7c4e",
  public_url: `http://localhost:5173/card/${DEMO_ID}`,
};

const mockPortfolio: PortfolioResponse = {
  id: DEMO_ID,
  name: "Ahmad Farid",
  university: "Universiti Malaya",
  graduation_year: 2025,
  field_of_study: "Computer Science",
  avatar_url: null,
  trust_score: 87,
  trust_label: "Highly Authentic",
  verified_artifacts: mockArtifacts,
  timeline: [
    { artifact_id: "art-github-1", artifact_name: "ahmad-farid/ml-portfolio", artifact_type: "github", confidence: 91, verified_at: "2026-06-29T09:14:32Z", created_at: "2026-06-29T09:14:32Z" },
    { artifact_id: "sess-1", artifact_name: "SimuHire — Technical", artifact_type: "simuhire", confidence: 82, verified_at: "2026-06-25T10:00:00Z", created_at: "2026-06-25T10:00:00Z" },
    { artifact_id: "art-cred-1", artifact_name: "AWS Certified Developer – Associate", artifact_type: "credential", confidence: 88, verified_at: "2026-06-24T14:27:08Z", created_at: "2026-06-24T14:27:08Z" },
    { artifact_id: "art-doc-1", artifact_name: "Final Year Research Paper.pdf", artifact_type: "document", confidence: 79, verified_at: "2026-06-18T11:43:51Z", created_at: "2026-06-18T11:43:51Z" },
  ],
  ledger_summary: { root_hash: "f2b9c3e7a1d04a8b5c2e6f1d9a3b7c4e", entry_count: 3 },
  public_url: `http://localhost:5173/card/${DEMO_ID}`,
  contact_email: null,
};

const mockLedgerEntries: LedgerEntryResponse[] = [
  { id: "led-0", user_id: DEMO_ID, artifact_id: "art-doc-1", leaf_hash: "a1f8b2d1c9e04b7c119d", root_hash: "f2b9c3e7a1d04a8b7c4e", block_index: 0, prev_hash: null, created_at: "2026-06-18T11:43:51Z" },
  { id: "led-1", user_id: DEMO_ID, artifact_id: "art-cred-1", leaf_hash: "36f4cdd9b21e77a02b85", root_hash: "f2b9c3e7a1d04a8b7c4e", block_index: 1, prev_hash: "a1f8b2d1c9e04b7c119d", created_at: "2026-06-24T14:27:08Z" },
  { id: "led-2", user_id: DEMO_ID, artifact_id: "art-github-1", leaf_hash: "e37d6f6d4a1c93b8119d", root_hash: "f2b9c3e7a1d04a8b7c4e", block_index: 2, prev_hash: "36f4cdd9b21e77a02b85", created_at: "2026-06-29T09:14:32Z" },
];

const mockCandidateList: CandidateSummary[] = [
  {
    id: DEMO_ID,
    name: "Ahmad Farid",
    university: "Universiti Malaya",
    graduation_year: 2025,
    field_of_study: "Computer Science",
    avatar_url: null,
    location: "Kuala Lumpur",
    open_to_work: true,
    trust_score: 87,
    trust_label: "Highly Authentic",
    verified_skills: [{ name: "ahmad-farid/ml-portfolio", confidence: 91, artifact_type: "github" }],
    claimed_skills: ["Python", "Machine Learning", "SQL", "Docker"],
    simuhire_completed: true,
    simuhire_shared: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Priya Nair",
    university: "Universiti Teknologi Malaysia",
    graduation_year: 2025,
    field_of_study: "Software Engineering",
    avatar_url: null,
    location: "Johor Bahru",
    open_to_work: true,
    trust_score: 71,
    trust_label: "Authentic",
    verified_skills: [{ name: "priya-nair/ecommerce-app", confidence: 71, artifact_type: "github" }],
    claimed_skills: ["React", "Node.js", "TypeScript"],
    simuhire_completed: false,
    simuhire_shared: false,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Wei Chen",
    university: "Universiti Putra Malaysia",
    graduation_year: 2026,
    field_of_study: "Information Technology",
    avatar_url: null,
    location: "Petaling Jaya",
    open_to_work: false,
    trust_score: 38,
    trust_label: "Inconclusive",
    verified_skills: [],
    claimed_skills: ["Excel", "PowerPoint", "Canva"],
    simuhire_completed: false,
    simuhire_shared: false,
  },
];

let mockJobs: JobListingResponse[] = [
  {
    id: "job-1",
    title: "Junior ML Engineer",
    location: "Kuala Lumpur",
    employment_type: "full-time",
    salary_min: 4500,
    salary_max: 6000,
    description: "Join our data team building production ML pipelines. You'll own model deployment, monitoring, and iteration cycles.",
    required_skills: [
      { name: "Python", verified_only: true },
      { name: "Machine Learning", verified_only: true },
      { name: "Docker", verified_only: false },
    ],
    status: "open",
    created_at: "2026-07-01T09:00:00Z",
  },
  {
    id: "job-2",
    title: "Frontend Engineer",
    location: "Remote",
    employment_type: "full-time",
    salary_min: 4000,
    salary_max: 5500,
    description: "Build and maintain our customer-facing web application. Strong component design and accessibility awareness required.",
    required_skills: [
      { name: "React", verified_only: true },
      { name: "TypeScript", verified_only: true },
    ],
    status: "open",
    created_at: "2026-07-03T10:30:00Z",
  },
  {
    id: "job-3",
    title: "Data Analyst Intern",
    location: "Petaling Jaya",
    employment_type: "internship",
    salary_min: 1200,
    salary_max: 1800,
    description: "6-month internship supporting the analytics team with dashboards and ad-hoc analysis.",
    required_skills: [
      { name: "SQL", verified_only: true },
      { name: "Excel", verified_only: false },
    ],
    status: "closed",
    created_at: "2026-06-15T08:00:00Z",
  },
];

// SimuHire — a fully scripted session so the whole flow works offline.
const SIMUHIRE_SCRIPT: { interviewer: string; stakeholder?: string; stage: string }[] = [
  {
    interviewer:
      "Welcome. You're a junior engineer, three months in. A bug report just came in: the contact form's Submit button stops responding for ~20% of users — they click, nothing happens, no error. Your tech lead is in a 2-hour meeting. Where do you start?",
    stage: "Diagnosis",
  },
  {
    interviewer: "Good instinct checking the console. You find intermittent 500s from the submit endpoint. What's your next move?",
    stakeholder: "(Client Success): Just a heads-up — a key client is watching this form closely today.",
    stage: "Investigation",
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

export const mockApi = {
  register: (_payload: RegisterPayload): Promise<TokenResponse> =>
    delay({ access_token: "mock-access", refresh_token: "mock-refresh", token_type: "bearer" }),
  login: (_payload: LoginPayload): Promise<TokenResponse> =>
    delay({ access_token: "mock-access", refresh_token: "mock-refresh", token_type: "bearer" }),
  me: (): Promise<UserResponse> => delay(mockUser),

  candidatesList: (): Promise<CandidateSummary[]> => delay(mockCandidateList),

  namecardGet: (_userId: string): Promise<NamecardResponse> => delay(mockNamecard),

  portfolioMe: (): Promise<PortfolioResponse> => delay(mockPortfolio),
  portfolioGet: (_userId: string): Promise<PortfolioResponse> => delay(mockPortfolio),

  ledgerList: (_userId: string): Promise<LedgerEntryResponse[]> => delay(mockLedgerEntries),
  ledgerVerify: (_userId: string): Promise<LedgerIntegrityResponse> =>
    delay({ intact: true, entry_count: 3, computed_root: "f2b9c3e7a1d04a8b7c4e", stored_root: "f2b9c3e7a1d04a8b7c4e" }),

  verifyConsent: () => delay({ consented: true, consent_type: "mock" }),
  verifyListRepos: (): Promise<GitHubRepo[]> =>
    delay([
      { full_name: "ahmad-farid/ml-portfolio", name: "ml-portfolio", description: "ML experiments & deployments", language: "Python", stars: 24, updated_at: "2026-06-29T09:14:32Z" },
      { full_name: "ahmad-farid/data-pipeline", name: "data-pipeline", description: "ETL toolkit", language: "Python", stars: 8, updated_at: "2026-05-02T09:14:32Z" },
    ]),
  verifyTrigger: (): Promise<VerifyTriggerResponse> => delay({ artifact_id: "art-new-mock", status: "pending", job_id: "job-mock" }),
  // First poll returns pending, then verified — simulates the agent finishing.
  getArtifact: (() => {
    let polls = 0;
    return (artifactId: string): Promise<ArtifactResponse> => {
      const existing = mockArtifacts.find((a) => a.id === artifactId);
      if (existing) return delay(existing);
      polls += 1;
      const done = polls >= 2;
      return delay({
        id: artifactId,
        user_id: DEMO_ID,
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

  jobsList: (): Promise<JobListingResponse[]> => delay([...mockJobs]),

  jobsCreate: (payload: JobCreatePayload): Promise<JobListingResponse> => {
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
    mockJobs = [newJob, ...mockJobs];
    return delay(newJob);
  },

  jobsClose: (id: string): Promise<JobListingResponse> => {
    mockJobs = mockJobs.map((j) => (j.id === id ? { ...j, status: "closed" } : j));
    const updated = mockJobs.find((j) => j.id === id);
    if (!updated) throw new Error("Job not found");
    return delay(updated);
  },
};

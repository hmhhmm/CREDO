// Rich mock data for the Employer side (E1–E8), now derived from the connected dataset
// in generateDataset.ts (60 employers, 120 candidates) instead of 4 hand-picked ids.
//
// `employer`/`dashboardStats` are functions of *which* employer is logged in (see
// EmployerHomeScreen's useCurrentEmployer) so a real seeded login shows that employer's
// own name/company/job stats — Discover/Pipeline/Signals stay shared demo content across
// every employer account, illustrating the platform rather than one company's real data.
import type { Candidate } from "./types";
import { allCandidates, allJobs, type Employer } from "./generateDataset";

export function getEmployerIdentity(employer: Employer) {
  return {
    name: employer.contactName,
    company: employer.name,
    industry: employer.industry,
    size: employer.size,
    initial: employer.initial,
  };
}

// ── E8 Hire Intelligence + E5 Retention + E7 Onboarding: dashboard signals ──────
export interface DashboardStat {
  label: string;
  value: string;
  hint: string;
}
export function getDashboardStats(employer: Employer): DashboardStat[] {
  const myJobs = allJobs.filter((j) => j.employerId === employer.id);
  const openJobs = myJobs.filter((j) => j.status === "open");
  const verifiedOnlyJobs = openJobs.filter((j) => j.requiredSkills.some((s) => s.verifiedOnly));
  return [
    { label: "Active roles", value: String(openJobs.length), hint: `${verifiedOnlyJobs.length} verified-only` },
    { label: "In pipeline", value: "18", hint: "6 SimuHire done" },
    { label: "Hired (Q)", value: "5", hint: "all verified" },
  ];
}

export type SignalLevel = "critical" | "warning" | "good";
export interface Signal {
  id: string;
  feature: string; // which E-feature it demonstrates
  level: SignalLevel;
  title: string;
  body: string;
  person?: string;
}
export const signals: Signal[] = [
  {
    id: "s1",
    feature: "E5 · Retention Signals",
    level: "critical",
    title: "Flight risk detected",
    body: "Nadia Rahman's engagement dropped 40% this month and she updated her verified skills twice — early signs she may be exploring. Worth a check-in before the resignation letter lands.",
    person: "Nadia Rahman · Senior Engineer",
  },
  {
    id: "s2",
    feature: "E7 · Onboarding Predictor",
    level: "warning",
    title: "New-hire risk in first 60 days",
    body: "Jason Lee is 45 days in and his ramp metrics trail the cohort median. Flagging now, before probation ends, so a mentor pairing can be arranged.",
    person: "Jason Lee · Data Analyst",
  },
  {
    id: "s3",
    feature: "E8 · Hire Intelligence",
    level: "good",
    title: "Verified hires outperforming",
    body: "Candidates you hired via verified skill confidence are performing 22% above your keyword-matched hires from last year, measured on 90-day review scores.",
  },
];

// ── E1 Verified Marketplace: verification completeness ──────────────────────────
// Single source of truth for "which of the three verification types does this candidate
// have, verified" — read by both the Discover glance row and the fully-verified stamp, so
// the two can never disagree about what counts as verified.
export interface VerificationCompleteness {
  github: boolean;
  credential: boolean;
  document: boolean;
  isFullyVerified: boolean;
}

export function getVerificationCompleteness(c: Candidate): VerificationCompleteness {
  const hasVerified = (type: "github" | "credential" | "document") =>
    c.artifacts.some((a) => a.type === type && a.status === "verified");
  const github = hasVerified("github");
  const credential = hasVerified("credential");
  const document = hasVerified("document");
  return { github, credential, document, isFullyVerified: github && credential && document };
}

// ── E1 Verified Marketplace + E2 Smart Matching: discover candidates ────────────
// The full connected roster, with a "trajectory" line for E2 Smart Matching derived
// from each candidate's actual verified skills and artifact count — not a fixed index.
export interface DiscoverCandidate extends Candidate {
  trajectory: string;
}

function formatMonthYear(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Computed from the candidate's own artifacts/claimedSkills — not a hardcoded per-index
// string. "Where they're heading" = verified momentum (how many artifacts, how recent) +
// direction (claimed skills not yet verified, i.e. what they're actively building toward).
// Deliberately doesn't compare artifact dates against wall-clock "now": as the mock dates
// age relative to the real calendar, a "verified in the last 6 months" claim would silently
// go stale and start reading as false. Citing the actual month instead stays true forever.
function buildTrajectory(c: Candidate): string {
  const verified = c.artifacts.filter((a) => a.status === "verified");
  if (verified.length === 0) {
    return "Early-stage — no verified artifacts yet";
  }

  const mostRecent = [...verified].sort((a, b) => b.date.localeCompare(a.date))[0];
  const momentum = `${verified.length} verified artifact${verified.length === 1 ? "" : "s"}, most recently ${formatMonthYear(mostRecent.date)}`;

  const buildingToward = c.claimedSkills.filter(
    (skill) => !c.verifiedSkills.some((vs) => vs.name.toLowerCase() === skill.toLowerCase())
  );
  if (buildingToward.length > 0) {
    return `${momentum} — building toward ${buildingToward.join(", ")}`;
  }
  return momentum;
}

export const discoverCandidates: DiscoverCandidate[] = allCandidates.map((c) => ({
  ...c,
  trajectory: buildTrajectory(c),
}));

// ── E3 SimuHire Review + E9 Interview Invitation + E6 Re-Engagement: pipeline stages ─────
// SimuHire completion is no longer a pipeline stage employers wait on — a candidate whose
// simuhire_done entry is seeded here is already SimuHire-complete (drawn from withSimuHire
// below). Discover legitimately shows candidates who haven't done SimuHire yet (early-stage
// "explorers," correspondingly lower trust scores) — that's expected variance across the
// full roster, not something Pipeline needs to track a waiting-stage for. There is
// deliberately no "invited"/"awaiting SimuHire" stage anymore.
export type PipelineStage = "simuhire_done" | "shortlisted" | "re_engage";

// E9 Interview Invitation — orthogonal to `stage`, not folded into it: a candidate can be
// `shortlisted` and separately partway through the interview round sequence at the same
// time. Tracks the human interview process employers now explicitly manage, since SimuHire
// no longer needs tracking.
//
// Stage *names* are employer-configurable (Settings — see InterviewStagesContext), not a
// fixed enum: "1st Round"/"Technical Interview"/"Cultural Fit" etc. are data, not code. Each
// employer gets their own ordered list, seeded from DEFAULT_INTERVIEW_STAGES, and can
// rename/reorder/add/remove — names must stay unique within one employer's list.
export interface InterviewStageDef {
  id: string; // stable — survives a rename, so PipelineEntry.currentStageId never dangles
  name: string;
}

export const DEFAULT_INTERVIEW_STAGES: InterviewStageDef[] = [
  { id: "invitation-sent", name: "Invitation Sent" },
  { id: "round-1", name: "1st Round" },
  { id: "round-2", name: "2nd Round" },
  { id: "technical", name: "Technical Interview" },
  { id: "cultural-fit", name: "Cultural Fit Interview" },
];

export interface PipelineEntry {
  id: string; // globally unique across employers — always prefixed with employerId
  employerId: string; // which employer this entry belongs to — Pipeline is scoped per employer
  candidateId: string; // links back to allCandidates — same person as Discover/Partners
  name: string;
  field: string;
  trustScore: number;
  stage: PipelineStage;
  detail: string;
  simuHire?: {
    type: string;
    overallScore: number;
    dimensions: Record<string, number>;
  };
  // E6 Re-Engagement — set once a light-touch message has actually been sent, so the
  // pipeline remembers the touch instead of a component-local "sent" flag that forgets on
  // navigation.
  lastTouchedAt?: string;
  lastTouchMessage?: string;
  // E9 Interview Invitation — currentStageId is null until "Invite to Interview"; it then
  // references one of the employer's configured InterviewStageDef ids. interviewDate/
  // meetingLink describe the *current* stage's meeting; advancing to the next stage clears
  // both. stageCompletedAt is set only once the candidate finishes the last configured stage.
  currentStageId: string | null;
  interviewDate?: string;
  meetingLink?: string;
  stageCompletedAt?: string;
  // E-Decision — the final call on a candidate, independent of which round they're at when
  // it's made (an employer can reject mid-process, not only after the last round). Message
  // is always stored, whether the HR user sent the default template or a custom one — the
  // profile screen needs something real to display either way.
  decision?: "accepted" | "rejected";
  decisionMessage?: string;
  decisionAt?: string;
}

// Picks a deterministic, varied slice of the real roster to seed each employer's pipeline
// with — one candidate per stage type, chosen by real attributes (SimuHire completion,
// trust score) rather than 4 fixed ids that would break the moment the roster regenerates.
// Only ~42% of the full 121-candidate roster has completed SimuHire (the rest are early-
// stage "explorers" — expected, not a bug); withSimuHire is the pool the simuhire_done
// entries below actually draw from. These picks are the same across every employer (the
// selection formula is deterministic, not employer-specific) — what makes each employer's
// Pipeline actually theirs is employerId-scoped storage in PipelineContext, not different
// seed candidates.
const withSimuHire = allCandidates.filter((c) => c.simuHire.completed);
const shortlistCandidate = allCandidates.find((c) => c.trustScore >= 70 && !withSimuHire.includes(allCandidates[0]))
  ?? allCandidates[2];
const reEngageCandidate = allCandidates.find((c) => !c.openToWork) ?? allCandidates[3];

// Builds a fresh PipelineEntry from any candidate not already in the pipeline — used when
// "Invite to Interview" is pressed from a profile the employer reached via Discover/Fair
// Mode rather than one already tracked in Pipeline. id is employerId-prefixed so the same
// candidate invited by two different employers doesn't collide into one entry.
export function pipelineEntryFromCandidate(c: Candidate, employerId: string): PipelineEntry {
  return {
    id: `${employerId}-p-${c.id}`,
    employerId,
    candidateId: c.id,
    name: c.name,
    field: c.field,
    trustScore: c.trustScore,
    stage: "simuhire_done",
    detail: c.simuHire.type
      ? `SimuHire ${c.simuHire.type} · ${c.simuHire.overallScore}/100 — report ready to review`
      : "SimuHire completed — candidate chose to keep private",
    simuHire:
      c.simuHire.type && c.simuHire.overallScore != null && c.simuHire.dimensions
        ? { type: c.simuHire.type, overallScore: c.simuHire.overallScore, dimensions: c.simuHire.dimensions }
        : undefined,
    currentStageId: null,
  };
}

// Called once per employer, the first time they're seen logged in this session (see
// PipelineContext) — not a module-level constant, since every employer needs their own
// entries with their own employerId, not one shared array.
export function getPipelineSeedFor(employer: Employer): PipelineEntry[] {
  const demoJobs = allJobs.filter((j) => j.employerId === employer.id);
  return [
    {
      id: `${employer.id}-p1`,
      employerId: employer.id,
      candidateId: withSimuHire[0].id,
      name: withSimuHire[0].name,
      field: withSimuHire[0].field,
      trustScore: withSimuHire[0].trustScore,
      stage: "simuhire_done",
      detail: `SimuHire ${withSimuHire[0].simuHire.type} · ${withSimuHire[0].simuHire.overallScore}/100 — report ready to review`,
      simuHire: {
        type: withSimuHire[0].simuHire.type!,
        overallScore: withSimuHire[0].simuHire.overallScore!,
        dimensions: withSimuHire[0].simuHire.dimensions!,
      },
      currentStageId: DEFAULT_INTERVIEW_STAGES[0].id, // "Invitation Sent"
    },
    {
      id: `${employer.id}-p2`,
      employerId: employer.id,
      candidateId: withSimuHire[1].id,
      name: withSimuHire[1].name,
      field: withSimuHire[1].field,
      trustScore: withSimuHire[1].trustScore,
      stage: "simuhire_done",
      detail: `SimuHire ${withSimuHire[1].simuHire.type} · ${withSimuHire[1].simuHire.overallScore}/100 — report ready to review`,
      simuHire: {
        type: withSimuHire[1].simuHire.type!,
        overallScore: withSimuHire[1].simuHire.overallScore!,
        dimensions: withSimuHire[1].simuHire.dimensions!,
      },
      currentStageId: null,
    },
    {
      id: `${employer.id}-p3`,
      employerId: employer.id,
      candidateId: shortlistCandidate.id,
      name: shortlistCandidate.name,
      field: shortlistCandidate.field,
      trustScore: shortlistCandidate.trustScore,
      stage: "shortlisted",
      detail: `Shortlisted for ${demoJobs[0]?.title ?? "an open role"} — verified ${shortlistCandidate.verifiedSkills[0]?.name ?? "skills"}`,
      currentStageId: DEFAULT_INTERVIEW_STAGES[1].id, // "1st Round" — scheduled, mid-funnel
      // Real ISO datetime, set to today at 10am — every employer sees at least one
      // same-day interview on login, so Home's "Today's Interviews" section (E4) always
      // has something real to show without requiring manual scheduling first.
      interviewDate: (() => {
        const d = new Date();
        d.setHours(10, 0, 0, 0);
        return d.toISOString();
      })(),
      meetingLink: `https://meet.credo.app/${employer.id}-p3`,
    },
    {
      id: `${employer.id}-p4`,
      employerId: employer.id,
      candidateId: reEngageCandidate.id,
      name: reEngageCandidate.name,
      field: reEngageCandidate.field,
      trustScore: reEngageCandidate.trustScore,
      stage: "re_engage",
      detail: "Said no in March — timing may have changed, worth a light touch",
      currentStageId: null,
    },
  ];
}

export const STAGE_META: Record<PipelineStage, { label: string; color: string }> = {
  simuhire_done: { label: "SimuHire done", color: "#1F7A5C" },
  shortlisted: { label: "Shortlisted", color: "#2F6E8F" },
  re_engage: { label: "Re-engage", color: "#6B7785" },
};

// ── E8 Hire Intelligence Dashboard ───────────────────────────────────────────────
// Pure local demo data — no backend. Tells one story: hires sourced through verified
// profiles keep outperforming keyword-matched hires, and the gap is widening quarter
// over quarter, not a one-off.
export interface QuarterPerformance {
  quarter: string;
  verifiedAvg: number; // avg 90-day review score, hires sourced via verified profile
  keywordAvg: number; // avg 90-day review score, keyword-matched hires
}
export const performanceByQuarter: QuarterPerformance[] = [
  { quarter: "Q3 '25", verifiedAvg: 74, keywordAvg: 68 },
  { quarter: "Q4 '25", verifiedAvg: 79, keywordAvg: 66 },
  { quarter: "Q1 '26", verifiedAvg: 83, keywordAvg: 65 },
  { quarter: "Q2 '26", verifiedAvg: 86, keywordAvg: 64 },
];

export interface HireRecord {
  id: string;
  candidateId: string; // links back to mockCandidates — lets the row drill into a real profile
  name: string;
  role: string;
  trustScoreAtHire: number;
  reviewScore: number; // 90-day review score
  hiredOn: string;
}
// Ids must exist in the generated dataset (see generateDataset.ts) — these three are
// real, strong, SimuHire-completed candidates picked from allCandidates, not placeholders.
export const recentHires: HireRecord[] = [
  { id: "h1", candidateId: "khalid-aziz-86", name: "Khalid Aziz", role: "Research Associate", trustScoreAtHire: 83, reviewScore: 91, hiredOn: "Jun 2026" },
  { id: "h2", candidateId: "liyana-ng-10", name: "Liyana Ng", role: "Financial Analyst", trustScoreAtHire: 83, reviewScore: 87, hiredOn: "May 2026" },
  { id: "h3", candidateId: "ravi-rashid-81", name: "Ravi Rashid", role: "Data Analyst", trustScoreAtHire: 82, reviewScore: 85, hiredOn: "Apr 2026" },
];

export const hireIntelligence = {
  // No separate upliftPercent constant — it's derived in HireIntelligenceScreen from the
  // latest entry in performanceByQuarter so the headline number can never drift from the
  // chart directly beneath it.
  verifiedShareThisQuarter: 71, // % of this quarter's hires sourced via verified profile
  totalHiredThisQuarter: 7,
  performanceByQuarter,
  recentHires,
};

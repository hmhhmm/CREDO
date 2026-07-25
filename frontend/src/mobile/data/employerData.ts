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
// `pipeline` is this employer's own slice of PipelineContext (passed in rather than read
// here, since this file has no context access) — "In pipeline" and "Hired (Q)" are live
// counts off real entries, not fixed demo numbers.
export function getDashboardStats(employer: Employer, pipeline: PipelineEntry[]): DashboardStat[] {
  const myJobs = allJobs.filter((j) => j.employerId === employer.id);
  const openJobs = myJobs.filter((j) => j.status === "open");
  const verifiedOnlyJobs = openJobs.filter((j) => j.requiredSkills.some((s) => s.verifiedOnly));

  const inPipeline = pipeline.filter((p) => !p.decision);
  const simuHireDone = inPipeline.filter((p) => p.simuHire).length;

  const hired = pipeline.filter((p) => p.decision === "accepted");
  const hiredVerified = hired.filter((p) => p.trustScore >= 80).length;

  return [
    { label: "Active roles", value: String(openJobs.length), hint: `${verifiedOnlyJobs.length} verified-only` },
    { label: "In pipeline", value: String(inPipeline.length), hint: `${simuHireDone} SimuHire done` },
    {
      label: "Hired (Q)",
      value: String(hired.length),
      hint: hired.length === 0 ? "none yet" : hiredVerified === hired.length ? "all verified" : `${hiredVerified} verified`,
    },
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

export function formatMonthYear(isoDate: string): string {
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
//
// "applied" is the one candidate-initiated stage in this set — every other stage is a
// reason the *employer* added someone (found via Discover/Fair Mode, SimuHire review,
// re-engagement). It's what a candidate's own "Apply with Smart Namecard" tap creates: a
// real PipelineEntry the employer sees on their Pipeline (bucketed under "Not Invited"
// until they act on it), not a fabricated candidate-only status.
export type PipelineStage = "applied" | "simuhire_done" | "shortlisted" | "re_engage";

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
  openToWork: boolean; // E8 — resurfacing signal; see sortPipelineForAttention below
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
  // Transparency timestamps (candidate-facing Application Status) — set at real moments,
  // not synthesized at render time. appliedAt is stamped when a candidate-initiated
  // application is created; hrViewedAt the first time the employer opens that candidate's
  // profile from Pipeline (see PipelineScreen's openProfile / PipelineContext.markViewed).
  appliedAt?: string;
  hrViewedAt?: string;
  // E-Decision — the final call on a candidate, independent of which round they're at when
  // it's made (an employer can reject mid-process, not only after the last round). Message
  // is always stored, whether the HR user sent the default template or a custom one — the
  // profile screen needs something real to display either way.
  decision?: "accepted" | "rejected";
  decisionMessage?: string;
  decisionAt?: string;
  // HR rating + comments — capture-and-display only in this pass. Feeding this into an
  // actual matching/scoring pipeline is separate, backend work; nothing here computes
  // against it yet.
  hrRating?: number; // 1-5
  hrComments?: HRComment[];
}

export interface HRComment {
  id: string;
  author: string;
  text: string;
  date: string;
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
// Each pick explicitly excludes everyone already chosen — without this, two of the four
// seed slots can resolve to the same real person (seen live: shortlistCandidate's old
// predicate never referenced its own loop variable, so it always fell through to the same
// fallback index as reEngageCandidate's unconstrained find(), seeding one candidate twice
// into the same employer's Pipeline under two different stages).
const seedPickedIds = new Set([withSimuHire[0]?.id, withSimuHire[1]?.id]);
const shortlistCandidate =
  allCandidates.find((c) => c.trustScore >= 70 && !seedPickedIds.has(c.id)) ?? allCandidates[2];
seedPickedIds.add(shortlistCandidate.id);
const reEngageCandidate =
  allCandidates.find((c) => !c.openToWork && !seedPickedIds.has(c.id)) ?? allCandidates[3];

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
    openToWork: c.openToWork,
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

// Candidate-initiated application — "Apply with Smart Namecard" on a job card. Distinct
// from pipelineEntryFromCandidate (an employer sourcing someone): here the candidate is the
// actor, currentStageId stays null (not yet reviewed by the employer), and detail names the
// specific role applied to rather than a SimuHire summary.
export function pipelineEntryFromApplication(c: Candidate, employerId: string, jobTitle: string): PipelineEntry {
  return {
    id: `${employerId}-p-${c.id}`,
    employerId,
    candidateId: c.id,
    name: c.name,
    field: c.field,
    trustScore: c.trustScore,
    openToWork: c.openToWork,
    stage: "applied",
    detail: `Applied for ${jobTitle} via Smart Namecard`,
    currentStageId: null,
    appliedAt: new Date().toISOString(),
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
      openToWork: withSimuHire[0].openToWork,
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
      openToWork: withSimuHire[1].openToWork,
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
      openToWork: shortlistCandidate.openToWork,
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
      openToWork: reEngageCandidate.openToWork,
      stage: "re_engage",
      detail: "Said no in March — timing may have changed, worth a light touch",
      currentStageId: null,
    },
  ];
}

// E8 — resurfaces candidates who deserve a second look instead of leaving them wherever
// they happened to land: anyone who's actually engaged (a re-engagement touch went out and
// hasn't gone nowhere) or is open to work again sorts to the top. A final decision
// (accepted/rejected) means there's nothing left to act on, so those sink to the bottom
// regardless of the other two signals — "needs attention" isn't the same as "still open."
// Stable sort (Array.prototype.sort is spec-guaranteed stable) keeps relative order within
// each bucket, so this doesn't reshuffle unrelated cards on every render.
export function sortPipelineForAttention(entries: PipelineEntry[]): PipelineEntry[] {
  const bucketFor = (e: PipelineEntry): number => {
    if (e.decision) return 2;
    if (e.lastTouchedAt || e.openToWork) return 0;
    return 1;
  };
  return [...entries].sort((a, b) => bucketFor(a) - bucketFor(b));
}

export const STAGE_META: Record<PipelineStage, { label: string; color: string }> = {
  applied: { label: "Applied", color: "#C17A3D" },
  simuhire_done: { label: "SimuHire done", color: "#1F7A5C" },
  shortlisted: { label: "Shortlisted", color: "#2F6E8F" },
  re_engage: { label: "Re-engage", color: "#6B7785" },
};

// ── E8 Hire Intelligence Dashboard ───────────────────────────────────────────────
// Real, not mock: there is no post-hire performance signal anywhere in the data model
// (nothing tracks how a hire performs after joining), so this is grounded in the one real
// signal that does exist — trust score at the moment of hire — rather than a fabricated
// "90-day review score."
export interface QuarterTrust {
  quarter: string;
  avgTrustScore: number;
  hireCount: number;
}

function quarterLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return `Q${Math.floor(d.getMonth() / 3) + 1} '${String(d.getFullYear()).slice(-2)}`;
}

// Buckets real accepted hires by the calendar quarter they were hired in, oldest first —
// the chart and headline both read directly off this, so neither can drift from real data.
export function trustByQuarter(hires: HireRecord[]): QuarterTrust[] {
  const byQuarter = new Map<string, { sum: number; count: number; sortKey: string }>();
  for (const h of hires) {
    const label = quarterLabel(h.hiredOn);
    const d = new Date(h.hiredOn);
    const sortKey = `${d.getFullYear()}-${Math.floor(d.getMonth() / 3)}`;
    const bucket = byQuarter.get(label) ?? { sum: 0, count: 0, sortKey };
    bucket.sum += h.trustScoreAtHire;
    bucket.count += 1;
    byQuarter.set(label, bucket);
  }
  return Array.from(byQuarter.entries())
    .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
    .map(([quarter, { sum, count }]) => ({ quarter, avgTrustScore: Math.round(sum / count), hireCount: count }));
}

export interface HireRecord {
  id: string;
  candidateId: string; // links back to mockCandidates — lets the row drill into a real profile
  name: string;
  role: string;
  trustScoreAtHire: number;
  hiredOn: string; // ISO — HireIntelligenceScreen formats it for display
}

// Real, not mock: derives the actual list of a given employer's accepted PipelineContext
// entries, most recent first. There is no post-hire performance signal anywhere in the data
// model (nothing tracks how a hire performs after joining), so unlike performanceByQuarter/
// verifiedShareThisQuarter above — which stay illustrative demo data — this only surfaces
// what's actually real: who was hired, when, and how verified they were at the time.
export function hiresFromPipeline(pipeline: PipelineEntry[]): HireRecord[] {
  return pipeline
    .filter((p): p is PipelineEntry & { decisionAt: string } => p.decision === "accepted" && !!p.decisionAt)
    .sort((a, b) => b.decisionAt.localeCompare(a.decisionAt))
    .map((p) => ({
      id: p.id,
      candidateId: p.candidateId,
      name: p.name,
      role: p.field,
      trustScoreAtHire: p.trustScore,
      hiredOn: p.decisionAt,
    }));
}

// Real: the subset of hiresFromPipeline's entries that fall in the current calendar quarter.
export function hiresThisQuarter(hires: HireRecord[]): HireRecord[] {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  return hires.filter((h) => {
    const d = new Date(h.hiredOn);
    return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === currentQuarter;
  });
}

// Real: % of a set of hires that were "verified" at the point of hire — trustScore >= 80,
// the same "Highly Authentic" threshold confidenceBand.ts uses everywhere else in the app.
// Every hire in hiresFromPipeline already came through a verified CREDO profile (there's no
// keyword-only sourcing path in this app), so this reads as "how many were highly verified"
// rather than "verified vs unverified sourcing."
export function verifiedShareOf(hires: HireRecord[]): number {
  if (hires.length === 0) return 0;
  const verified = hires.filter((h) => h.trustScoreAtHire >= 80).length;
  return Math.round((verified / hires.length) * 100);
}


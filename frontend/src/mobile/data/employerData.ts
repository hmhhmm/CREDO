// Rich mock data for the Employer side (E1–E8), now derived from the connected dataset
// in generateDataset.ts (60 employers, 120 candidates) instead of 4 hand-picked ids.
//
// `employer`/`dashboardStats` are functions of *which* employer is logged in (see
// EmployerHomeScreen's useCurrentEmployer) so a real seeded login shows that employer's
// own name/company/job stats — Discover/Pipeline/Signals stay shared demo content across
// every employer account, illustrating the platform rather than one company's real data.
import type { Candidate } from "./types";
import { allCandidates, demoEmployer, allJobs, type Employer } from "./generateDataset";

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

// ── E1 Verified Marketplace + E2 Smart Matching: discover candidates ────────────
// The full connected roster, with a "trajectory" line for E2 Smart Matching derived
// from each candidate's actual verified skills and artifact count — not a fixed index.
export interface DiscoverCandidate extends Candidate {
  trajectory: string;
}

function trajectoryFor(c: Candidate): string {
  const verifiedCount = c.artifacts.filter((a) => a.status === "verified").length;
  if (verifiedCount === 0) return "Early-stage — no verified artifacts yet";
  const topSkill = [...c.verifiedSkills].sort((a, b) => b.confidence - a.confidence)[0];
  if (!topSkill) return `Building verified work — ${verifiedCount} artifact${verifiedCount === 1 ? "" : "s"} checked`;
  return verifiedCount >= 3
    ? `Trending toward ${c.field} — ${verifiedCount} verified artifacts, strongest in ${topSkill.name}`
    : `Growing ${topSkill.name} depth — ${verifiedCount} verified artifact${verifiedCount === 1 ? "" : "s"} so far`;
}

export const discoverCandidates: DiscoverCandidate[] = allCandidates.map((c) => ({
  ...c,
  trajectory: trajectoryFor(c),
}));

// ── E3 SimuHire Invite/Review + E6 Re-Engagement: pipeline stages ───────────────
export type PipelineStage = "invited" | "simuhire_done" | "shortlisted" | "re_engage";
export interface PipelineEntry {
  id: string;
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
}

// Picks a deterministic, varied slice of the real roster for this employer's pipeline —
// one candidate per stage type, chosen by real attributes (SimuHire completion, trust
// score) rather than 4 fixed ids that would break the moment the roster regenerates.
const demoJobs = allJobs.filter((j) => j.employerId === demoEmployer.id);
const withSimuHire = allCandidates.filter((c) => c.simuHire.completed);
const withoutSimuHire = allCandidates.filter((c) => !c.simuHire.completed && c.openToWork);
const shortlistCandidate = allCandidates.find((c) => c.trustScore >= 70 && !withSimuHire.includes(allCandidates[0]))
  ?? allCandidates[2];
const reEngageCandidate = allCandidates.find((c) => !c.openToWork) ?? allCandidates[3];

export const pipeline: PipelineEntry[] = [
  {
    id: "p1",
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
  },
  {
    id: "p2",
    candidateId: withoutSimuHire[0].id,
    name: withoutSimuHire[0].name,
    field: withoutSimuHire[0].field,
    trustScore: withoutSimuHire[0].trustScore,
    stage: "invited",
    detail: "SimuHire invite sent 2 days ago — awaiting completion",
  },
  {
    id: "p3",
    candidateId: shortlistCandidate.id,
    name: shortlistCandidate.name,
    field: shortlistCandidate.field,
    trustScore: shortlistCandidate.trustScore,
    stage: "shortlisted",
    detail: `Shortlisted for ${demoJobs[0]?.title ?? "an open role"} — verified ${shortlistCandidate.verifiedSkills[0]?.name ?? "skills"}`,
  },
  {
    id: "p4",
    candidateId: reEngageCandidate.id,
    name: reEngageCandidate.name,
    field: reEngageCandidate.field,
    trustScore: reEngageCandidate.trustScore,
    stage: "re_engage",
    detail: "Said no in March — timing may have changed, worth a light touch",
  },
];

export const STAGE_META: Record<PipelineStage, { label: string; color: string }> = {
  invited: { label: "Invited", color: "#D9A441" },
  simuhire_done: { label: "SimuHire done", color: "#1F7A5C" },
  shortlisted: { label: "Shortlisted", color: "#2F6E8F" },
  re_engage: { label: "Re-engage", color: "#6B7785" },
};

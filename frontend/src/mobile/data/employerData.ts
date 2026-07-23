// Rich mock data for the Employer side (E1–E8). Pure local demo data — no backend.
import type { Candidate } from "./types";
import { mockCandidates } from "./mockData";

export const employer = {
  name: "Amirul Hassan",
  company: "TechCorp Malaysia",
  industry: "Technology",
  size: "201–500",
  initial: "A",
};

// ── E8 Hire Intelligence + E5 Retention + E7 Onboarding: dashboard signals ──────
export interface DashboardStat {
  label: string;
  value: string;
  hint: string;
}
export const dashboardStats: DashboardStat[] = [
  { label: "Active roles", value: "4", hint: "2 verified-only" },
  { label: "In pipeline", value: "18", hint: "6 SimuHire done" },
  { label: "Hired (Q)", value: "5", hint: "all verified" },
];

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
// Reuse the shared mock candidates, add a "trajectory" line for E2 Smart Matching.
export interface DiscoverCandidate extends Candidate {
  trajectory: string; // E2: where they're heading, not just where they've been
}
export const discoverCandidates: DiscoverCandidate[] = mockCandidates.map((c, i) => ({
  ...c,
  trajectory:
    i === 0
      ? "Trending toward ML Engineering — 3 verified ML artifacts in 6 months"
      : i === 1
        ? "Growing frontend depth — React + TypeScript verified, adding Node.js"
        : "Early-stage — building first verified artifacts",
}));

// ── E3 SimuHire Invite/Review + E6 Re-Engagement: pipeline stages ───────────────
export type PipelineStage = "invited" | "simuhire_done" | "shortlisted" | "re_engage";
export interface PipelineEntry {
  id: string;
  candidateId: string; // links back to mockCandidates — same person as Discover/Partners
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

function candidateFor(id: string) {
  const c = mockCandidates.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown candidate id in pipeline: ${id}`);
  return c;
}

export const pipeline: PipelineEntry[] = [
  {
    id: "p1",
    candidateId: "ahmad-rahim",
    name: candidateFor("ahmad-rahim").name,
    field: candidateFor("ahmad-rahim").field,
    trustScore: candidateFor("ahmad-rahim").trustScore,
    stage: "simuhire_done",
    detail: "SimuHire Technical · 82/100 — report ready to review",
    simuHire: {
      type: "Technical",
      overallScore: 82,
      dimensions: { adaptability: 88, communication: 76, problemSolving: 85, stressResponse: 79, systemsThinking: 82 },
    },
  },
  {
    id: "p2",
    candidateId: "priya-nair",
    name: candidateFor("priya-nair").name,
    field: candidateFor("priya-nair").field,
    trustScore: candidateFor("priya-nair").trustScore,
    stage: "invited",
    detail: "SimuHire invite sent 2 days ago — awaiting completion",
  },
  {
    id: "p3",
    candidateId: "lim-wei",
    name: candidateFor("lim-wei").name,
    field: candidateFor("lim-wei").field,
    trustScore: candidateFor("lim-wei").trustScore,
    stage: "shortlisted",
    detail: "Shortlisted for Junior ML Engineer — verified Python/SQL",
  },
  {
    id: "p4",
    candidateId: "sara-yusof",
    name: candidateFor("sara-yusof").name,
    field: candidateFor("sara-yusof").field,
    trustScore: candidateFor("sara-yusof").trustScore,
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
  name: string;
  role: string;
  trustScoreAtHire: number;
  reviewScore: number; // 90-day review score
  hiredOn: string;
}
export const recentHires: HireRecord[] = [
  { id: "h1", name: "Ahmad Rahim", role: "ML Engineer", trustScoreAtHire: 87, reviewScore: 94, hiredOn: "Jun 2026" },
  { id: "h2", name: "Priya Nair", role: "Frontend Engineer", trustScoreAtHire: 79, reviewScore: 88, hiredOn: "May 2026" },
  { id: "h3", name: "Lim Wei Sheng", role: "Junior ML Engineer", trustScoreAtHire: 81, reviewScore: 85, hiredOn: "Apr 2026" },
];

export const hireIntelligence = {
  upliftPercent: 22, // verifiedAvg vs keywordAvg, latest quarter
  verifiedShareThisQuarter: 71, // % of this quarter's hires sourced via verified profile
  totalHiredThisQuarter: 7,
  performanceByQuarter,
  recentHires,
};

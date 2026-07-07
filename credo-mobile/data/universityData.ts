// Rich mock data for the University side (U1–U10). Pure local demo data — no backend.

export const university = {
  name: "Universiti Malaya",
  office: "Career Services",
  initial: "UM",
};

// ── U1 Campus Pulse: headline readiness ─────────────────────────────────────────
export const campusReadiness = {
  score: 74, // cohort readiness score
  trend: "+6 vs last semester",
  cohortSize: 1284,
};

// ── U4 Behavioral Benchmark: SimuHire dimensions aggregated ─────────────────────
export interface BenchmarkDimension {
  name: string;
  score: number;
}
export const behavioralBenchmark: BenchmarkDimension[] = [
  { name: "Adaptability", score: 78 },
  { name: "Communication", score: 71 },
  { name: "Problem-Solving", score: 82 },
  { name: "Stress Response", score: 69 },
  { name: "Systems Thinking", score: 75 },
];

// ── U2 Curriculum Gap Detector: skills failing verification ─────────────────────
export interface SkillGap {
  skill: string;
  taughtIn: string;
  verifyRate: number; // % of students whose claim in this skill actually verifies
}
export const skillGaps: SkillGap[] = [
  { skill: "Cloud Infrastructure", taughtIn: "CS3040 Distributed Systems", verifyRate: 34 },
  { skill: "Test-Driven Development", taughtIn: "SE2010 Software Practice", verifyRate: 41 },
  { skill: "Data Visualisation", taughtIn: "DS2200 Analytics", verifyRate: 58 },
];

// ── U3 Early Intervention Alert ─────────────────────────────────────────────────
export const interventionAlert = {
  cohort: "BSc Software Engineering · Year 3",
  message:
    "Readiness for this cohort has trended down 9 points over 8 weeks, driven by low verification rates in cloud and testing skills. Flagging now — 7 months before graduation — so curriculum can adjust.",
};

// ── U7 Adaptive Readiness + U5 Credential Issuer: per-programme cohorts ──────────
export interface Cohort {
  programme: string;
  year: string;
  readiness: number;
  students: number;
  verifiedPct: number; // % with at least one verified artifact
  issuerActive: boolean; // U5: uni issues credentials into the ledger for this programme
}
export const cohorts: Cohort[] = [
  { programme: "BSc Computer Science", year: "Year 4", readiness: 81, students: 312, verifiedPct: 88, issuerActive: true },
  { programme: "BSc Software Engineering", year: "Year 3", readiness: 68, students: 268, verifiedPct: 72, issuerActive: true },
  { programme: "BSc Data Science", year: "Year 3", readiness: 76, students: 194, verifiedPct: 79, issuerActive: false },
  { programme: "BSc Information Tech", year: "Year 2", readiness: 63, students: 240, verifiedPct: 55, issuerActive: false },
];

// ── U9 Outcome Loop + U10 Alumni Pulse: post-grad tracking ──────────────────────
export interface OutcomeStat {
  label: string;
  value: string;
  hint: string;
}
export const outcomeStats: OutcomeStat[] = [
  { label: "Placed in 6mo", value: "82%", hint: "of last cohort" },
  { label: "Field match", value: "74%", hint: "hired in-field" },
  { label: "Retention 1yr", value: "91%", hint: "still employed" },
];

export interface AlumniCheckin {
  window: string; // 6mo / 1yr / 3yr
  responded: number;
  note: string;
}
export const alumniCheckins: AlumniCheckin[] = [
  { window: "6 months", responded: 214, note: "82% placed, mostly in verified-skill roles" },
  { window: "1 year", responded: 189, note: "91% retention; salary tracking above benchmark" },
  { window: "3 years", responded: 96, note: "68% still in-field; 24% moved into leadership" },
];

// U8 Lifelong Learning Wallet — a small summary line
export const lifelongWallet = {
  activeAlumni: 1840,
  reVerifiedThisYear: 612,
};

// ── U6 Live Internship Marketplace: student → employer matches ──────────────────
export interface InternshipMatch {
  id: string;
  student: string;
  programme: string;
  trustScore: number;
  employer: string;
  role: string;
  matchPct: number;
}
export const internshipMatches: InternshipMatch[] = [
  { id: "m1", student: "Ahmad Farid", programme: "BSc Computer Science", trustScore: 87, employer: "TechCorp Malaysia", role: "ML Engineering Intern", matchPct: 92 },
  { id: "m2", student: "Priya Nair", programme: "BSc Software Engineering", trustScore: 71, employer: "Grab", role: "Frontend Intern", matchPct: 84 },
  { id: "m3", student: "Lim Wei", programme: "BSc Data Science", trustScore: 79, employer: "AirAsia", role: "Data Analyst Intern", matchPct: 88 },
];

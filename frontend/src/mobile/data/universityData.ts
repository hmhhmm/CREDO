// Rich mock data for the University side (U1–U10), now derived from the connected
// dataset in generateDataset.ts (60 employers, 120 candidates, 6 universities) instead
// of 4 hand-picked candidate ids and a single free-text employer name.
//
// Everything below is a function of *which* university is logged in (see
// UniversityAuthGate/resolveUniversityByEmail) rather than a fixed module-level export —
// so a real seeded login (e.g. a Taylor's University Career Services account) shows that
// university's own cohort, not always Universiti Malaya's.
import { allCandidates, allEmployers, allJobs, demoUniversity, universities, type University } from "./generateDataset";

export type { University };

export function resolveUniversityByEmail(email: string): University {
  const found = universities.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  return found ?? demoUniversity;
}

export function studentsOf(university: University) {
  return allCandidates.filter((c) => c.university === university.name);
}

// ── U1 Campus Pulse: headline readiness ─────────────────────────────────────────
export function getCampusReadiness(university: University) {
  const myStudents = studentsOf(university);
  const score = myStudents.length ? Math.round(myStudents.reduce((s, c) => s + c.trustScore, 0) / myStudents.length) : 0;
  return { score, trend: "+6 vs last semester", cohortSize: myStudents.length };
}

// ── U4 Behavioral Benchmark: SimuHire dimensions aggregated ─────────────────────
export interface BenchmarkDimension {
  name: string;
  score: number;
}
export function getBehavioralBenchmark(university: University): BenchmarkDimension[] {
  const simuHireStudents = studentsOf(university).filter((c) => c.simuHire.completed && c.simuHire.dimensions);
  const avg = (key: string) => {
    if (simuHireStudents.length === 0) return 0;
    const total = simuHireStudents.reduce((s, c) => s + (c.simuHire.dimensions?.[key] ?? 0), 0);
    return Math.round(total / simuHireStudents.length);
  };
  return [
    { name: "Adaptability", score: avg("adaptability") },
    { name: "Communication", score: avg("communication") },
    { name: "Problem-Solving", score: avg("problemSolving") },
    { name: "Stress Response", score: avg("stressResponse") },
    { name: "Systems Thinking", score: avg("systemsThinking") },
  ];
}

// ── U2 Curriculum Gap Detector: skills failing verification ─────────────────────
export interface SkillGap {
  skill: string;
  taughtIn: string;
  verifyRate: number; // % of students whose claim in this skill actually verifies
}
const GAP_COURSES: Record<string, string> = {
  "Cloud Infrastructure": "CS3040 Distributed Systems",
  "Test-Driven Development": "SE2010 Software Practice",
  "Data Visualisation": "DS2200 Analytics",
  Statistics: "DS2100 Applied Statistics",
  "System Design": "SE3050 Systems Architecture",
};
export function getSkillGaps(university: University): SkillGap[] {
  const myStudents = studentsOf(university);
  // A candidate "claims" a skill by listing it in claimedSkills OR verifiedSkills; the
  // gap is how often a claim on that skill actually lands as verified across this cohort.
  const verifyRateFor = (skill: string) => {
    const claimants = myStudents.filter((c) => c.claimedSkills.includes(skill) || c.verifiedSkills.some((v) => v.name === skill));
    if (claimants.length === 0) return 0;
    const verified = claimants.filter((c) => c.verifiedSkills.some((v) => v.name === skill)).length;
    return Math.round((verified / claimants.length) * 100);
  };
  return Object.entries(GAP_COURSES)
    .map(([skill, taughtIn]) => ({ skill, taughtIn, verifyRate: verifyRateFor(skill) }))
    .filter((g) => g.verifyRate > 0)
    .sort((a, b) => a.verifyRate - b.verifyRate)
    .slice(0, 3);
}

// ── U9 Outcome Loop (curriculum half): the action taken in response to each gap
// above — this is what makes the loop a loop, not just a stat that dead-ends.
export interface CurriculumAction {
  skill: string; // matches a SkillGap.skill
  action: string;
}
const ACTIONS: Record<string, string> = {
  "Cloud Infrastructure": "CS3040 added 2 additional hands-on lab sessions this semester",
  "Test-Driven Development": "SE2010 now requires a verified test-coverage artifact to pass",
  "Data Visualisation": "DS2200 partnered with a guest practitioner for a dashboarding workshop",
  Statistics: "DS2100 introduced a real-dataset capstone requirement",
  "System Design": "SE3050 added a peer-reviewed architecture proposal milestone",
};
export function getCurriculumActions(skillGaps: SkillGap[]): CurriculumAction[] {
  return skillGaps.map((g) => ({ skill: g.skill, action: ACTIONS[g.skill] })).filter((a): a is CurriculumAction => !!a.action);
}

// ── U7 Adaptive Readiness + U5 Credential Issuer: per-programme cohorts ──────────
export interface Cohort {
  programme: string;
  year: string;
  readiness: number;
  students: number;
  verifiedPct: number; // % with at least one verified artifact
  issuerActive: boolean; // U5: uni issues credentials into the ledger for this programme
}
export function getCohorts(university: University): Cohort[] {
  const myStudents = studentsOf(university);
  const fieldsHere = Array.from(new Set(myStudents.map((c) => c.field)));
  return fieldsHere.map((field, i) => {
    const students = myStudents.filter((c) => c.field === field);
    const readiness = Math.round(students.reduce((s, c) => s + c.trustScore, 0) / students.length);
    const verifiedPct = Math.round(
      (students.filter((c) => c.artifacts.some((a) => a.status === "verified")).length / students.length) * 100
    );
    return {
      programme: `BSc ${field}`,
      year: `Year ${(i % 4) + 1}`,
      readiness,
      students: students.length,
      verifiedPct,
      issuerActive: students.some((c) => c.artifacts.some((a) => a.type === "credential" && a.status === "verified")),
    };
  });
}

// ── U3 Early Intervention Alert: derived from cohorts + skillGaps above ─────────
// Fires only when a cohort's readiness actually drops below the threshold — not a
// permanently-shown static card — so the "early warning" claim is demonstrable.
const INTERVENTION_THRESHOLD = 70;

export interface InterventionAlert {
  cohort: string;
  message: string;
}

export function getInterventionAlert(cohorts: Cohort[], skillGaps: SkillGap[]): InterventionAlert | null {
  const atRisk = cohorts.filter((c) => c.readiness < INTERVENTION_THRESHOLD);
  if (atRisk.length === 0) return null;

  const worst = atRisk.reduce((a, b) => (b.readiness < a.readiness ? b : a));
  const lowestGaps = [...skillGaps].sort((a, b) => a.verifyRate - b.verifyRate).slice(0, 2);
  const skillNames = lowestGaps.map((g) => g.skill.toLowerCase()).join(" and ") || "several core skills";

  return {
    cohort: `${worst.programme} · ${worst.year}`,
    message: `Readiness for this cohort sits at ${worst.readiness}, driven by low verification rates in ${skillNames}. Flagging now so curriculum can adjust before graduation.`,
  };
}

// ── U9 Outcome Loop + U10 Alumni Pulse: post-grad tracking ──────────────────────
export interface OutcomeStat {
  label: string;
  value: string;
  hint: string;
}
export interface AlumniCheckin {
  window: string; // 6mo / 1yr / 3yr
  responded: number;
  note: string;
}
const GRAD_YEARS = new Set(["2024", "2025"]);
export function getOutcomeStats(university: University): OutcomeStat[] {
  const grads = studentsOf(university).filter((c) => GRAD_YEARS.has(c.year));
  const placedPct = grads.length ? Math.round((grads.filter((c) => !c.openToWork).length / grads.length) * 100) : 0;
  return [
    { label: "Placed in 6mo", value: `${placedPct}%`, hint: "of last cohort" },
    { label: "Field match", value: "74%", hint: "hired in-field" },
    { label: "Retention 1yr", value: "91%", hint: "still employed" },
  ];
}
export function getAlumniCheckins(university: University): AlumniCheckin[] {
  const grads = studentsOf(university).filter((c) => GRAD_YEARS.has(c.year));
  const placedPct = grads.length ? Math.round((grads.filter((c) => !c.openToWork).length / grads.length) * 100) : 0;
  return [
    { window: "6 months", responded: Math.max(1, Math.round(grads.length * 0.7)), note: `${placedPct}% placed, mostly in verified-skill roles` },
    { window: "1 year", responded: Math.max(1, Math.round(grads.length * 0.5)), note: "91% retention; salary tracking above benchmark" },
    { window: "3 years", responded: Math.max(1, Math.round(grads.length * 0.25)), note: "68% still in-field; 24% moved into leadership" },
  ];
}

// U8 Lifelong Learning Wallet — a small summary line
export function getLifelongWallet(university: University) {
  const count = studentsOf(university).length;
  return {
    activeAlumni: count * 15, // proxy for "all-time alumni", not just the live roster
    reVerifiedThisYear: Math.round(count * 5.1),
  };
}

// ── U6 Live Internship Marketplace: student → employer matches ──────────────────
export interface InternshipMatch {
  id: string;
  candidateId: string; // links back to allCandidates — same person as Discover/Pipeline
  student: string;
  programme: string;
  trustScore: number;
  employerId: string; // links back to allEmployers — a real employer, not a free-text name
  employer: string;
  role: string;
  matchPct: number;
}
// Matches this university's strongest open-to-work students against real open jobs whose
// field lines up — a genuine (if simplified) match, not 3 invented pairings.
export function getInternshipMatches(university: University): InternshipMatch[] {
  const openJobs = allJobs.filter((j) => j.status === "open");
  const candidatesForMatching = studentsOf(university)
    .filter((c) => c.openToWork && c.trustScore >= 50)
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 6);

  return candidatesForMatching.map((c, i) => {
    const job = openJobs.find((j) => j.title.toLowerCase().includes(c.field.split(" ")[0].toLowerCase())) ?? openJobs[i % openJobs.length];
    const employer = allEmployers.find((e) => e.id === job.employerId)!;
    return {
      id: `m${i + 1}`,
      candidateId: c.id,
      student: c.name,
      programme: `BSc ${c.field}`,
      trustScore: c.trustScore,
      employerId: employer.id,
      employer: employer.name,
      role: job.title,
      matchPct: Math.min(97, 70 + Math.round(c.trustScore * 0.3)),
    };
  });
}

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
// Average trust score across every candidate whose `university` field matches — no
// historical/time-series data exists in the dataset, so there's no real "vs last
// semester" figure to show (a prior version fabricated one; removed).
export function getCampusReadiness(university: University) {
  const myStudents = studentsOf(university);
  const score = myStudents.length ? Math.round(myStudents.reduce((s, c) => s + c.trustScore, 0) / myStudents.length) : 0;
  return { score, cohortSize: myStudents.length };
}

// ── U4 Behavioral Benchmark: SimuHire dimensions aggregated ─────────────────────
export interface BenchmarkDimension {
  name: string;
  score: number;
}
const DIMENSION_LABELS: Record<string, string> = {
  adaptability: "Adaptability",
  communication: "Communication",
  problemSolving: "Problem-Solving",
  stressResponse: "Stress Response",
  systemsThinking: "Systems Thinking",
};

export function getBehavioralBenchmark(university: University): BenchmarkDimension[] {
  const simuHireStudents = studentsOf(university).filter((c) => c.simuHire.completed && c.simuHire.dimensions);
  const avg = (key: string) => {
    if (simuHireStudents.length === 0) return 0;
    const total = simuHireStudents.reduce((s, c) => s + (c.simuHire.dimensions?.[key] ?? 0), 0);
    return Math.round(total / simuHireStudents.length);
  };
  return Object.entries(DIMENSION_LABELS).map(([key, name]) => ({ name, score: avg(key) }));
}

// U4 detail: which real students' completed SimuHire sessions feed a given dimension.
export function getBenchmarkDetail(university: University, dimensionName: string) {
  const contributors = studentsOf(university).filter((c) => c.simuHire.completed && c.simuHire.dimensions);
  const key = Object.entries(DIMENSION_LABELS).find(([, label]) => label === dimensionName)?.[0];
  const scored = key
    ? contributors
        .map((c) => ({ name: c.name, score: c.simuHire.dimensions?.[key] }))
        .filter((s): s is { name: string; score: number } => typeof s.score === "number")
    : [];
  const benchmark = getBehavioralBenchmark(university).find((d) => d.name === dimensionName) ?? null;
  return { dimensionName, benchmark, contributors: scored };
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

// Course code prefix -> field, so a skill gap can be traced back to the cohort it
// affects (course codes already encode this: CS3040, SE2010, DS2200, ...).
const COURSE_PREFIX_FIELD: Record<string, string> = {
  CS: "Computer Science",
  SE: "Software Engineering",
  DS: "Data Science",
};

export function getSkillGapDetail(university: University, skill: string) {
  const skillGaps = getSkillGaps(university);
  const gap = skillGaps.find((g) => g.skill === skill) ?? null;
  const action = getCurriculumActions(skillGaps).find((a) => a.skill === skill) ?? null;
  const prefix = gap?.taughtIn.match(/^([A-Z]+)/)?.[1];
  const field = prefix ? COURSE_PREFIX_FIELD[prefix] : undefined;
  const cohort = field ? getCohorts(university).find((c) => c.programme === `BSc ${field}`) ?? null : null;
  const affectedStudents = gap && cohort ? Math.round((cohort.students * (100 - gap.verifyRate)) / 100) : null;
  return { gap, action, cohort, affectedStudents };
}

// ── U7 Adaptive Readiness + U5 Credential Issuer: per-programme cohorts ──────────
export interface Cohort {
  programme: string;
  year: string;
  readiness: number;
  students: number;
  verifiedPct: number; // % with at least one verified artifact
  // U5: whether this programme HAS a verified credential artifact the university could
  // issue — a capability, not an action taken. Whether the university actually issued one
  // lives in CredentialIssuerContext (see getEligibleCredentials below), not here.
  eligibleForIssuance: boolean;
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
      eligibleForIssuance: students.some((c) => c.artifacts.some((a) => a.type === "credential" && a.status === "verified")),
    };
  });
}

// U5 detail: verified credential artifacts this programme's students hold, that the
// university COULD issue into the ledger — derived from the shared candidate roster.
// Whether any of these have actually been issued is tracked separately in
// CredentialIssuerContext, since that's a real user action, not derivable data.
export function getEligibleCredentials(university: University, programme: string) {
  const subject = programme.replace(/^BSc\s*/, "");
  return studentsOf(university)
    .filter((c) => c.field === subject)
    .flatMap((c) => c.artifacts.filter((a) => a.type === "credential").map((a) => ({ candidate: c.name, artifact: a })));
}

export function getCohortDetail(university: University, programme: string) {
  const cohort = getCohorts(university).find((c) => c.programme === programme) ?? null;
  const subject = programme.replace(/^BSc\s*/, "");
  const students = studentsOf(university).filter((c) => c.field === subject);
  const eligible = cohort?.eligibleForIssuance ? getEligibleCredentials(university, programme) : [];
  return { cohort, students, eligible };
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

  // Only cite skills actually taught within the flagged programme (matched via the same
  // course-code prefix used by getSkillGapDetail) — a prior version cited the
  // university's worst 2 skills overall, which could name skills unrelated to this
  // programme's own curriculum.
  const subject = worst.programme.replace(/^BSc\s*/, "");
  const relevantGaps = skillGaps.filter((g) => {
    const prefix = g.taughtIn.match(/^([A-Z]+)/)?.[1];
    return prefix ? COURSE_PREFIX_FIELD[prefix] === subject : false;
  });
  const lowestGaps = [...relevantGaps].sort((a, b) => a.verifyRate - b.verifyRate).slice(0, 2);
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

// U10 detail: illustrative anonymised follow-up signals per check-in window.
const ALUMNI_SIGNALS: Record<string, string[]> = {
  "6 months": [
    "Most placements landed within 2 verified-skill matches on Discover",
    "No reported gap between verified skills and day-one role expectations",
  ],
  "1 year": [
    "Salary tracking 8% above the field-match benchmark for verified hires",
    "Two re-verified a new certification within their first year",
  ],
  "3 years": [
    "24% moved into leadership — all had re-verified at least one new skill since graduating",
    "Remaining in-field alumni still show an active Lifelong Wallet",
  ],
};

export function getAlumniDetail(university: University, window: string) {
  const checkin = getAlumniCheckins(university).find((a) => a.window === window) ?? null;
  const signals = ALUMNI_SIGNALS[window] ?? [];
  return { checkin, signals };
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

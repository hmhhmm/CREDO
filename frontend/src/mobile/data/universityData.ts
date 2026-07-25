// Rich mock data for the University side (U1–U10), now derived from the connected
// dataset in generateDataset.ts (60 employers, 120 candidates, 6 universities) instead
// of 4 hand-picked candidate ids and a single free-text employer name.
//
// Everything below is a function of *which* university is logged in (see
// UniversityAuthGate/resolveUniversityByEmail) rather than a fixed module-level export —
// so a real seeded login (e.g. a Taylor's University Career Services account) shows that
// university's own cohort, not always Universiti Malaya's.
import { allCandidates, allEmployers, allJobs, demoUniversity, universities, JOB_TITLES_BY_FIELD, type University } from "./generateDataset";
import type { PipelineEntry } from "./employerData";

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
// Bridge C, the direction the charter names explicitly: "employers can publish anonymised
// skill-demand signals back to Curriculum Gap Detector (U2)." The candidate skill set U2
// checks is no longer a hand-picked 5-skill list — it's real `requiredSkills` aggregated
// from every open job posting across this university's own fields (allJobs, the same
// listings Job Matches/Discover/Career Path all read), ranked by how often employers are
// actually asking for each one right now.
export interface SkillGap {
  skill: string;
  taughtIn: string;
  verifyRate: number; // % of students whose claim in this skill actually verifies
  demandCount: number; // real open listings in this university's fields requiring this skill
}
// Exported for GrowScreen's Targeted Upskilling — the same skill->course map U2's
// Curriculum Gap Detector already uses on the university side, so a candidate-facing
// "take this course" suggestion points at a real, specific course code, not an invented one.
export const GAP_COURSES: Record<string, string> = {
  "Cloud Infrastructure": "CS3040 Distributed Systems",
  "Test-Driven Development": "SE2010 Software Practice",
  "Data Visualisation": "DS2200 Analytics",
  Statistics: "DS2100 Applied Statistics",
  "System Design": "SE3050 Systems Architecture",
};

// Course-catalog detail for the same codes above — description/credits/format, the way a
// real university course listing reads. Kept as a separate map (not merged into
// GAP_COURSES) so U2's Curriculum Gap Detector on the university side, which only ever
// needs the bare code, is untouched by this candidate-facing content.
export interface GapCourseDetail {
  credits: number;
  format: string;
  description: string;
  topics: string[];
}
export const GAP_COURSE_DETAILS: Record<string, GapCourseDetail> = {
  "CS3040 Distributed Systems": {
    credits: 4,
    format: "Semester-long, lecture + lab",
    description:
      "Covers the principles behind systems that run across many machines: consistency models, replication, consensus (Raft/Paxos), and fault tolerance. Labs build a small distributed key-value store from scratch.",
    topics: ["Consensus algorithms", "Replication", "CAP theorem", "Distributed storage", "Fault tolerance"],
  },
  "SE2010 Software Practice": {
    credits: 3,
    format: "Semester-long, project-based",
    description:
      "A hands-on course in professional software engineering practice: test-driven development, code review, CI pipelines, and refactoring — taught through building and iterating on a real team project.",
    topics: ["Unit testing", "TDD workflow", "Code review", "CI/CD", "Refactoring"],
  },
  "DS2200 Analytics": {
    credits: 3,
    format: "Semester-long, lab-heavy",
    description:
      "Teaches how to turn raw data into a clear visual story: chart selection, dashboard design, and the common ways visualizations mislead. Final project builds a dashboard from a real dataset.",
    topics: ["Chart selection", "Dashboard design", "Tableau", "Data storytelling"],
  },
  "DS2100 Applied Statistics": {
    credits: 4,
    format: "Semester-long, lecture + tutorial",
    description:
      "Core statistical inference for data-driven decisions: probability distributions, hypothesis testing, regression, and confidence intervals, applied throughout to real datasets rather than toy examples.",
    topics: ["Hypothesis testing", "Regression", "Probability distributions", "Confidence intervals"],
  },
  "SE3050 Systems Architecture": {
    credits: 4,
    format: "Semester-long, lecture + design studio",
    description:
      "How to design software systems that scale: architectural patterns, trade-off analysis, scalability, and reliability engineering, worked through real system-design case studies.",
    topics: ["Architectural patterns", "Scalability", "Trade-off analysis", "Reliability engineering"],
  },
};
// Real employer demand for a skill, restricted to this university's own fields (job title
// resolved to a field via JOB_TITLES_BY_FIELD, the same reverse-lookup Career Path
// Navigator uses) — a count of currently-open listings asking for it, not an invented figure.
function skillDemandInFields(fields: string[]): Map<string, number> {
  const fieldTitles = new Set(fields.flatMap((f) => JOB_TITLES_BY_FIELD[f] ?? []));
  const demand = new Map<string, number>();
  for (const job of allJobs) {
    if (job.status !== "open" || !fieldTitles.has(job.title)) continue;
    for (const rs of job.requiredSkills) demand.set(rs.name, (demand.get(rs.name) ?? 0) + 1);
  }
  return demand;
}

export function getSkillGaps(university: University): SkillGap[] {
  const myStudents = studentsOf(university);
  const fieldsHere = Array.from(new Set(myStudents.map((c) => c.field)));
  const demand = skillDemandInFields(fieldsHere);

  // A candidate "claims" a skill by listing it in claimedSkills OR verifiedSkills; the
  // gap is how often a claim on that skill actually lands as verified across this cohort.
  const verifyRateFor = (skill: string) => {
    const claimants = myStudents.filter((c) => c.claimedSkills.includes(skill) || c.verifiedSkills.some((v) => v.name === skill));
    if (claimants.length === 0) return 0;
    const verified = claimants.filter((c) => c.verifiedSkills.some((v) => v.name === skill)).length;
    return Math.round((verified / claimants.length) * 100);
  };

  return Array.from(demand.entries())
    .map(([skill, demandCount]) => ({
      skill,
      taughtIn: GAP_COURSES[skill] ?? "Not yet mapped to a course",
      verifyRate: verifyRateFor(skill),
      demandCount,
    }))
    .filter((g) => g.demandCount > 0)
    // Skills employers actually want, ranked by how poorly this cohort currently verifies
    // them, ties broken by real demand — the two axes the charter's Bridge C is about.
    .sort((a, b) => a.verifyRate - b.verifyRate || b.demandCount - a.demandCount)
    .slice(0, 5);
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

// ── ASKC pillar breakdown, cohort-level ─────────────────────────────────────────
// Same real signals candidate-facing HomeScreen's askcBreakdown.ts derives per-person
// (SimuHire overall score for Attitude, verified GitHub-artifact confidence for Skills,
// verified credential+document confidence for Knowledge), averaged here across a cohort
// instead of one candidate — not a separately invented cohort-level figure. A pillar with
// no verified signal anywhere in the cohort reads as null ("—"), never a fabricated 0.
export interface AskcCohortBreakdown {
  attitude: number | null;
  skills: number | null;
  knowledge: number | null;
}
function avgOrNull(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null;
}
export function getAskcBreakdown(students: ReturnType<typeof studentsOf>): AskcCohortBreakdown {
  const attitude = avgOrNull(
    students.filter((c) => c.simuHire.completed && c.simuHire.overallScore != null).map((c) => c.simuHire.overallScore!)
  );
  const skillConfidences = students.flatMap((c) =>
    c.artifacts.filter((a) => a.type === "github" && a.status === "verified").map((a) => a.confidence)
  );
  const knowledgeConfidences = students.flatMap((c) =>
    c.artifacts.filter((a) => (a.type === "credential" || a.type === "document") && a.status === "verified").map((a) => a.confidence)
  );
  return {
    attitude,
    skills: avgOrNull(skillConfidences),
    knowledge: avgOrNull(knowledgeConfidences),
  };
}

// ── U7 Adaptive Readiness + U5 Credential Issuer: per-programme cohorts ──────────
export interface Cohort {
  programme: string;
  year: string;
  readiness: number;
  students: number;
  verifiedPct: number; // % with at least one verified artifact
  askc: AskcCohortBreakdown;
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
      askc: getAskcBreakdown(students),
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
    .flatMap((c) =>
      c.artifacts.filter((a) => a.type === "credential").map((a) => ({ candidateId: c.id, candidate: c.name, artifact: a }))
    );
}

// U5 — every eligible credential across every programme at this university, regardless of
// field. Used by Partners' co-sign badge (any candidate, not just one programme's roster)
// and by the Cohorts header's batch-issue action.
export function getAllEligibleCredentials(university: University) {
  return studentsOf(university).flatMap((c) =>
    c.artifacts.filter((a) => a.type === "credential" && a.status === "verified").map((a) => ({ candidateId: c.id, candidate: c.name, artifact: a }))
  );
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
// Bridge C, the direction the charter names explicitly: "hire outcomes... flow to Outcome
// Loop Tracker (U9)." `hires` is every accepted PipelineEntry across every employer
// (PipelineContext.allAcceptedHires()) — the exact same events Employer's own Hire
// Intelligence screen reads — joined back to this university's own students via
// candidateId. A student who hasn't been hired anywhere yet in this session correctly
// shows as not-yet-placed; there is no synthesized retention/field-match figure standing
// in for data this dataset doesn't actually have.
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

function hiredGrads(university: University, hires: PipelineEntry[]) {
  const grads = studentsOf(university).filter((c) => GRAD_YEARS.has(c.year));
  const hiredIds = new Set(hires.map((h) => h.candidateId));
  return { grads, hired: grads.filter((c) => hiredIds.has(c.id)) };
}

export function getOutcomeStats(university: University, hires: PipelineEntry[]): OutcomeStat[] {
  const { grads, hired } = hiredGrads(university, hires);
  const placedPct = grads.length ? Math.round((hired.length / grads.length) * 100) : 0;
  const avgTrustAtHire = hired.length
    ? Math.round(hires.filter((h) => hired.some((c) => c.id === h.candidateId)).reduce((s, h) => s + h.trustScore, 0) / hired.length)
    : 0;
  return [
    { label: "Placed", value: `${placedPct}%`, hint: `${hired.length} of ${grads.length} grads` },
    { label: "Avg Trust at hire", value: hired.length ? String(avgTrustAtHire) : "—", hint: "real accepted offers" },
    { label: "Total hires", value: String(hired.length), hint: "across all employers" },
  ];
}

export function getAlumniCheckins(university: University, hires: PipelineEntry[]): AlumniCheckin[] {
  const { grads, hired } = hiredGrads(university, hires);
  const placedPct = grads.length ? Math.round((hired.length / grads.length) * 100) : 0;
  return [
    {
      window: "Placements",
      responded: hired.length,
      note: hired.length
        ? `${placedPct}% of ${grads.length} grads placed — ${hired.map((c) => c.name).slice(0, 3).join(", ")}${hired.length > 3 ? ", …" : ""}`
        : "No accepted offers yet for this cohort.",
    },
  ];
}

export interface MajorHireBreakdown {
  major: string;
  hires: { name: string; employer: string; trustScore: number; hiredOn: string | null }[];
}
// Real per-hire detail grouped by major/field — what the "expand for a breakdown by major"
// ask actually has real data for. No salary or retention figures: PipelineEntry has no
// jobId to join back to a real Job.salaryMin/salaryMax, and there is no tenure/retention
// tracking anywhere in this dataset, so neither is fabricated here.
export function getHiresByMajor(university: University, hires: PipelineEntry[]): MajorHireBreakdown[] {
  const { hired } = hiredGrads(university, hires);
  const hiredIds = new Set(hired.map((c) => c.id));
  const byMajor = new Map<string, MajorHireBreakdown["hires"]>();
  for (const h of hires) {
    if (!hiredIds.has(h.candidateId)) continue;
    const employer = allEmployers.find((e) => e.id === h.employerId);
    const list = byMajor.get(h.field) ?? [];
    list.push({
      name: h.name,
      employer: employer?.name ?? "an employer",
      trustScore: h.trustScore,
      hiredOn: h.decisionAt ? new Date(h.decisionAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null,
    });
    byMajor.set(h.field, list);
  }
  return Array.from(byMajor.entries())
    .map(([major, hiresList]) => ({ major, hires: hiresList }))
    .sort((a, b) => b.hires.length - a.hires.length);
}

// U10 detail: the real accepted-hire records behind a check-in window, not illustrative
// copy — each line names the actual employer and role from the real PipelineEntry.
export function getAlumniDetail(university: University, window: string, hires: PipelineEntry[]) {
  const checkin = getAlumniCheckins(university, hires).find((a) => a.window === window) ?? null;
  const { hired } = hiredGrads(university, hires);
  const hiredIds = new Set(hired.map((c) => c.id));
  const signals = hires
    .filter((h) => hiredIds.has(h.candidateId))
    .map((h) => {
      const employer = allEmployers.find((e) => e.id === h.employerId);
      return `${h.name} — hired by ${employer?.name ?? "an employer"}${h.decisionAt ? ` (${new Date(h.decisionAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })})` : ""}`;
    });
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
  // Real intersection between this specific job's requiredSkills and the candidate's own
  // verifiedSkills — the actual skills driving this match, not a generic "strong candidate"
  // claim. Claimed-but-not-verified overlaps are tracked separately since they're a weaker
  // signal and shouldn't read the same as a verified one.
  matchedVerifiedSkills: string[];
  matchedClaimedSkills: string[];
}
function matchedSkillsFor(candidate: ReturnType<typeof studentsOf>[number], job: (typeof allJobs)[number]) {
  const required = job.requiredSkills.map((s) => s.name);
  const verifiedNames = new Set(candidate.verifiedSkills.filter((s) => s.verified).map((s) => s.name.toLowerCase()));
  const claimedNames = new Set(candidate.claimedSkills.map((s) => s.toLowerCase()));
  const matchedVerifiedSkills = required.filter((s) => verifiedNames.has(s.toLowerCase()));
  const matchedVerifiedLower = new Set(matchedVerifiedSkills.map((s) => s.toLowerCase()));
  const matchedClaimedSkills = required.filter((s) => claimedNames.has(s.toLowerCase()) && !matchedVerifiedLower.has(s.toLowerCase()));
  return { matchedVerifiedSkills, matchedClaimedSkills };
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
    const { matchedVerifiedSkills, matchedClaimedSkills } = matchedSkillsFor(c, job);
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
      matchedVerifiedSkills,
      matchedClaimedSkills,
    };
  });
}

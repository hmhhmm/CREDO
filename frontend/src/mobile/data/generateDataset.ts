// Generates the full connected mock dataset: universities, employers, candidates, jobs,
// and the cross-role links between them (pipeline, discover trajectories, internship
// matches, issued credentials) — one graph instead of the hand-written, disconnected
// snippets mockData.ts/employerData.ts/universityData.ts/mockApi.ts used to each carry.
//
// Deterministic: a seeded PRNG (mulberry32) means the roster is stable across reloads —
// every screen sees the same 120 candidates on every run, which matters for a demo where
// screenshots/cross-references need to line up (e.g. Partners "introduce" landing in the
// same Pipeline entry every time).
import type { Artifact, ArtifactStatus, ArtifactType, Candidate, JobListing, LedgerEntry, VerifiedSkill } from "./types";

// ── PRNG ─────────────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260723);
const rand = () => rng();
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];
const pickN = <T>(arr: readonly T[], n: number): T[] => {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    out.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
  }
  return out;
};
function weighted<T>(weights: [T, number][]): T {
  // [value, weight] pairs — returns a value chosen proportionally to weight.
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of weights) {
    if (r < w) return v;
    r -= w;
  }
  return weights[weights.length - 1][0];
}
const hex = (n: number) => {
  let s = "";
  for (let i = 0; i < n; i++) s += "0123456789abcdef"[randInt(0, 15)];
  return s;
};
const dateWithin = (daysAgoMax: number, daysAgoMin = 0) => {
  const now = new Date("2026-07-23T00:00:00Z").getTime();
  const days = randInt(daysAgoMin, daysAgoMax);
  return new Date(now - days * 86400000).toISOString();
};
const dateOnly = (iso: string) => iso.slice(0, 10);

// ── Reference lists ─────────────────────────────────────────────────────────────
const UNIVERSITIES = [
  { name: "Universiti Malaya", short: "UM", city: "Kuala Lumpur" },
  { name: "Universiti Teknologi Malaysia", short: "UTM", city: "Johor Bahru" },
  { name: "Universiti Putra Malaysia", short: "UPM", city: "Serdang" },
  { name: "Taylor's University", short: "Taylor's", city: "Subang Jaya" },
  { name: "Sunway University", short: "Sunway", city: "Bandar Sunway" },
  { name: "Multimedia University", short: "MMU", city: "Cyberjaya" },
] as const;

const FIELDS = [
  "Computer Science",
  "Software Engineering",
  "Data Science",
  "Information Technology",
  "Product Design",
  "Business Administration",
  "Finance",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Biomedical Science",
] as const;

const SKILLS_BY_FIELD: Record<string, string[]> = {
  "Computer Science": ["Python", "Machine Learning", "SQL", "Docker", "Kubernetes", "Go", "Java", "Algorithms"],
  "Software Engineering": ["React", "Node.js", "TypeScript", "GraphQL", "AWS", "CI/CD", "System Design"],
  "Data Science": ["Python", "SQL", "Tableau", "Spark", "Statistics", "R", "Pandas"],
  "Information Technology": ["Networking", "Linux", "SQL", "Cloud Infrastructure", "Cybersecurity"],
  "Product Design": ["Figma", "User Research", "Design Systems", "Prototyping", "UX Writing"],
  "Business Administration": ["Excel", "PowerPoint", "Financial Modelling", "Market Research", "Canva"],
  Finance: ["Financial Modelling", "Excel", "Valuation", "Bloomberg Terminal", "Accounting"],
  "Electrical Engineering": ["Circuit Design", "MATLAB", "Embedded Systems", "PCB Design", "Signal Processing"],
  "Mechanical Engineering": ["CAD", "SolidWorks", "Thermodynamics", "Finite Element Analysis"],
  "Biomedical Science": ["Lab Techniques", "Data Analysis", "Clinical Research", "Biostatistics"],
};

const FIRST_NAMES = [
  "Ahmad", "Aisyah", "Amirul", "Aina", "Danish", "Farah", "Hafiz", "Iman", "Khalid", "Liyana",
  "Mohd", "Nurul", "Rafiq", "Siti", "Syafiq", "Wei", "Priya", "Kavitha", "Arjun", "Wei Ling",
  "Chen", "Ming", "Hui", "Zul", "Azlan", "Fatimah", "Haziq", "Nabila", "Faris", "Zara",
  "Lim", "Tan", "Chong", "Suresh", "Divya", "Ravi", "Meera", "Yusof", "Aiman", "Sofia",
] as const;
const LAST_NAMES = [
  "Rahim", "Hassan", "Ismail", "Yusof", "Abdullah", "Bakar", "Karim", "Osman", "Salleh", "Aziz",
  "Chen", "Lim", "Tan", "Wong", "Ng", "Lee", "Ong", "Nair", "Kumar", "Singh",
  "Ramasamy", "Krishnan", "Devi", "Sharma", "Zulkifli", "Mansor", "Rashid", "Halim", "Latif", "Kamal",
] as const;
const usedNames = new Set<string>();
function generateName(): string {
  let name = "";
  for (let attempt = 0; attempt < 30; attempt++) {
    name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    if (!usedNames.has(name)) break;
  }
  usedNames.add(name);
  return name;
}
function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// firstname.lastname@gmail.com, shared password "demo" for every seeded account (dev
// phase only — see mockApi.ts's login(), which still accepts anything so the login
// screen itself never blocks; only a recognized email routes to that person's real data).
function emailFromName(name: string) {
  return `${name.toLowerCase().replace(/[^a-z\s]+/g, "").trim().replace(/\s+/g, ".")}@gmail.com`;
}
export const DEMO_PASSWORD = "demo";

const CITIES = ["Kuala Lumpur", "Petaling Jaya", "Johor Bahru", "Penang", "Cyberjaya", "Subang Jaya", "Shah Alam", "Ipoh"];

const INDUSTRIES = [
  "Technology", "Fintech", "E-commerce", "Healthcare", "Logistics", "Manufacturing",
  "Telecommunications", "Media & Entertainment", "Education", "Energy", "Retail", "Consulting",
] as const;

const COMPANY_PREFIXES = [
  "Tech", "Data", "Cloud", "Byte", "Nova", "Prime", "Apex", "Vertex", "Nexus", "Quantum",
  "Bright", "Swift", "Core", "Pulse", "Orbit", "Meridian", "Summit", "Forge", "Zenith", "Atlas",
];
const COMPANY_SUFFIXES = ["Corp", "Labs", "Works", "Systems", "Solutions", "Group", "Technologies", "Ventures", "Digital", "Malaysia"];
const usedCompanyNames = new Set<string>();
function generateCompanyName(): string {
  let name = "";
  for (let attempt = 0; attempt < 30; attempt++) {
    name = `${pick(COMPANY_PREFIXES)}${pick(COMPANY_SUFFIXES)}`;
    if (!usedCompanyNames.has(name)) break;
  }
  usedCompanyNames.add(name);
  return name;
}

const COMPANY_SIZES = ["11–50", "51–200", "201–500", "501–1000", "1000+"] as const;

const JOB_TITLES_BY_FIELD: Record<string, string[]> = {
  "Computer Science": ["Junior ML Engineer", "Software Engineer", "Backend Engineer", "AI Engineer"],
  "Software Engineering": ["Frontend Engineer", "Full-Stack Engineer", "Software Engineer II", "DevOps Engineer"],
  "Data Science": ["Data Analyst", "Data Scientist", "Analytics Engineer", "BI Analyst"],
  "Information Technology": ["IT Support Engineer", "Systems Administrator", "Cloud Engineer", "Network Engineer"],
  "Product Design": ["Product Designer", "UX Designer", "UI/UX Intern", "Design Systems Engineer"],
  "Business Administration": ["Business Analyst", "Operations Associate", "Strategy Intern", "Marketing Executive"],
  Finance: ["Financial Analyst", "Investment Analyst Intern", "Finance Associate"],
  "Electrical Engineering": ["Hardware Engineer", "Embedded Systems Engineer", "Electrical Design Engineer"],
  "Mechanical Engineering": ["Mechanical Design Engineer", "Manufacturing Engineer", "R&D Engineer"],
  "Biomedical Science": ["Research Associate", "Lab Technician", "Clinical Data Analyst"],
};

const CREDENTIAL_ISSUERS = ["Amazon Web Services", "Google", "Meta", "Microsoft", "IBM", "Coursera", "HackerRank"];
const CREDENTIAL_NAMES = [
  "AWS Certified Developer – Associate",
  "Google Data Analytics Certificate",
  "Meta Frontend Developer Certificate",
  "Microsoft Azure Fundamentals",
  "IBM Data Science Professional Certificate",
  "Google UX Design Certificate",
  "HackerRank Problem Solving (Advanced)",
];

// ── Universities ─────────────────────────────────────────────────────────────────
export interface University {
  id: string;
  name: string;
  short: string;
  city: string;
  office: string;
  email: string; // Career Services' login — see emailFromName
}

export const universities: University[] = UNIVERSITIES.map((u) => ({
  id: slugify(u.name),
  name: u.name,
  short: u.short,
  city: u.city,
  office: "Career Services",
  email: emailFromName(`${u.short} Career Services`),
}));

// ── Employers ────────────────────────────────────────────────────────────────────
export interface Employer {
  id: string;
  name: string; // company name
  contactName: string; // the logged-in person
  email: string; // the logged-in person's login — see emailFromName
  industry: (typeof INDUSTRIES)[number];
  size: (typeof COMPANY_SIZES)[number];
  city: string;
  initial: string;
}

export const employers: Employer[] = Array.from({ length: 60 }, () => {
  const name = generateCompanyName();
  const contactName = generateName();
  return {
    id: slugify(name),
    name,
    contactName,
    email: emailFromName(contactName),
    industry: pick(INDUSTRIES),
    size: pick(COMPANY_SIZES),
    city: pick(CITIES),
    initial: contactName[0],
  };
});

// ── Jobs ─────────────────────────────────────────────────────────────────────────
export interface Job extends JobListing {
  employerId: string;
}

function generateJob(employer: Employer): Job {
  const field = pick(FIELDS);
  const title = pick(JOB_TITLES_BY_FIELD[field] ?? JOB_TITLES_BY_FIELD["Computer Science"]);
  const type = weighted([
    ["full-time", 6],
    ["internship", 3],
    ["contract", 1],
  ]) as JobListing["employmentType"];
  const skillPool = SKILLS_BY_FIELD[field] ?? SKILLS_BY_FIELD["Computer Science"];
  const requiredSkills = pickN(skillPool, randInt(2, 4)).map((name) => ({ name, verifiedOnly: rand() > 0.35 }));
  const isIntern = type === "internship";
  const salaryMin = isIntern ? randInt(800, 1800) : randInt(3200, 6000);
  const salaryMax = salaryMin + randInt(800, 2500);
  return {
    id: `job-${employer.id}-${randInt(1000, 9999)}`,
    employerId: employer.id,
    title,
    location: rand() > 0.75 ? "Remote" : employer.city,
    employmentType: type,
    salaryMin,
    salaryMax,
    description: `Join ${employer.name}'s ${field.toLowerCase()} team as a ${title.toLowerCase()}. ${
      isIntern ? "A hands-on internship" : "A full-time role"
    } working alongside senior engineers on real production work.`,
    requiredSkills,
    status: rand() > 0.2 ? "open" : "closed",
    createdAt: dateWithin(90, 1),
  };
}

export const jobs: Job[] = employers.flatMap((e) => Array.from({ length: randInt(1, 4) }, () => generateJob(e)));

// ── Candidates ───────────────────────────────────────────────────────────────────
function generateArtifact(field: string, index: number, candidateSlug: string): Artifact {
  const type: ArtifactType = weighted([
    ["github", 5],
    ["credential", 4],
    ["document", 2],
  ]) as ArtifactType;
  const confidence = randInt(55, 97);
  const status: ArtifactStatus = confidence >= 60 ? "verified" : weighted([
    ["verified", 1],
    ["pending", 2],
    ["failed", 1],
  ]) as ArtifactStatus;

  if (type === "github") {
    const repoWords = ["pipeline", "portfolio", "app", "toolkit", "dashboard", "api", "engine", "analyzer"];
    return {
      id: `${candidateSlug}-art-${index}`,
      type,
      name: `${candidateSlug}/${pick(repoWords)}-${pick(["v2", "core", "ml", "web", "data"])}`,
      confidence,
      status,
      date: dateOnly(dateWithin(400, 10)),
      metadata: { commits: randInt(8, 90), complexity: pick(["Low", "Medium", "High"]), flags: rand() > 0.9 ? 1 : 0 },
    };
  }
  if (type === "credential") {
    return {
      id: `${candidateSlug}-art-${index}`,
      type,
      name: pick(CREDENTIAL_NAMES),
      confidence,
      status,
      date: dateOnly(dateWithin(500, 10)),
      metadata: { issuer: pick(CREDENTIAL_ISSUERS), nameMatch: rand() > 0.05 },
    };
  }
  return {
    id: `${candidateSlug}-art-${index}`,
    type,
    name: pick([`${field} Research Paper`, "Final Year Project Report", "Capstone Thesis", "Internship Report"]),
    confidence,
    status,
    date: dateOnly(dateWithin(300, 5)),
    metadata: { aiProbability: randInt(2, 25), writingComplexity: randInt(50, 95) },
  };
}

function buildLedger(artifacts: Artifact[]): { ledger: LedgerEntry[]; merkleRoot: string | null } {
  const verified = artifacts.filter((a) => a.status === "verified").sort((a, b) => a.date.localeCompare(b.date));
  if (verified.length === 0) return { ledger: [], merkleRoot: null };
  let prevHash = "0".repeat(15) + "...";
  const ledger: LedgerEntry[] = verified.map((a, i) => {
    const leafHash = hex(13) + "...";
    const entry: LedgerEntry = { blockIndex: i, leafHash, prevHash, timestamp: `${a.date}T${String(randInt(8, 18)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}:00Z` };
    prevHash = leafHash;
    return entry;
  });
  return { ledger, merkleRoot: hex(32) };
}

function trustScoreFromArtifacts(artifacts: Artifact[]): number {
  const verified = artifacts.filter((a) => a.status === "verified");
  if (verified.length === 0) return 0;
  const avgConfidence = verified.reduce((s, a) => s + a.confidence, 0) / verified.length;
  // Consistency bonus: more verified artifacts, spanning more time, nudges the score up —
  // mirrors the real trust-score model's "Consistency" pillar rather than being a flat average.
  const volumeBonus = Math.min(10, verified.length * 2);
  return Math.round(Math.min(98, avgConfidence * 0.85 + volumeBonus));
}

function generateCandidate(index: number): Candidate {
  const name = generateName();
  const slug = slugify(name) + "-" + index;
  const field = pick(FIELDS);
  const university = pick(universities);
  const year = pick(["2024", "2025", "2026", "2027"]);
  const skillPool = SKILLS_BY_FIELD[field] ?? SKILLS_BY_FIELD["Computer Science"];

  const artifactCount = weighted([
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 3],
    [4, 1],
  ]) as number;
  const artifacts = Array.from({ length: artifactCount }, (_, i) => generateArtifact(field, i, slug));
  const trustScore = trustScoreFromArtifacts(artifacts);

  const verifiedSkillNames = pickN(skillPool, Math.min(skillPool.length, artifactCount + randInt(0, 2)));
  const verifiedSkills: VerifiedSkill[] = verifiedSkillNames.map((s) => ({
    name: s,
    confidence: randInt(60, 96),
    verified: true,
  }));
  const claimedSkills = pickN(
    skillPool.filter((s) => !verifiedSkillNames.includes(s)),
    randInt(0, 3)
  );

  const simuHireCompleted = rand() > 0.55;
  const dims = { adaptability: randInt(55, 95), communication: randInt(55, 95), problemSolving: randInt(55, 95), stressResponse: randInt(50, 92), systemsThinking: randInt(55, 95) };
  const overallScore = Math.round(Object.values(dims).reduce((a, b) => a + b, 0) / 5);

  const { ledger, merkleRoot } = buildLedger(artifacts);

  return {
    id: slug,
    name,
    email: emailFromName(name),
    field,
    university: university.name,
    year,
    location: pick(CITIES),
    openToWork: rand() > 0.3,
    avatar: null,
    bio: `${year === "2026" || year === "2027" ? "Upcoming" : "Final-year"} ${field} student at ${university.short}. ${
      artifacts.length > 0 ? `Building real ${field.toLowerCase()} work, verified end to end.` : "Just getting started on CREDO."
    }`,
    linkedinUrl: `https://linkedin.com/in/${slugify(name)}`,
    githubUrl: rand() > 0.15 ? `https://github.com/${slugify(name)}` : null,
    trustScore,
    verifiedSkills,
    claimedSkills,
    simuHire: simuHireCompleted
      ? { completed: true, shared: rand() > 0.3, type: pick(["Technical", "Business", "General"]), overallScore, dimensions: dims }
      : { completed: false, shared: false },
    artifacts,
    ledger,
    merkleRoot,
  };
}

export const candidates: Candidate[] = Array.from({ length: 120 }, (_, i) => generateCandidate(i));

// The seeded/demo candidate every Candidate-side screen shows when "logged in" — kept as
// a stable, richly-verified profile (not a random pick) so the demo always has a strong
// example to show, same role mockData.ts's mockCandidates[0] used to play.
export const demoCandidate: Candidate = {
  ...candidates[0],
  id: "demo-candidate",
  name: "Ahmad Farid",
  email: "ahmad.farid@gmail.com",
  field: "Computer Science",
  university: universities[0].name,
  year: "2025",
  location: "Kuala Lumpur",
  openToWork: true,
  bio: "Final-year CS student specialising in ML and distributed systems. Built and deployed 3 production systems.",
  linkedinUrl: "https://linkedin.com/in/ahmadfarid",
  githubUrl: "https://github.com/ahmad-farid",
  trustScore: 87,
  verifiedSkills: [
    { name: "Python", confidence: 94, verified: true },
    { name: "Machine Learning", confidence: 88, verified: true },
    { name: "SQL", confidence: 79, verified: true },
    { name: "Docker", confidence: 71, verified: true },
  ],
  claimedSkills: ["Kubernetes", "Go"],
  simuHire: {
    completed: true,
    shared: true,
    type: "Technical",
    overallScore: 82,
    dimensions: { adaptability: 88, communication: 76, problemSolving: 85, stressResponse: 79, systemsThinking: 82 },
  },
  artifacts: [
    { id: "demo-art-1", type: "github", name: "ahmad-farid/ml-portfolio", confidence: 91, status: "verified", date: "2026-06-29", metadata: { commits: 47, complexity: "High", flags: 0 } },
    { id: "demo-art-2", type: "credential", name: "AWS Certified Developer – Associate", confidence: 88, status: "verified", date: "2026-06-24", metadata: { issuer: "Amazon Web Services", nameMatch: true } },
    { id: "demo-art-3", type: "document", name: "Final Year Research Paper", confidence: 79, status: "verified", date: "2026-06-18", metadata: { aiProbability: 8, writingComplexity: 82 } },
  ],
  ledger: [
    { blockIndex: 0, leafHash: "a1f8b2d1c9e04b7c119d", prevHash: "0".repeat(15) + "...", timestamp: "2026-06-18T11:43:51Z" },
    { blockIndex: 1, leafHash: "36f4cdd9b21e77a02b85", prevHash: "a1f8b2d1c9e04b7c119d", timestamp: "2026-06-24T14:27:08Z" },
    { blockIndex: 2, leafHash: "e37d6f6d4a1c93b8119d", prevHash: "36f4cdd9b21e77a02b85", timestamp: "2026-06-29T09:14:32Z" },
  ],
  merkleRoot: "f2b9c3e7a1d04a8b5c2e6f1d9a3b7c4e",
};

// All candidates including the demo one — used wherever a screen should show the full
// roster (Discover, Cohorts, credential issuance) so the logged-in demo candidate is a
// real, discoverable member of the graph too, not a separate island.
export const allCandidates: Candidate[] = [demoCandidate, ...candidates];

// ── The "logged-in" employer/university for the current session ────────────────────
// Mirrors demoCandidate's role: a stable, named identity (not a random pick) so Home/
// Discover/Pipeline read as "your" company rather than a random one from the roster —
// while still being a real member of `employers`, not a disconnected singleton.
export const demoEmployer: Employer = {
  ...employers[0],
  id: "demo-employer",
  name: "TechCorp Malaysia",
  contactName: "Amirul Hassan",
  email: "amirul.hassan@gmail.com",
  initial: "A",
  industry: "Technology",
};
export const demoUniversity: University = { ...universities[0], id: "demo-university", email: "career.services@gmail.com" };

export const allEmployers: Employer[] = [demoEmployer, ...employers];
export const allJobs: Job[] = [...jobs, ...Array.from({ length: 3 }, () => generateJob(demoEmployer))];

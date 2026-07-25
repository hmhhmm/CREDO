// Match scoring for the candidate-facing jobs feed — how well a job's required_skills line
// up with what the signed-in candidate has actually verified (not just claimed). This is
// the honest half of Smart Talent Matching (E2): the employer side scores candidates against
// a role, this scores a role against a candidate, from the same underlying skill data.
import type { JobFeedListing } from "../lib/api";
import type { SkillEntry } from "../lib/api";

export interface JobMatch {
  job: JobFeedListing;
  matchedSkills: string[];
  missingSkills: string[];
  score: number; // 0-100: share of required_skills the candidate has verified
}

function normalize(name: string) {
  return name.trim().toLowerCase();
}

export function scoreJobMatch(job: JobFeedListing, skills: SkillEntry[]): JobMatch {
  const verifiedNames = new Set(skills.filter((s) => s.verified).map((s) => normalize(s.skill)));
  const required = job.required_skills ?? [];

  const matchedSkills = required.filter((s) => verifiedNames.has(normalize(s)));
  const missingSkills = required.filter((s) => !verifiedNames.has(normalize(s)));
  const score = required.length > 0 ? Math.round((matchedSkills.length / required.length) * 100) : 0;

  return { job, matchedSkills, missingSkills, score };
}

export function rankJobMatches(jobs: JobFeedListing[], skills: SkillEntry[]): JobMatch[] {
  return jobs
    .map((job) => scoreJobMatch(job, skills))
    .filter((m) => m.matchedSkills.length > 0)
    .sort((a, b) => b.score - a.score);
}

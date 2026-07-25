// Career Path Navigator — real matches computed from the candidate's actual verified skills
// against real, currently-posted job listings (the same `allJobs` data Job Matches/Discover
// read from), grouped by title. A role's "match %" is the share of that title's aggregate
// required-skill set the candidate has actually verified; the "gap" is the specific missing
// skills, named, not a generic hint — and openings/salary come from the real listings
// themselves rather than invented copy. A candidate with no verified skills yet gets an
// honest empty list, not filler content.
import { allJobs, JOB_TITLES_BY_FIELD, type Job } from "../data/generateDataset";
import type { SkillEntry } from "../lib/api";

export interface CareerPathMatch {
  title: string;
  matchPct: number;
  matchedSkills: string[];
  gapSkills: string[];
  openRoles: number; // count of real open listings with this title, right now
  employers: string[]; // real company names currently hiring for this title (up to 3)
  salaryMin: number | null; // lowest real salaryMin across open listings with this title
  salaryMax: number | null; // highest real salaryMax across open listings with this title
}

function titleKey(title: string) {
  return title.trim().toLowerCase();
}

export function deriveCareerPathMatches(
  field: string | null | undefined,
  skills: SkillEntry[],
  employerNameById: Map<string, string>,
  limit = 5
): CareerPathMatch[] {
  const verifiedNames = new Set(skills.filter((s) => s.verified).map((s) => s.skill.toLowerCase()));

  // Group every real job listing (any field — a candidate's verified skills might make them
  // a real match for an adjacent field's role too, which a field-only filter would hide) by
  // title, aggregating the union of required skills and real listing stats.
  const byTitle = new Map<
    string,
    { title: string; skillSet: Set<string>; jobs: Job[] }
  >();
  for (const job of allJobs) {
    if (job.status !== "open") continue;
    const key = titleKey(job.title);
    const entry = byTitle.get(key) ?? { title: job.title, skillSet: new Set<string>(), jobs: [] };
    for (const rs of job.requiredSkills) entry.skillSet.add(rs.name);
    entry.jobs.push(job);
    byTitle.set(key, entry);
  }

  const matches: CareerPathMatch[] = [];
  for (const { title, skillSet, jobs } of byTitle.values()) {
    const required = Array.from(skillSet);
    if (required.length === 0) continue;
    const matchedSkills = required.filter((s) => verifiedNames.has(s.toLowerCase()));
    const gapSkills = required.filter((s) => !verifiedNames.has(s.toLowerCase()));
    const matchPct = Math.round((matchedSkills.length / required.length) * 100);
    if (matchPct === 0) continue; // no real overlap at all — not a "path", just noise

    const salaryMins = jobs.map((j) => j.salaryMin).filter((v): v is number => v != null);
    const salaryMaxs = jobs.map((j) => j.salaryMax).filter((v): v is number => v != null);
    const employers = Array.from(new Set(jobs.map((j) => employerNameById.get(j.employerId)).filter((n): n is string => !!n))).slice(0, 3);

    matches.push({
      title,
      matchPct,
      matchedSkills,
      gapSkills,
      openRoles: jobs.length,
      employers,
      salaryMin: salaryMins.length ? Math.min(...salaryMins) : null,
      salaryMax: salaryMaxs.length ? Math.max(...salaryMaxs) : null,
    });
  }

  // Highest match first; ties broken by the candidate's own field's real titles (a role
  // titled the way your own field's job market actually uses it beats an equally-scoring
  // one from an unrelated field), then by more real open roles (a path you could actually
  // apply to today beats a technically-tied one with nothing open).
  const ownFieldTitles = new Set((field ? JOB_TITLES_BY_FIELD[field] : undefined)?.map(titleKey) ?? []);
  matches.sort((a, b) => {
    if (b.matchPct !== a.matchPct) return b.matchPct - a.matchPct;
    const aOwnField = ownFieldTitles.has(titleKey(a.title)) ? 1 : 0;
    const bOwnField = ownFieldTitles.has(titleKey(b.title)) ? 1 : 0;
    if (bOwnField !== aOwnField) return bOwnField - aOwnField;
    return b.openRoles - a.openRoles;
  });
  return matches.slice(0, limit);
}

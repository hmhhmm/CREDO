// Targeted Upskilling — real recommendations computed from the candidate's own field and
// verified skills against data already in the app (SKILLS_BY_FIELD drives every candidate's
// generated profile, GAP_COURSES is the same skill->course map U2's Curriculum Gap Detector
// uses on the university side, CREDENTIAL_PROGRAMS is a real issuer-attributed catalog).
// Nothing here is a fixed script — a candidate who's already verified everything their
// field expects gets an empty gap list, not filler content.
import { SKILLS_BY_FIELD, CREDENTIAL_PROGRAMS, type CredentialProgram } from "../data/generateDataset";
import { GAP_COURSES } from "../data/universityData";
import type { SkillEntry } from "../lib/api";

export interface SkillGapRecommendation {
  skill: string;
  course: string | null; // a real GAP_COURSES entry, when this skill has one
}

export interface UpskillingRecommendations {
  skillGaps: SkillGapRecommendation[]; // expected-for-field skills not yet verified
  credentialPrograms: CredentialProgram[]; // real third-party programs closing those gaps
}

export function deriveUpskillingRecommendations(
  field: string | null | undefined,
  skills: SkillEntry[]
): UpskillingRecommendations {
  const expected = field ? SKILLS_BY_FIELD[field] ?? [] : [];
  const verifiedNames = new Set(skills.filter((s) => s.verified).map((s) => s.skill.toLowerCase()));

  const skillGaps: SkillGapRecommendation[] = expected
    .filter((skill) => !verifiedNames.has(skill.toLowerCase()))
    .map((skill) => ({ skill, course: GAP_COURSES[skill] ?? null }));

  const gapSkillNames = new Set(skillGaps.map((g) => g.skill));
  const credentialPrograms = CREDENTIAL_PROGRAMS.filter((p) => gapSkillNames.has(p.targetSkill));

  return { skillGaps, credentialPrograms };
}

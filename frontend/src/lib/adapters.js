// Backend responses use snake_case field names (CandidateSummary in
// backend/app/schemas/user.py); the existing components (NamecardCard, SkillBar,
// EmployerCandidates) were built against mockData.js's camelCase shape. Adapt at the
// API boundary rather than touching every component, so mock-data pages keep working
// unchanged.
export function candidateFromApi(summary) {
  return {
    id: summary.id,
    name: summary.name,
    field: summary.field_of_study,
    university: summary.university,
    year: summary.graduation_year ? String(summary.graduation_year) : null,
    location: summary.location,
    openToWork: summary.open_to_work,
    avatar: summary.avatar_url,
    bio: null, // not present on the browse-list summary; only on /namecard and /portfolio
    trustScore: summary.trust_score,
    verifiedSkills: summary.verified_skills.map(s => ({
      name: s.name,
      confidence: s.confidence,
      verified: true,
    })),
    claimedSkills: summary.claimed_skills ?? [],
    // The browse-list endpoint only reports completion/share booleans, not the score
    // breakdown (that lives behind /namecard/:userId) — consumers must not assume
    // simuHire.overallScore/type/dimensions are present here.
    simuHire: {
      completed: summary.simuhire_completed,
      shared: summary.simuhire_shared,
    },
  }
}

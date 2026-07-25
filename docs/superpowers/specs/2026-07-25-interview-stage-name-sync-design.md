# Interview Stage Name Sync — Design

## Problem

`frontend/src/mobile` already shares live pipeline state (`PipelineContext`) between the
employer and candidate sides: invites, scheduling, stage advancement, and decisions all read
and write the same persisted store, so a candidate's `ApplicationStatusScreen` reflects an
employer's actions on `PipelineScreen` in real time.

The one piece that does **not** sync: interview stage *names*. Employers can rename, reorder,
or add stages per-employer via `StageSettingsScreen` → `useInterviewStages()`
(`InterviewStagesContext`). That context stores every employer's stage list internally
(`byEmployer: Record<employerId, InterviewStageDef[]>`), but only exposes the *currently
logged-in* employer's slice through `stages`. `ApplicationStatusScreen` (candidate side) has
no session as that employer, so it falls back to hardcoded `DEFAULT_INTERVIEW_STAGES` to
resolve `entry.currentStageId` into a display name — meaning a renamed stage ("1st Round" →
"Screening") never appears correctly to the candidate.

Stage *progression* (which stage a candidate is currently at) already syncs correctly via
`PipelineEntry.currentStageId` — this design only fixes name resolution.

## Change 1 — `InterviewStagesContext.tsx`

Add a new function to the context value:

```ts
stagesForEmployer: (employerId: string) => InterviewStageDef[]
```

Behavior: returns `byEmployer[employerId]` if present, otherwise `DEFAULT_INTERVIEW_STAGES`
(mirrors the existing seeding fallback, just scoped to an arbitrary target employer instead of
the logged-in one). Pure read — no seeding side effect for employers other than the logged-in
one, since only the logged-in employer's `useEffect` seeds `byEmployer`.

Existing `stages` (current employer's own list) and all other exports are unchanged. All
current consumers (`PipelineScreen`, `InterviewDetailScreen`, `FairModeScreen`,
`CandidateProfileScreen`, `StageSettingsScreen`) keep using `stages` and are untouched.

## Change 2 — `ApplicationStatusScreen.tsx`

- Remove the module-level `resolveStageName(stageId)` helper and the `DEFAULT_INTERVIEW_STAGES`
  import.
- Call `useInterviewStages()` in the screen component to get `stagesForEmployer`.
- In `ApplicationCard`, resolve `stageName` via
  `stagesForEmployer(entry.employerId).find(s => s.id === entry.currentStageId)?.name ?? entry.currentStageId`,
  passed down as a prop (or computed inline) instead of the current hardcoded lookup.

## Data flow after the change

1. Employer renames a stage in `StageSettingsScreen` → `renameStage` → `InterviewStagesContext`
   writes to `usePersistentState("interview_stages", ...)` (localStorage).
2. Candidate opens/refocuses `ApplicationStatusScreen` → calls
   `stagesForEmployer(entry.employerId)` → reads the same persisted `interview_stages` store →
   gets the updated name immediately (no extra plumbing, same mechanism `pipelineForCandidate`
   already uses for entry state).

## Out of scope

- No new storage key, no changes to `PipelineEntry` shape, no changes to `advanceStage` /
  `markInterviewInvited` / stage progression logic (already synced).
- No push/real-time notification — sync is "next read reflects latest write," same as the rest
  of the app's localStorage-backed state model.

## Testing

Manual verification only (no test suite covers this tree per existing conventions):
1. Log in as an employer, invite a candidate to a stage, rename that stage in Settings.
2. Log in as the candidate, open Application Status — confirm the renamed label shows.
3. As the employer, advance the candidate to the next stage.
4. As the candidate, refocus Application Status — confirm the new stage's (possibly also
   renamed) name shows.

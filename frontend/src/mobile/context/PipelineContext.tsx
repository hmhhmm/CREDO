// Shared employer Pipeline state, visible across Candidate/Employer/University tabs —
// lets University's "Introduce to employer" (U6) actually land in the Employer's
// Pipeline (E3), proving the cross-tab loop closes without needing a backend.
//
// Scoped per employer: the store holds every employer's entries together (tagged with
// employerId), and `pipeline` exposes only the logged-in employer's slice — so switching
// role/logging in as a different employer shows that employer's own Pipeline, not one
// shared array everyone sees the same view of.
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { pipelineEntryFromCandidate, pipelineEntryFromApplication, type PipelineEntry } from "../data/employerData";
import { useAuth } from "./AuthContext";
import { usePersistentState } from "../utils/usePersistentState";
import type { Candidate } from "../data/types";

interface PipelineContextValue {
  pipeline: PipelineEntry[];
  addToPipeline: (entry: PipelineEntry) => void;
  // Cross-employer query — for callers that aren't logged in as any particular employer
  // (University's Partners screen checking "was this candidate introduced to *this*
  // employer") and so can't use the current-employer-filtered `pipeline` above.
  isInPipelineFor: (employerId: string, candidateId: string) => boolean;
  // Cross-employer query for the Candidate side — every entry across every employer that
  // references this candidate, regardless of which employer is currently logged in. Real
  // employer actions (invite/schedule/advance/decide) land in the same allEntries array
  // this reads from, so a candidate's Application Status is live employer state, not mock
  // preview content.
  pipelineForCandidate: (candidateId: string) => PipelineEntry[];
  // Cross-employer query for University (U9 Outcome Loop / Hire Intelligence's own
  // downstream reader) — every accepted decision across every employer, not just the one
  // currently logged in. Real employer accept actions land here the same way they land in
  // that employer's own Hire Intelligence screen; University aggregates the same events,
  // it doesn't get a separately invented hire count.
  allAcceptedHires: () => PipelineEntry[];
  // Candidate-initiated — "Apply with Smart Namecard" on a job card. employerId is passed
  // explicitly (unlike inviteToInterview, which reads it from the acting employer's own
  // session) because the actor here is the candidate, not an employer. Returns false if an
  // entry already exists for this candidate/employer pair (already applied or already
  // sourced by that employer some other way) so the caller can show "Already applied."
  applyToJob: (candidate: Candidate, employerId: string, jobTitle: string) => boolean;
  // Stamps hrViewedAt the first time an employer opens this candidate's profile — real
  // event, not a synthesized "2 hours ago." No-ops if already viewed (first view wins).
  markViewed: (id: string) => void;
  reEngage: (id: string, message: string) => void;
  // E9 Interview Invitation — stageId always comes from the caller (which already has
  // useInterviewStages()), so this context stays decoupled from stage configuration.
  inviteToInterview: (candidate: Candidate, stageId: string) => void;
  markInterviewInvited: (id: string, stageId: string) => void;
  scheduleInterview: (id: string, date: string) => void;
  advanceStage: (id: string, nextStageId: string) => void;
  completeInterview: (id: string) => void;
  // E-Decision — final accept/reject call, independent of which round the candidate was at.
  recordDecision: (id: string, decision: "accepted" | "rejected", message: string) => void;
  // E7 — HR rating/comments. Capture-and-display only; see PipelineEntry's hrRating docs.
  setRating: (id: string, rating: number) => void;
  addComment: (id: string, text: string) => void;
}

const PipelineCtx = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const employerId = user?.role === "employer" ? user.id : null;

  // Every employer's entries, together — filtered down to the current employer's slice
  // below. Persisted to localStorage (usePersistentState) so applications/interview
  // progress survive a page refresh — the same store the employer's Pipeline screen mutates
  // and the candidate's Application Status screen reads. No seed data: every employer starts
  // with an empty Pipeline, and every entry that ever appears is a real action (a candidate
  // applying, an employer inviting/sourcing someone, or a university introduction).
  const [allEntries, setAllEntries] = usePersistentState<PipelineEntry[]>("pipeline_entries", []);

  const pipeline = employerId ? allEntries.filter((p) => p.employerId === employerId) : [];

  const addToPipeline = useCallback((entry: PipelineEntry) => {
    setAllEntries((prev) =>
      prev.some((p) => p.employerId === entry.employerId && p.candidateId === entry.candidateId)
        ? prev
        : [entry, ...prev]
    );
  }, []);

  const isInPipelineFor = useCallback(
    (targetEmployerId: string, candidateId: string) =>
      allEntries.some((p) => p.employerId === targetEmployerId && p.candidateId === candidateId),
    [allEntries]
  );

  const pipelineForCandidate = useCallback(
    (candidateId: string) => allEntries.filter((p) => p.candidateId === candidateId),
    [allEntries]
  );

  const allAcceptedHires = useCallback(
    () => allEntries.filter((p) => p.decision === "accepted"),
    [allEntries]
  );

  const applyToJob = useCallback((candidate: Candidate, targetEmployerId: string, jobTitle: string): boolean => {
    let applied = false;
    setAllEntries((prev) => {
      const existing = prev.find((p) => p.employerId === targetEmployerId && p.candidateId === candidate.id);
      if (existing) return prev;
      applied = true;
      return [pipelineEntryFromApplication(candidate, targetEmployerId, jobTitle), ...prev];
    });
    return applied;
  }, []);

  const markViewed = useCallback((id: string) => {
    setAllEntries((prev) =>
      prev.map((p) => (p.id === id && !p.hrViewedAt ? { ...p, hrViewedAt: new Date().toISOString() } : p))
    );
  }, []);

  // Records a light-touch message on the entry itself (lastTouchedAt/lastTouchMessage)
  // instead of a screen-local flag, so the touch survives navigation away and back.
  const reEngage = useCallback((id: string, message: string) => {
    const touchedAt = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setAllEntries((prev) =>
      prev.map((p) => (p.id === id ? { ...p, lastTouchedAt: touchedAt, lastTouchMessage: message } : p))
    );
  }, []);

  // "Invite to Interview" can be pressed from a profile the employer reached via
  // Discover/Fair Mode, where the candidate may not be in the pipeline yet — auto-adds them
  // (mirroring addToPipeline's dedupe-by-candidateId) rather than silently doing nothing.
  // Always stamped with the *current* logged-in employer, not whichever entry happens to
  // match — inviting is something only the acting employer can do.
  const inviteToInterview = useCallback(
    (candidate: Candidate, stageId: string) => {
      if (!employerId) return;
      setAllEntries((prev) => {
        const existing = prev.find((p) => p.employerId === employerId && p.candidateId === candidate.id);
        if (existing) {
          return prev.map((p) => (p.id === existing.id ? { ...p, currentStageId: stageId } : p));
        }
        return [{ ...pipelineEntryFromCandidate(candidate, employerId), currentStageId: stageId }, ...prev];
      });
    },
    [employerId]
  );

  // For an entry already in the pipeline — e.g. inviting straight from a Pipeline card
  // rather than a Discover/Fair Mode profile, where inviteToInterview's add-if-missing
  // behavior isn't needed.
  const markInterviewInvited = useCallback((id: string, stageId: string) => {
    setAllEntries((prev) => prev.map((p) => (p.id === id ? { ...p, currentStageId: stageId } : p)));
  }, []);

  // Generates a meeting link at scheduling time, not on-demand at view time, so it stays
  // stable across repeat visits to the same interview instead of a fresh link every render.
  const scheduleInterview = useCallback((id: string, date: string) => {
    setAllEntries((prev) =>
      prev.map((p) => (p.id === id ? { ...p, interviewDate: date, meetingLink: `https://meet.credo.app/${id}` } : p))
    );
  }, []);

  // Moves to the next configured stage and clears the previous stage's scheduling — a new
  // stage needs its own date/link, not the old one carried over.
  const advanceStage = useCallback((id: string, nextStageId: string) => {
    setAllEntries((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, currentStageId: nextStageId, interviewDate: undefined, meetingLink: undefined } : p
      )
    );
  }, []);

  // Only meaningful once the candidate has finished the *last* configured stage — the
  // caller (PipelineScreen) decides when that's true, this just records the timestamp.
  const completeInterview = useCallback((id: string) => {
    setAllEntries((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stageCompletedAt: new Date().toISOString() } : p))
    );
  }, []);

  const recordDecision = useCallback((id: string, decision: "accepted" | "rejected", message: string) => {
    setAllEntries((prev) =>
      prev.map((p) => (p.id === id ? { ...p, decision, decisionMessage: message, decisionAt: new Date().toISOString() } : p))
    );
  }, []);

  const setRating = useCallback((id: string, rating: number) => {
    setAllEntries((prev) => prev.map((p) => (p.id === id ? { ...p, hrRating: rating } : p)));
  }, []);

  const addComment = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const comment = {
        id: `c-${Date.now()}`,
        author: user?.name ?? "You",
        text: trimmed,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
      setAllEntries((prev) =>
        prev.map((p) => (p.id === id ? { ...p, hrComments: [...(p.hrComments ?? []), comment] } : p))
      );
    },
    [user]
  );

  return (
    <PipelineCtx.Provider
      value={{
        pipeline,
        addToPipeline,
        isInPipelineFor,
        pipelineForCandidate,
        allAcceptedHires,
        applyToJob,
        markViewed,
        reEngage,
        inviteToInterview,
        markInterviewInvited,
        scheduleInterview,
        advanceStage,
        completeInterview,
        recordDecision,
        setRating,
        addComment,
      }}
    >
      {children}
    </PipelineCtx.Provider>
  );
}

export function usePipeline() {
  const ctx = useContext(PipelineCtx);
  if (!ctx) throw new Error("usePipeline must be used within PipelineProvider");
  return ctx;
}

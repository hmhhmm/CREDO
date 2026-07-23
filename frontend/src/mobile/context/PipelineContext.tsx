// Shared employer Pipeline state, visible across Candidate/Employer/University tabs —
// lets University's "Introduce to employer" (U6) actually land in the Employer's
// Pipeline (E3), proving the cross-tab loop closes without needing a backend.
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { pipeline as seedPipeline, pipelineEntryFromCandidate, type PipelineEntry } from "../data/employerData";
import type { Candidate } from "../data/types";

interface PipelineContextValue {
  pipeline: PipelineEntry[];
  addToPipeline: (entry: PipelineEntry) => void;
  reEngage: (id: string, message: string) => void;
  // E9 Interview Invitation
  inviteToInterview: (candidate: Candidate) => void;
  markInterviewInvited: (id: string) => void;
  scheduleInterview: (id: string, date: string) => void;
  completeInterview: (id: string) => void;
}

const PipelineCtx = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [pipeline, setPipeline] = useState<PipelineEntry[]>(seedPipeline);

  const addToPipeline = useCallback((entry: PipelineEntry) => {
    setPipeline((prev) => (prev.some((p) => p.candidateId === entry.candidateId) ? prev : [entry, ...prev]));
  }, []);

  // Records a light-touch message on the entry itself (lastTouchedAt/lastTouchMessage)
  // instead of a screen-local flag, so the touch survives navigation away and back.
  const reEngage = useCallback((id: string, message: string) => {
    const touchedAt = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setPipeline((prev) =>
      prev.map((p) => (p.id === id ? { ...p, lastTouchedAt: touchedAt, lastTouchMessage: message } : p))
    );
  }, []);

  // "Invite to Interview" can be pressed from a profile the employer reached via
  // Discover/Fair Mode, where the candidate may not be in the pipeline yet — auto-adds them
  // (mirroring addToPipeline's dedupe-by-candidateId) rather than silently doing nothing.
  const inviteToInterview = useCallback((candidate: Candidate) => {
    setPipeline((prev) => {
      const existing = prev.find((p) => p.candidateId === candidate.id);
      if (existing) {
        return prev.map((p) => (p.candidateId === candidate.id ? { ...p, interviewStatus: "invited" } : p));
      }
      return [{ ...pipelineEntryFromCandidate(candidate), interviewStatus: "invited" }, ...prev];
    });
  }, []);

  // For an entry already in the pipeline — e.g. inviting straight from a Pipeline card
  // rather than a Discover/Fair Mode profile, where inviteToInterview's add-if-missing
  // behavior isn't needed.
  const markInterviewInvited = useCallback((id: string) => {
    setPipeline((prev) => prev.map((p) => (p.id === id ? { ...p, interviewStatus: "invited" } : p)));
  }, []);

  const scheduleInterview = useCallback((id: string, date: string) => {
    setPipeline((prev) =>
      prev.map((p) => (p.id === id ? { ...p, interviewStatus: "scheduled", interviewDate: date } : p))
    );
  }, []);

  const completeInterview = useCallback((id: string) => {
    setPipeline((prev) => prev.map((p) => (p.id === id ? { ...p, interviewStatus: "completed" } : p)));
  }, []);

  return (
    <PipelineCtx.Provider
      value={{
        pipeline,
        addToPipeline,
        reEngage,
        inviteToInterview,
        markInterviewInvited,
        scheduleInterview,
        completeInterview,
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

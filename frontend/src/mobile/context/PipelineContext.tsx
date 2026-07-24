// Shared employer Pipeline state, visible across Candidate/Employer/University tabs —
// lets University's "Introduce to employer" (U6) actually land in the Employer's
// Pipeline (E3), proving the cross-tab loop closes without needing a backend.
//
// Scoped per employer: the store holds every employer's entries together (tagged with
// employerId), and `pipeline` exposes only the logged-in employer's slice — so switching
// role/logging in as a different employer shows that employer's own Pipeline, not one
// shared array everyone sees the same view of.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getPipelineSeedFor, pipelineEntryFromCandidate, type PipelineEntry } from "../data/employerData";
import { allEmployers } from "../data/generateDataset";
import { useAuth } from "./AuthContext";
import type { Candidate } from "../data/types";

interface PipelineContextValue {
  pipeline: PipelineEntry[];
  addToPipeline: (entry: PipelineEntry) => void;
  // Cross-employer query — for callers that aren't logged in as any particular employer
  // (University's Partners screen checking "was this candidate introduced to *this*
  // employer") and so can't use the current-employer-filtered `pipeline` above.
  isInPipelineFor: (employerId: string, candidateId: string) => boolean;
  reEngage: (id: string, message: string) => void;
  // E9 Interview Invitation
  inviteToInterview: (candidate: Candidate) => void;
  markInterviewInvited: (id: string) => void;
  scheduleInterview: (id: string, date: string) => void;
  completeInterview: (id: string) => void;
}

const PipelineCtx = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const employerId = user?.role === "employer" ? user.id : null;

  // Every employer's entries, together — filtered down to the current employer's slice
  // below. A ref (not state) tracks which employers have already been seeded this session,
  // so re-visiting an employer you've logged into before keeps whatever you did to their
  // Pipeline earlier instead of silently re-seeding over it.
  const [allEntries, setAllEntries] = useState<PipelineEntry[]>([]);
  const seededEmployerIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!employerId || seededEmployerIds.current.has(employerId)) return;
    const employer = allEmployers.find((e) => e.id === employerId);
    if (!employer) return;
    seededEmployerIds.current.add(employerId);
    setAllEntries((prev) => [...getPipelineSeedFor(employer), ...prev]);
  }, [employerId]);

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
    (candidate: Candidate) => {
      if (!employerId) return;
      setAllEntries((prev) => {
        const existing = prev.find((p) => p.employerId === employerId && p.candidateId === candidate.id);
        if (existing) {
          return prev.map((p) => (p.id === existing.id ? { ...p, interviewStatus: "invited" } : p));
        }
        return [{ ...pipelineEntryFromCandidate(candidate, employerId), interviewStatus: "invited" }, ...prev];
      });
    },
    [employerId]
  );

  // For an entry already in the pipeline — e.g. inviting straight from a Pipeline card
  // rather than a Discover/Fair Mode profile, where inviteToInterview's add-if-missing
  // behavior isn't needed.
  const markInterviewInvited = useCallback((id: string) => {
    setAllEntries((prev) => prev.map((p) => (p.id === id ? { ...p, interviewStatus: "invited" } : p)));
  }, []);

  const scheduleInterview = useCallback((id: string, date: string) => {
    setAllEntries((prev) =>
      prev.map((p) => (p.id === id ? { ...p, interviewStatus: "scheduled", interviewDate: date } : p))
    );
  }, []);

  const completeInterview = useCallback((id: string) => {
    setAllEntries((prev) => prev.map((p) => (p.id === id ? { ...p, interviewStatus: "completed" } : p)));
  }, []);

  return (
    <PipelineCtx.Provider
      value={{
        pipeline,
        addToPipeline,
        isInPipelineFor,
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

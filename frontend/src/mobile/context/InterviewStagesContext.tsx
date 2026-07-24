// E9 Interview Invitation — each employer's own configurable, ordered list of interview
// round names (Settings can add/rename/reorder/remove). Scoped per employer the same way
// PipelineContext is: every employer's list lives in one store, seeded lazily from
// DEFAULT_INTERVIEW_STAGES the first time that employer is seen logged in this session.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_INTERVIEW_STAGES, type InterviewStageDef } from "../data/employerData";
import { useAuth } from "./AuthContext";

interface StageMutationResult {
  ok: boolean;
  error?: string;
}

interface InterviewStagesContextValue {
  stages: InterviewStageDef[];
  addStage: (name: string) => StageMutationResult;
  renameStage: (id: string, name: string) => StageMutationResult;
  removeStage: (id: string) => void;
  moveStage: (id: string, direction: "up" | "down") => void;
}

const InterviewStagesCtx = createContext<InterviewStagesContextValue | null>(null);

function isDuplicateName(stages: InterviewStageDef[], name: string, excludeId?: string): boolean {
  const normalized = name.trim().toLowerCase();
  return stages.some((s) => s.id !== excludeId && s.name.trim().toLowerCase() === normalized);
}

export function InterviewStagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const employerId = user?.role === "employer" ? user.id : null;

  const [byEmployer, setByEmployer] = useState<Record<string, InterviewStageDef[]>>({});
  const seededEmployerIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!employerId || seededEmployerIds.current.has(employerId)) return;
    seededEmployerIds.current.add(employerId);
    // Deep-cloned per employer — editing one employer's stages must never mutate another's,
    // and everyone starts from the same defaults object otherwise.
    setByEmployer((prev) => ({ ...prev, [employerId]: DEFAULT_INTERVIEW_STAGES.map((s) => ({ ...s })) }));
  }, [employerId]);

  const stages = employerId ? byEmployer[employerId] ?? [] : [];

  const addStage = useCallback(
    (name: string): StageMutationResult => {
      const trimmed = name.trim();
      if (!employerId) return { ok: false, error: "Not logged in as an employer." };
      if (!trimmed) return { ok: false, error: "Stage name can't be empty." };
      if (isDuplicateName(stages, trimmed)) return { ok: false, error: "A stage with this name already exists." };
      const newStage: InterviewStageDef = { id: `${employerId}-stage-${Date.now()}`, name: trimmed };
      setByEmployer((prev) => ({ ...prev, [employerId]: [...(prev[employerId] ?? []), newStage] }));
      return { ok: true };
    },
    [employerId, stages]
  );

  const renameStage = useCallback(
    (id: string, name: string): StageMutationResult => {
      const trimmed = name.trim();
      if (!employerId) return { ok: false, error: "Not logged in as an employer." };
      if (!trimmed) return { ok: false, error: "Stage name can't be empty." };
      if (isDuplicateName(stages, trimmed, id)) return { ok: false, error: "A stage with this name already exists." };
      setByEmployer((prev) => ({
        ...prev,
        [employerId]: (prev[employerId] ?? []).map((s) => (s.id === id ? { ...s, name: trimmed } : s)),
      }));
      return { ok: true };
    },
    [employerId, stages]
  );

  const removeStage = useCallback(
    (id: string) => {
      if (!employerId) return;
      setByEmployer((prev) => ({ ...prev, [employerId]: (prev[employerId] ?? []).filter((s) => s.id !== id) }));
    },
    [employerId]
  );

  const moveStage = useCallback(
    (id: string, direction: "up" | "down") => {
      if (!employerId) return;
      setByEmployer((prev) => {
        const list = [...(prev[employerId] ?? [])];
        const index = list.findIndex((s) => s.id === id);
        const swapWith = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || swapWith < 0 || swapWith >= list.length) return prev;
        [list[index], list[swapWith]] = [list[swapWith], list[index]];
        return { ...prev, [employerId]: list };
      });
    },
    [employerId]
  );

  return (
    <InterviewStagesCtx.Provider value={{ stages, addStage, renameStage, removeStage, moveStage }}>
      {children}
    </InterviewStagesCtx.Provider>
  );
}

export function useInterviewStages() {
  const ctx = useContext(InterviewStagesCtx);
  if (!ctx) throw new Error("useInterviewStages must be used within InterviewStagesProvider");
  return ctx;
}

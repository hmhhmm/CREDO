// Shared employer Pipeline state, visible across Candidate/Employer/University tabs —
// lets University's "Introduce to employer" (U6) actually land in the Employer's
// Pipeline (E3), proving the cross-tab loop closes without needing a backend.
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { pipeline as seedPipeline, type PipelineEntry } from "../data/employerData";

interface PipelineContextValue {
  pipeline: PipelineEntry[];
  addToPipeline: (entry: PipelineEntry) => void;
  reEngage: (id: string, message: string) => void;
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

  return <PipelineCtx.Provider value={{ pipeline, addToPipeline, reEngage }}>{children}</PipelineCtx.Provider>;
}

export function usePipeline() {
  const ctx = useContext(PipelineCtx);
  if (!ctx) throw new Error("usePipeline must be used within PipelineProvider");
  return ctx;
}

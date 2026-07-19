// Shared employer Pipeline state, visible across Candidate/Employer/University tabs —
// lets University's "Introduce to employer" (U6) actually land in the Employer's
// Pipeline (E3), proving the cross-tab loop closes without needing a backend.
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { pipeline as seedPipeline, type PipelineEntry } from "../data/employerData";

interface PipelineContextValue {
  pipeline: PipelineEntry[];
  addToPipeline: (entry: PipelineEntry) => void;
}

const PipelineCtx = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [pipeline, setPipeline] = useState<PipelineEntry[]>(seedPipeline);

  const addToPipeline = useCallback((entry: PipelineEntry) => {
    setPipeline((prev) => (prev.some((p) => p.candidateId === entry.candidateId) ? prev : [entry, ...prev]));
  }, []);

  return <PipelineCtx.Provider value={{ pipeline, addToPipeline }}>{children}</PipelineCtx.Provider>;
}

export function usePipeline() {
  const ctx = useContext(PipelineCtx);
  if (!ctx) throw new Error("usePipeline must be used within PipelineProvider");
  return ctx;
}

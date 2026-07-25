// Candidate-side job bookmarks — the "one-tap save" affordance on a job card. Same shape
// as CredentialIssuerContext (a plain Set, global for the session): scoped by candidateId
// inside the key so switching which candidate is logged in doesn't leak one person's saves
// into another's view, without needing a per-candidate backend table that doesn't exist yet.
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { usePersistentState, setSerializer } from "../utils/usePersistentState";

interface SavedJobsContextValue {
  isSaved: (candidateId: string, jobId: string) => boolean;
  toggleSaved: (candidateId: string, jobId: string) => void;
  savedJobIdsFor: (candidateId: string) => string[];
}

const SavedJobsCtx = createContext<SavedJobsContextValue | null>(null);

function key(candidateId: string, jobId: string) {
  return `${candidateId}::${jobId}`;
}

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = usePersistentState<Set<string>, string[]>("saved_jobs", new Set(), setSerializer());

  const isSaved = useCallback((candidateId: string, jobId: string) => saved.has(key(candidateId, jobId)), [saved]);

  const toggleSaved = useCallback((candidateId: string, jobId: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      const k = key(candidateId, jobId);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  const savedJobIdsFor = useCallback(
    (candidateId: string) =>
      [...saved].filter((k) => k.startsWith(`${candidateId}::`)).map((k) => k.slice(candidateId.length + 2)),
    [saved]
  );

  return (
    <SavedJobsCtx.Provider value={{ isSaved, toggleSaved, savedJobIdsFor }}>{children}</SavedJobsCtx.Provider>
  );
}

export function useSavedJobs() {
  const ctx = useContext(SavedJobsCtx);
  if (!ctx) throw new Error("useSavedJobs must be used within SavedJobsProvider");
  return ctx;
}

// Employer-side saved candidate cards — the folder that collects candidate namecards an
// employer has scanned at a fair, mirroring SavedCompanyCardsContext.tsx on the candidate
// side exactly. Deliberately separate from PipelineContext: Pipeline is a full recruiting
// funnel (stages, interviews, decisions), while this is just a lightweight "cards I've
// scanned" folder — scanning someone's QR doesn't mean you're recruiting them yet. Session-
// only store, same as its candidate-side counterpart, since there's no backend table for
// this yet.
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { usePersistentState, mapSerializer } from "../utils/usePersistentState";

export interface SavedCandidateCard {
  candidateId: string;
  savedAt: string;
}

interface SavedCandidateCardsContextValue {
  savedCardsFor: (employerId: string) => SavedCandidateCard[];
  isCardSaved: (employerId: string, candidateId: string) => boolean;
  saveCard: (employerId: string, candidateId: string) => void;
  removeCard: (employerId: string, candidateId: string) => void;
}

const SavedCandidateCardsCtx = createContext<SavedCandidateCardsContextValue | null>(null);

function key(employerId: string, candidateId: string) {
  return `${employerId}::${candidateId}`;
}

export function SavedCandidateCardsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = usePersistentState<Map<string, SavedCandidateCard>, [string, SavedCandidateCard][]>(
    "saved_candidate_cards",
    new Map(),
    mapSerializer<SavedCandidateCard>()
  );

  const savedCardsFor = useCallback(
    (employerId: string) =>
      [...saved.entries()]
        .filter(([k]) => k.startsWith(`${employerId}::`))
        .map(([, v]) => v)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
    [saved]
  );

  const isCardSaved = useCallback(
    (employerId: string, candidateId: string) => saved.has(key(employerId, candidateId)),
    [saved]
  );

  const saveCard = useCallback((employerId: string, candidateId: string) => {
    setSaved((prev) => {
      const k = key(employerId, candidateId);
      if (prev.has(k)) return prev;
      const next = new Map(prev);
      next.set(k, { candidateId, savedAt: new Date().toISOString() });
      return next;
    });
  }, []);

  const removeCard = useCallback((employerId: string, candidateId: string) => {
    setSaved((prev) => {
      const k = key(employerId, candidateId);
      if (!prev.has(k)) return prev;
      const next = new Map(prev);
      next.delete(k);
      return next;
    });
  }, []);

  return (
    <SavedCandidateCardsCtx.Provider value={{ savedCardsFor, isCardSaved, saveCard, removeCard }}>
      {children}
    </SavedCandidateCardsCtx.Provider>
  );
}

export function useSavedCandidateCards() {
  const ctx = useContext(SavedCandidateCardsCtx);
  if (!ctx) throw new Error("useSavedCandidateCards must be used within SavedCandidateCardsProvider");
  return ctx;
}

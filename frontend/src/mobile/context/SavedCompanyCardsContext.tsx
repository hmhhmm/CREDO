// Candidate-side saved company cards — the folder that collects employer namecards a
// candidate has scanned (Fair Mode), mirroring how the employer side already saves scanned
// candidates into their Pipeline. Session-only store, candidate-scoped by key (same pattern
// as SavedJobsContext/CredentialIssuerContext), since there's no backend table for this yet.
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { usePersistentState, mapSerializer } from "../utils/usePersistentState";

export interface SavedCompanyCard {
  employerId: string;
  savedAt: string;
}

interface SavedCompanyCardsContextValue {
  savedCardsFor: (candidateId: string) => SavedCompanyCard[];
  isCardSaved: (candidateId: string, employerId: string) => boolean;
  saveCard: (candidateId: string, employerId: string) => void;
  removeCard: (candidateId: string, employerId: string) => void;
}

const SavedCompanyCardsCtx = createContext<SavedCompanyCardsContextValue | null>(null);

function key(candidateId: string, employerId: string) {
  return `${candidateId}::${employerId}`;
}

export function SavedCompanyCardsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = usePersistentState<Map<string, SavedCompanyCard>, [string, SavedCompanyCard][]>(
    "saved_company_cards",
    new Map(),
    mapSerializer<SavedCompanyCard>()
  );

  const savedCardsFor = useCallback(
    (candidateId: string) =>
      [...saved.entries()]
        .filter(([k]) => k.startsWith(`${candidateId}::`))
        .map(([, v]) => v)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
    [saved]
  );

  const isCardSaved = useCallback(
    (candidateId: string, employerId: string) => saved.has(key(candidateId, employerId)),
    [saved]
  );

  const saveCard = useCallback((candidateId: string, employerId: string) => {
    setSaved((prev) => {
      const k = key(candidateId, employerId);
      if (prev.has(k)) return prev;
      const next = new Map(prev);
      next.set(k, { employerId, savedAt: new Date().toISOString() });
      return next;
    });
  }, []);

  const removeCard = useCallback((candidateId: string, employerId: string) => {
    setSaved((prev) => {
      const k = key(candidateId, employerId);
      if (!prev.has(k)) return prev;
      const next = new Map(prev);
      next.delete(k);
      return next;
    });
  }, []);

  return (
    <SavedCompanyCardsCtx.Provider value={{ savedCardsFor, isCardSaved, saveCard, removeCard }}>
      {children}
    </SavedCompanyCardsCtx.Provider>
  );
}

export function useSavedCompanyCards() {
  const ctx = useContext(SavedCompanyCardsCtx);
  if (!ctx) throw new Error("useSavedCompanyCards must be used within SavedCompanyCardsProvider");
  return ctx;
}

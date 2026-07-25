// Life Chapter Designer (C9) — the candidate's own authored chapters (past and planned life
// events: parental leave, health break, sabbatical, education, or a custom one), each with a
// real target period, an optional savings goal/progress, and a disclosure setting the
// candidate controls. Persisted per-candidate so a planned chapter created here is still
// there on reload — previously this was entirely hardcoded/session-only, which is exactly
// what made every part of this screen read as a mockup instead of a tool. Global provider,
// scoped by candidateId in the storage key (same pattern as SavedJobsContext) since there's
// no backend table for this yet.
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { usePersistentState } from "../utils/usePersistentState";

export type ChapterKind = "parental" | "health" | "sabbatical" | "education" | "custom";
export type ChapterStatus = "past" | "planned";
export type Disclosure = "chapter" | "break" | "hidden";
export type CheckInCadence = "quiet" | "monthly" | "active";

export interface LifeChapter {
  id: string;
  candidateId: string;
  kind: ChapterKind;
  title: string;
  period: string; // free-text display period, e.g. "2026 · Q4" or "2024"
  targetDate: string | null; // ISO date, only set for planned chapters with a real target
  status: ChapterStatus;
  verified: boolean; // backed by the credential ledger — candidate-authored chapters start false
  note: string;
  disclosure: Disclosure;
  savingsGoal: number | null; // RM, only for planned chapters that set one
  savingsSaved: number; // RM saved toward the goal so far, user-entered
  createdAt: string;
}

export interface ChapterSupportSettings {
  onBreak: boolean;
  cadence: CheckInCadence;
  keepWarm: boolean;
}

const DEFAULT_SUPPORT: ChapterSupportSettings = { onBreak: false, cadence: "monthly", keepWarm: false };

interface LifeChapterContextValue {
  chaptersFor: (candidateId: string) => LifeChapter[];
  addChapter: (chapter: Omit<LifeChapter, "id" | "createdAt">) => LifeChapter;
  updateChapter: (id: string, patch: Partial<Omit<LifeChapter, "id" | "candidateId" | "createdAt">>) => void;
  removeChapter: (id: string) => void;
  cycleDisclosure: (id: string) => void;
  supportFor: (candidateId: string) => ChapterSupportSettings;
  updateSupport: (candidateId: string, patch: Partial<ChapterSupportSettings>) => void;
}

const LifeChapterCtx = createContext<LifeChapterContextValue | null>(null);

const DISCLOSURE_ORDER: Disclosure[] = ["chapter", "break", "hidden"];

export function LifeChapterProvider({ children }: { children: ReactNode }) {
  const [chapters, setChapters] = usePersistentState<LifeChapter[]>("life_chapters", []);
  const [supportByCandidate, setSupportByCandidate] = usePersistentState<Record<string, ChapterSupportSettings>>(
    "life_chapter_support",
    {}
  );

  const chaptersFor = useCallback(
    (candidateId: string) =>
      chapters
        .filter((c) => c.candidateId === candidateId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [chapters]
  );

  const addChapter = useCallback(
    (chapter: Omit<LifeChapter, "id" | "createdAt">): LifeChapter => {
      const newChapter: LifeChapter = { ...chapter, id: `chapter-${Date.now()}`, createdAt: new Date().toISOString() };
      setChapters((prev) => [newChapter, ...prev]);
      return newChapter;
    },
    [setChapters]
  );

  const updateChapter = useCallback(
    (id: string, patch: Partial<Omit<LifeChapter, "id" | "candidateId" | "createdAt">>) => {
      setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [setChapters]
  );

  const removeChapter = useCallback(
    (id: string) => {
      setChapters((prev) => prev.filter((c) => c.id !== id));
    },
    [setChapters]
  );

  const cycleDisclosure = useCallback(
    (id: string) => {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, disclosure: DISCLOSURE_ORDER[(DISCLOSURE_ORDER.indexOf(c.disclosure) + 1) % DISCLOSURE_ORDER.length] }
            : c
        )
      );
    },
    [setChapters]
  );

  const supportFor = useCallback(
    (candidateId: string) => supportByCandidate[candidateId] ?? DEFAULT_SUPPORT,
    [supportByCandidate]
  );

  const updateSupport = useCallback(
    (candidateId: string, patch: Partial<ChapterSupportSettings>) => {
      setSupportByCandidate((prev) => ({
        ...prev,
        [candidateId]: { ...(prev[candidateId] ?? DEFAULT_SUPPORT), ...patch },
      }));
    },
    [setSupportByCandidate]
  );

  return (
    <LifeChapterCtx.Provider
      value={{ chaptersFor, addChapter, updateChapter, removeChapter, cycleDisclosure, supportFor, updateSupport }}
    >
      {children}
    </LifeChapterCtx.Provider>
  );
}

export function useLifeChapters() {
  const ctx = useContext(LifeChapterCtx);
  if (!ctx) throw new Error("useLifeChapters must be used within LifeChapterProvider");
  return ctx;
}

// U9 Outcome Loop — lets a university actually record what it did about a flagged skill
// gap, instead of the loop only ever showing a fixed illustrative suggestion (the old
// ACTIONS map in universityData.ts). That static map still surfaces as a starting
// suggestion, but logging a real response here is what makes the loop demonstrably close.
// Global, same pattern as SkillFeedbackContext — University has no backend session.
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface LoggedCurriculumAction {
  action: string;
  loggedAt: string;
}

interface CurriculumActionContextValue {
  actionFor: (universityId: string, skill: string) => LoggedCurriculumAction | null;
  logAction: (universityId: string, skill: string, action: string) => void;
}

const CurriculumActionCtx = createContext<CurriculumActionContextValue | null>(null);

function key(universityId: string, skill: string) {
  return `${universityId}::${skill}`;
}

export function CurriculumActionProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, LoggedCurriculumAction>>({});

  const actionFor = useCallback(
    (universityId: string, skill: string) => entries[key(universityId, skill)] ?? null,
    [entries]
  );

  const logAction = useCallback((universityId: string, skill: string, action: string) => {
    setEntries((prev) => ({
      ...prev,
      [key(universityId, skill)]: {
        action,
        loggedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      },
    }));
  }, []);

  return (
    <CurriculumActionCtx.Provider value={{ actionFor, logAction }}>{children}</CurriculumActionCtx.Provider>
  );
}

export function useCurriculumAction() {
  const ctx = useContext(CurriculumActionCtx);
  if (!ctx) throw new Error("useCurriculumAction must be used within CurriculumActionProvider");
  return ctx;
}

// E-University Feedback (E9 on the feature table / Bridge C) — an employer, after
// evaluating a candidate, tells that candidate's university which skill needs work. Global
// (not employer- or university-scoped like Pipeline/InterviewStages) because the whole
// point is crossing the Employer -> University boundary: any employer can write, any
// university reads only their own students' feedback via universityName.
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface SkillFeedback {
  id: string;
  universityName: string; // matches University.name, same join key studentsOf() uses
  candidateId: string;
  candidateName: string;
  employerName: string; // the company, not the individual HR contact
  skill: string;
  note: string;
  date: string;
}

interface SkillFeedbackContextValue {
  feedbackFor: (universityName: string) => SkillFeedback[];
  submitFeedback: (entry: Omit<SkillFeedback, "id" | "date">) => void;
}

const SkillFeedbackCtx = createContext<SkillFeedbackContextValue | null>(null);

export function SkillFeedbackProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<SkillFeedback[]>([]);

  const feedbackFor = useCallback(
    (universityName: string) => entries.filter((f) => f.universityName === universityName),
    [entries]
  );

  const submitFeedback = useCallback((entry: Omit<SkillFeedback, "id" | "date">) => {
    const feedback: SkillFeedback = {
      ...entry,
      id: `feedback-${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    setEntries((prev) => [feedback, ...prev]);
  }, []);

  return (
    <SkillFeedbackCtx.Provider value={{ feedbackFor, submitFeedback }}>{children}</SkillFeedbackCtx.Provider>
  );
}

export function useSkillFeedback() {
  const ctx = useContext(SkillFeedbackCtx);
  if (!ctx) throw new Error("useSkillFeedback must be used within SkillFeedbackProvider");
  return ctx;
}

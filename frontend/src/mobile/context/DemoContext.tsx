// Ported from frontend/src/context/DemoContext.jsx — same demo-mode simulation of
// agent verification unlocking skills/trust score, kept in parity with web.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mockCurrentCandidate } from "../data/mockData";
import type { Artifact, ArtifactType, Candidate } from "../data/types";

const base = mockCurrentCandidate;

type AgentType = "github" | "credential" | "document";

const AGENT_SKILLS: Record<AgentType, Candidate["verifiedSkills"]> = {
  github: base.verifiedSkills.filter((s) => ["Python", "Machine Learning"].includes(s.name)),
  credential: base.verifiedSkills.filter((s) => ["SQL"].includes(s.name)),
  document: base.verifiedSkills.filter((s) => ["Docker"].includes(s.name)),
};

const AGENT_SCORES: Record<AgentType, number> = { github: 31, credential: 30, document: 26 };

interface DemoContextValue {
  liveCandidate: Candidate;
  verifiedAgents: Set<AgentType>;
  verifiedCount: number;
  trustScore: number;
  simuHireDone: boolean;
  simuHireShared: boolean;
  markAgentVerified: (agent: AgentType) => void;
  markSimuHireDone: () => void;
  markSimuHireShared: () => void;
  reset: () => void;
}

const DemoCtx = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [verifiedAgents, setVerifiedAgents] = useState<Set<AgentType>>(new Set());
  const [simuHireDone, setSimuHireDone] = useState(false);
  const [simuHireShared, setSimuHireShared] = useState(false);

  const markAgentVerified = useCallback((agent: AgentType) => {
    setVerifiedAgents((prev) => new Set([...prev, agent]));
  }, []);

  const markSimuHireDone = useCallback(() => {
    setSimuHireDone(true);
  }, []);

  const markSimuHireShared = useCallback(() => {
    setSimuHireDone(true);
    setSimuHireShared(true);
  }, []);

  const reset = useCallback(() => {
    setVerifiedAgents(new Set());
    setSimuHireDone(false);
    setSimuHireShared(false);
  }, []);

  const liveCandidate = useMemo<Candidate>(() => {
    const trustScore = [...verifiedAgents].reduce((sum, a) => sum + (AGENT_SCORES[a] || 0), 0);

    const verifiedSkills = (["github", "credential", "document"] as AgentType[])
      .filter((a) => verifiedAgents.has(a))
      .flatMap((a) => AGENT_SKILLS[a]);

    const artifacts: Artifact[] = base.artifacts.map((a) => ({
      ...a,
      status: verifiedAgents.has(a.type as ArtifactType) ? "verified" : "empty",
    }));

    const simuHire = simuHireDone
      ? { ...base.simuHire, completed: true, shared: simuHireShared }
      : { completed: false, shared: false };

    return { ...base, trustScore, verifiedSkills, artifacts, simuHire };
  }, [verifiedAgents, simuHireDone, simuHireShared]);

  const value: DemoContextValue = {
    liveCandidate,
    verifiedAgents,
    verifiedCount: verifiedAgents.size,
    trustScore: liveCandidate.trustScore,
    simuHireDone,
    simuHireShared,
    markAgentVerified,
    markSimuHireDone,
    markSimuHireShared,
    reset,
  };

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoCtx);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { mockCurrentCandidate } from '../data/mockData'

const base = mockCurrentCandidate

// Skills unlocked by each agent type (matches base candidate's verifiedSkills)
const AGENT_SKILLS = {
  github:     base.verifiedSkills.filter(s => ['Python', 'Machine Learning'].includes(s.name)),
  credential: base.verifiedSkills.filter(s => ['SQL'].includes(s.name)),
  document:   base.verifiedSkills.filter(s => ['Docker'].includes(s.name)),
}

// Trust score contribution per agent — sums to base.trustScore (87)
const AGENT_SCORES = { github: 31, credential: 30, document: 26 }

const DemoCtx = createContext(null)

export function DemoProvider({ children }) {
  const [verifiedAgents, setVerifiedAgents] = useState(new Set())
  const [simuHireDone,   setSimuHireDone]   = useState(false)
  const [simuHireShared, setSimuHireShared] = useState(false)

  const markAgentVerified = useCallback((agent) => {
    setVerifiedAgents(prev => new Set([...prev, agent]))
  }, [])

  const markSimuHireDone = useCallback(() => {
    setSimuHireDone(true)
  }, [])

  const markSimuHireShared = useCallback(() => {
    setSimuHireDone(true)
    setSimuHireShared(true)
  }, [])

  const reset = useCallback(() => {
    setVerifiedAgents(new Set())
    setSimuHireDone(false)
    setSimuHireShared(false)
  }, [])

  const liveCandidate = useMemo(() => {
    const trustScore = [...verifiedAgents].reduce((sum, a) => sum + (AGENT_SCORES[a] || 0), 0)

    const verifiedSkills = ['github', 'credential', 'document']
      .filter(a => verifiedAgents.has(a))
      .flatMap(a => AGENT_SKILLS[a])

    const artifacts = base.artifacts.map(a => ({
      ...a,
      status: verifiedAgents.has(a.type) ? 'verified' : 'empty',
    }))

    const simuHire = simuHireDone
      ? { ...base.simuHire, completed: true, shared: simuHireShared }
      : { completed: false, shared: false }

    return { ...base, trustScore, verifiedSkills, artifacts, simuHire }
  }, [verifiedAgents, simuHireDone, simuHireShared])

  return (
    <DemoCtx.Provider value={{
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
    }}>
      {children}
    </DemoCtx.Provider>
  )
}

export const useDemo = () => useContext(DemoCtx)

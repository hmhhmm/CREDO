import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, Users, X } from 'lucide-react'
import NamecardCard from '../components/NamecardCard'
import { mockCandidates } from '../data/mockData'

const allSkills = ['Python', 'Machine Learning', 'SQL', 'React', 'Node.js', 'TypeScript', 'Docker']

export default function EmployerCandidates() {
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [simuHireOnly, setSimuHireOnly] = useState(false)
  const [verifiedSkillsOnly, setVerifiedSkillsOnly] = useState(true) // default: match verified skills only
  const [selectedSkills, setSelectedSkills] = useState([])
  const [minScore, setMinScore] = useState(0)

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const clearAll = () => {
    setVerifiedOnly(false)
    setSimuHireOnly(false)
    setSelectedSkills([])
    setMinScore(0)
  }

  const hasFilters = verifiedOnly || simuHireOnly || selectedSkills.length > 0 || minScore > 0

  const filtered = mockCandidates
    .filter(c => !verifiedOnly || c.verifiedSkills.length > 0)
    .filter(c => !simuHireOnly || (c.simuHire?.completed && c.simuHire?.shared))
    .filter(c => c.trustScore >= minScore)
    .filter(c => selectedSkills.length === 0 || selectedSkills.some(s => {
      const inVerified = c.verifiedSkills.some(vs => vs.name === s)
      const inClaimed = c.claimedSkills?.includes(s)
      return verifiedSkillsOnly ? inVerified : (inVerified || inClaimed)
    }))
    .sort((a, b) => {
      if (a.simuHire?.completed && !b.simuHire?.completed) return -1
      if (!a.simuHire?.completed && b.simuHire?.completed) return 1
      if (a.verifiedSkills.length > 0 && b.verifiedSkills.length === 0) return -1
      if (a.verifiedSkills.length === 0 && b.verifiedSkills.length > 0) return 1
      return b.trustScore - a.trustScore
    })

  const activeChips = [
    verifiedOnly && { label: 'Verified Only', clear: () => setVerifiedOnly(false) },
    simuHireOnly && { label: 'SimuHire Done', clear: () => setSimuHireOnly(false) },
    minScore > 0 && { label: `Score ≥ ${minScore}`, clear: () => setMinScore(0) },
    ...selectedSkills.map(s => ({ label: s, clear: () => toggleSkill(s) })),
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-parchment">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-line">
        <Link to="/" className="font-display font-bold text-ink text-lg">CREDO</Link>
        <Link to="/employer" className="text-sm text-slate hover:text-ink transition-colors">← Dashboard</Link>
      </nav>

      <div className="flex">
        {/* Filter sidebar */}
        <aside className="w-64 shrink-0 border-r border-line min-h-screen p-6">
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal size={14} className="text-slate" />
            <h2 className="text-xs font-semibold text-slate uppercase tracking-wider">Filters</h2>
          </div>

          {/* Toggles */}
          <div className="space-y-3 mb-6">
            {[
              { label: 'Verified Only', value: verifiedOnly, set: setVerifiedOnly },
              { label: 'SimuHire Done', value: simuHireOnly, set: setSimuHireOnly },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-ink">{label}</span>
                <button
                  onClick={() => set(!value)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${value ? 'bg-ink' : 'bg-line'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-parchment transition-all shadow-sm ${value ? 'left-5' : 'left-0.5'}`} />
                </button>
              </label>
            ))}
          </div>

          {/* Min trust score */}
          <div className="mb-6">
            <p className="text-xs font-medium text-slate uppercase tracking-wider mb-2">Min Trust Score</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0} max={100} step={10}
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="flex-1 accent-ink"
              />
              <span className="font-mono text-xs text-ink w-6">{minScore}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-4">
            <p className="text-xs font-medium text-slate uppercase tracking-wider mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {allSkills.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSkill(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedSkills.includes(s) ? 'bg-ink text-parchment border-ink' : 'border-line text-slate hover:border-slate hover:text-ink'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedSkillsOnly}
                  onChange={e => setVerifiedSkillsOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-slate">Verified skills only</span>
              </label>
            )}
          </div>

          {hasFilters && (
            <button onClick={clearAll} className="text-xs text-slate hover:text-ink underline">
              Clear all filters
            </button>
          )}
        </aside>

        {/* Candidate grid */}
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display font-bold text-ink text-2xl">Browse Candidates</h1>
            <span className="flex items-center gap-1.5 text-sm text-slate font-mono">
              <Users size={14} /> {filtered.length} result{filtered.length !== 1 ? 's' : ''} · sorted by trust score
            </span>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {activeChips.map(chip => (
                <button
                  key={chip.label}
                  onClick={chip.clear}
                  className="flex items-center gap-1.5 text-xs bg-ink text-parchment px-2.5 py-1 rounded-full font-medium"
                >
                  {chip.label} <X size={10} />
                </button>
              ))}
              <button onClick={clearAll} className="text-xs text-slate hover:text-ink underline ml-1">
                Clear all
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate text-sm">No candidates match your filters.</p>
              <button onClick={clearAll} className="text-xs text-ink font-medium hover:underline mt-2 block mx-auto">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(c => (
                <Link key={c.id} to={`/card/${c.id}`}>
                  <NamecardCard candidate={c} compact />
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

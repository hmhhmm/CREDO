import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, Users } from 'lucide-react'
import NamecardCard from '../components/NamecardCard'
import { mockCandidates } from '../data/mockData'

const allSkills = ['Python', 'Machine Learning', 'SQL', 'React', 'Node.js', 'TypeScript', 'Docker']

export default function EmployerCandidates() {
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [simuHireOnly, setSimuHireOnly] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState([])
  const [minScore, setMinScore] = useState(0)

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const filtered = mockCandidates
    .filter(c => !verifiedOnly || c.verifiedSkills.length > 0)
    .filter(c => !simuHireOnly || (c.simuHire?.completed && c.simuHire?.shared))
    .filter(c => c.trustScore >= minScore)
    .filter(c => selectedSkills.length === 0 || selectedSkills.some(s =>
      c.verifiedSkills.some(vs => vs.name === s) || c.claimedSkills?.includes(s)
    ))
    .sort((a, b) => {
      // SimuHire completed ranks above
      if (a.simuHire?.completed && !b.simuHire?.completed) return -1
      if (!a.simuHire?.completed && b.simuHire?.completed) return 1
      // Verified skills ranks above
      if (a.verifiedSkills.length > 0 && b.verifiedSkills.length === 0) return -1
      if (a.verifiedSkills.length === 0 && b.verifiedSkills.length > 0) return 1
      return b.trustScore - a.trustScore
    })

  return (
    <div className="min-h-screen bg-parchment">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-line">
        <Link to="/" className="font-display font-bold text-ink text-lg">CREDO</Link>
        <Link to="/employer" className="text-sm text-slate hover:text-ink transition-colors">← Dashboard</Link>
      </nav>

      <div className="flex gap-0">
        {/* Filter sidebar */}
        <aside className="w-64 shrink-0 border-r border-line min-h-screen p-6">
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal size={14} className="text-slate" />
            <h2 className="text-xs font-semibold text-slate uppercase tracking-wider">Filters</h2>
          </div>

          {/* Toggles */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-ink group-hover:text-ink">Verified Only</span>
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`w-10 h-5 rounded-full transition-colors relative ${verifiedOnly ? 'bg-ink' : 'bg-line'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-parchment transition-all shadow-sm ${verifiedOnly ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-ink">SimuHire Done</span>
              <button
                onClick={() => setSimuHireOnly(!simuHireOnly)}
                className={`w-10 h-5 rounded-full transition-colors relative ${simuHireOnly ? 'bg-ink' : 'bg-line'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-parchment transition-all shadow-sm ${simuHireOnly ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>

          {/* Min trust score */}
          <div className="mb-6">
            <p className="text-xs font-medium text-slate uppercase tracking-wider mb-2">Min Trust Score</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="flex-1 accent-ink"
              />
              <span className="font-mono text-xs text-ink w-6">{minScore}</span>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-medium text-slate uppercase tracking-wider mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
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
          </div>

          {(verifiedOnly || simuHireOnly || selectedSkills.length > 0 || minScore > 0) && (
            <button
              onClick={() => { setVerifiedOnly(false); setSimuHireOnly(false); setSelectedSkills([]); setMinScore(0) }}
              className="mt-6 text-xs text-slate hover:text-ink underline"
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* Candidate grid */}
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display font-bold text-ink text-2xl">Browse Candidates</h1>
            <span className="flex items-center gap-1.5 text-sm text-slate">
              <Users size={14} /> {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate text-sm">No candidates match your filters.</p>
              <button onClick={() => { setVerifiedOnly(false); setSimuHireOnly(false); setSelectedSkills([]); setMinScore(0) }} className="text-xs text-ink font-medium hover:underline mt-2 block mx-auto">
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

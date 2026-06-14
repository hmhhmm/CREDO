import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, Lock, ArrowLeft, TrendingUp, Minus } from 'lucide-react'
import NamecardPremium from '../components/NamecardPremium'
import { mockReport } from '../data/mockData'
import { useDemo } from '../context/DemoContext'

// ─── Radar chart ──────────────────────────────────────────────────────────────

function RadarChart({ dims, size = 200 }) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  const keys = Object.keys(dims)
  const n = keys.length

  const pt = (i, val) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2
    const rv = (val / 100) * r
    return [cx + rv * Math.cos(angle), cy + rv * Math.sin(angle)]
  }

  const gridPoly = (level) =>
    keys.map((_, i) => {
      const angle = (i * 2 * Math.PI / n) - Math.PI / 2
      const rv = (level / 100) * r
      return `${cx + rv * Math.cos(angle)},${cy + rv * Math.sin(angle)}`
    }).join(' ')

  const dataPoly = keys.map((k, i) => pt(i, dims[k]).join(',')).join(' ')

  const shortLabel = {
    Adaptability: 'Adapt',
    Communication: 'Comm',
    'Problem-Solving': 'Problem',
    'Stress Response': 'Stress',
    'Systems Thinking': 'Systems',
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {[25, 50, 75, 100].map(lvl => (
        <polygon key={lvl} points={gridPoly(lvl)} fill="none" stroke="#DCD2BC" strokeWidth="1" />
      ))}
      {keys.map((_, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#DCD2BC" strokeWidth="1" />
      })}
      <polygon points={dataPoly} fill="#1F7A5C" fillOpacity="0.15" stroke="#1F7A5C" strokeWidth="2" />
      {keys.map((k, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        const lr = r + 22
        const [lx, ly] = [cx + lr * Math.cos(angle), cy + lr * Math.sin(angle)]
        return (
          <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="#6B7785" fontFamily="IBM Plex Mono, monospace">
            {shortLabel[k] || k}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Score display ────────────────────────────────────────────────────────────

function SimuHireScore({ score }) {
  const color = score >= 80 ? '#1F7A5C' : score >= 60 ? '#2563EB' : score >= 40 ? '#D9A441' : '#C4503A'
  const label = score >= 80 ? 'High Performer' : score >= 60 ? 'Solid Performer' : score >= 40 ? 'Developing' : 'Needs Work'
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-28 h-28 rounded-full flex flex-col items-center justify-center"
        style={{ border: `3px solid ${color}`, transform: 'rotate(-4deg)', backgroundColor: color + '14' }}
      >
        <span className="font-mono font-bold text-3xl" style={{ color, lineHeight: 1 }}>{score}</span>
        <span className="text-xs font-mono" style={{ color }}>/ 100</span>
      </div>
      <span className="font-mono text-xs uppercase tracking-widest mt-2" style={{ color }}>{label}</span>
    </div>
  )
}

// ─── Share decision ───────────────────────────────────────────────────────────

function ShareDecision({ report, candidate, decision, onShare, onKeep }) {
  const [preview, setPreview] = useState(false)
  const shouldShare = report.overallScore >= 60

  if (decision) {
    return (
      <div className="border border-line rounded-card p-6 bg-parchment text-center mb-8">
        {decision === 'shared' ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[#F0FAF6] border border-verified/30 flex items-center justify-center mx-auto mb-3">
              <Check size={20} className="text-verified" strokeWidth={2.5} />
            </div>
            <p className="font-display font-bold text-ink text-lg mb-1">Badge added to your namecard.</p>
            <p className="text-sm text-slate">Employers can now see your SimuHire score and key observations.</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-parchment-shade border border-line flex items-center justify-center mx-auto mb-3">
              <Lock size={20} className="text-slate" />
            </div>
            <p className="font-display font-bold text-ink text-lg mb-1">Report kept private.</p>
            <p className="text-sm text-slate">Only you can see this report. You can share it after your next retake.</p>
          </>
        )}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-ink mt-4 underline">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="border-2 border-ink rounded-card p-6 bg-parchment mb-8">
      <h2 className="font-display font-bold text-ink text-xl mb-1">Add this to your namecard?</h2>
      <p className="text-sm text-slate mb-4 leading-relaxed">
        Sharing adds a SimuHire badge to your public namecard. Employers see your score and 3 key observations — not the full transcript or evidence quotes.
      </p>

      {/* Namecard preview toggle */}
      <button
        onClick={() => setPreview(!preview)}
        className="text-xs text-ink font-medium hover:underline mb-4 flex items-center gap-1"
      >
        {preview ? 'Hide' : 'Preview'} what employers see on your namecard
      </button>
      {preview && (
        <div className="mb-5 opacity-90 pointer-events-none scale-90 origin-top-left">
          <NamecardPremium candidate={candidate} />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onShare}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-card text-sm font-semibold transition-colors ${
            shouldShare
              ? 'bg-ink text-parchment hover:bg-opacity-90'
              : 'border border-line text-ink hover:bg-parchment-shade'
          }`}
        >
          <Check size={14} /> Share to Namecard
        </button>
        <button
          onClick={onKeep}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-card text-sm font-medium transition-colors ${
            shouldShare
              ? 'border border-line text-slate hover:bg-parchment-shade'
              : 'bg-ink text-parchment hover:bg-opacity-90'
          }`}
        >
          <Lock size={14} /> Keep Private
        </button>
      </div>
      {shouldShare && (
        <p className="text-xs text-slate text-center mt-3">
          Your score of {report.overallScore}/100 is above average — sharing it strengthens your namecard.
        </p>
      )}
      <p className="text-xs text-slate text-center mt-1">
        Retake available in 7 days. Your best score is always kept.
      </p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SimuHireReport() {
  const report = mockReport
  const { liveCandidate: candidate, markSimuHireShared } = useDemo()
  const { state } = useLocation()
  const duration = state?.duration ? `${Math.floor(state.duration / 60)} min` : mockReport.duration
  const [decision, setDecision] = useState(null)

  const handleShare = () => { markSimuHireShared(); setDecision('shared') }
  const handleKeep  = () => { setDecision('private') }

  const sorted   = [...report.dimensions].sort((a, b) => b.score - a.score)
  const topDim   = sorted[0]
  const lowDim   = sorted[sorted.length - 1]
  const scoreDelta = topDim.score - lowDim.score

  // Build radar dims object from array
  const radarDims = Object.fromEntries(report.dimensions.map(d => [d.name, d.score]))

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Back */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        {/* Emotional opener */}
        <div className="mb-8">
          <p className="text-xs font-mono text-slate uppercase tracking-wider mb-2">SimuHire Complete</p>
          <h1 className="font-display font-bold text-ink text-3xl mb-1">
            {report.type} Simulation — {duration}
          </h1>
          <p className="text-slate text-sm">{report.candidateName} · {report.completedAt}</p>
        </div>

        {/* Score + radar side by side */}
        <div className="border border-line rounded-card p-6 bg-parchment mb-6 flex items-center gap-8">
          <SimuHireScore score={report.overallScore} />
          <div className="flex-1">
            <RadarChart dims={radarDims} size={180} />
          </div>
          <div className="shrink-0 space-y-2">
            <div className="border border-verified/30 bg-[#F0FAF6] rounded-card px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp size={10} className="text-verified" />
                <p className="text-xs font-semibold text-verified uppercase tracking-wider">Strongest</p>
              </div>
              <p className="text-xs font-medium text-ink">{topDim.name}</p>
              <p className="text-xs font-mono text-slate">{topDim.score}/100</p>
            </div>
            {scoreDelta >= 8 && (
              <div className="border border-pending/30 bg-[#FFFBEB] rounded-card px-3 py-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <Minus size={10} className="text-pending" />
                  <p className="text-xs font-semibold text-pending uppercase tracking-wider">Weakness</p>
                </div>
                <p className="text-xs font-medium text-ink">{lowDim.name}</p>
                <p className="text-xs font-mono text-slate">{lowDim.score}/100</p>
              </div>
            )}
          </div>
        </div>

        {/* Share decision — FIRST before detailed breakdown */}
        <ShareDecision
          report={report}
          candidate={candidate}
          decision={decision}
          onShare={handleShare}
          onKeep={handleKeep}
        />

        {/* Key observations */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Key Observations</h2>
        <div className="border border-line rounded-card p-5 bg-parchment mb-6">
          <div className="space-y-3">
            {report.keyObservations.map((obs, i) => (
              <div key={i} className="flex gap-3">
                <span className="font-mono text-xs text-slate shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-sm text-ink leading-relaxed">{obs}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension breakdown — merged with evidence (one card per dimension) */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Dimension Breakdown</h2>
        <div className="space-y-3 mb-8">
          {report.dimensions.map(d => (
            <div key={d.name} className="border border-line rounded-card p-4 bg-parchment">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-ink">{d.name}</p>
                <span className="font-mono text-sm font-medium text-ink">{d.score}<span className="text-slate text-xs">/100</span></span>
              </div>
              <div className="h-1.5 bg-line rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${d.score}%`,
                    backgroundColor: d.score >= 80 ? '#1F7A5C' : d.score >= 60 ? '#2563EB' : d.score >= 40 ? '#D9A441' : '#C4503A',
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="shrink-0 text-xs text-verified font-mono mt-0.5 w-3">+</span>
                  <p className="text-xs text-ink leading-relaxed">{d.strength}</p>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0 text-xs text-pending font-mono mt-0.5 w-3">–</span>
                  <p className="text-xs text-slate leading-relaxed">{d.growth}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Growth CTA */}
        <div className="border border-line rounded-card p-5 bg-parchment-shade flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink mb-0.5">Retake in 7 days</p>
            <p className="text-xs text-slate">Focus on {lowDim.name.toLowerCase()} to push your overall score above {Math.min(report.overallScore + 8, 100)}.</p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-medium text-ink border border-line bg-parchment rounded-card px-3 py-1.5 hover:bg-parchment-shade transition-colors shrink-0"
          >
            Back to dashboard →
          </Link>
        </div>

      </div>
    </div>
  )
}

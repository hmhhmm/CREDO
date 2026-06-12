import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, Lock } from 'lucide-react'
import VerificationStamp from '../components/VerificationStamp'
import ReportDimensionRow from '../components/ReportDimensionRow'
import { mockReport } from '../data/mockData'

export default function SimuHireReport() {
  const report = mockReport
  const navigate = useNavigate()
  const [decision, setDecision] = useState(null)

  const handleShare = () => {
    setDecision('shared')
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  const handleKeep = () => {
    setDecision('private')
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs text-slate uppercase tracking-wider font-mono mb-1">SimuHire Report</p>
            <h1 className="font-display font-bold text-ink text-2xl">{report.candidateName}</h1>
            <p className="text-slate text-sm mt-1">
              {report.type} Simulation · {report.duration} · {report.completedAt}
            </p>
          </div>
          <Link to="/" className="font-display font-bold text-ink text-lg">CREDO</Link>
        </div>

        {/* Overall score */}
        <div className="border border-line rounded-card p-6 bg-parchment mb-6 flex items-center gap-6">
          <VerificationStamp score={report.overallScore} size="xl" />
          <div>
            <p className="text-xs text-slate uppercase tracking-wider mb-1">Overall Score</p>
            <p className="font-mono text-4xl font-medium text-ink">{report.overallScore}<span className="text-slate text-xl">/100</span></p>
            <p className="text-sm text-slate mt-1">Technical Behavioral Assessment</p>
          </div>
        </div>

        {/* Dimension breakdown */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Dimension Breakdown</h2>
        <div className="space-y-3 mb-6">
          {report.dimensions.map(d => <ReportDimensionRow key={d.name} dimension={d} />)}
        </div>

        {/* Key observations */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Key Observations</h2>
        <div className="border border-line rounded-card p-5 bg-parchment mb-8">
          <div className="space-y-3">
            {report.keyObservations.map((obs, i) => (
              <div key={i} className="flex gap-3">
                <span className="font-mono text-xs text-slate shrink-0 mt-0.5">0{i + 1}</span>
                <p className="text-sm text-ink leading-relaxed">{obs}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Share decision */}
        {!decision ? (
          <div className="border border-line rounded-card p-6 bg-parchment">
            <h2 className="font-display font-semibold text-ink text-lg mb-1">Share this report?</h2>
            <p className="text-sm text-slate mb-5 leading-relaxed">
              Sharing adds a SimuHire badge to your namecard. Employers can see your score and key observations — not the full transcript.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 bg-verified text-parchment py-3 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors"
              >
                <Check size={14} /> Share to Namecard
              </button>
              <button
                onClick={handleKeep}
                className="flex-1 flex items-center justify-center gap-2 border border-line text-ink py-3 rounded-card text-sm font-medium hover:bg-parchment-shade transition-colors"
              >
                <Lock size={14} /> Keep Private
              </button>
            </div>
            <p className="text-xs text-slate text-center mt-4">
              You can retake this simulation in 7 days. Your best score is kept.
            </p>
          </div>
        ) : (
          <div className="border border-line rounded-card p-6 bg-parchment text-center">
            {decision === 'shared' ? (
              <>
                <Check size={24} className="text-verified mx-auto mb-2" />
                <p className="font-medium text-ink">Shared to your namecard.</p>
                <p className="text-sm text-slate mt-1">Redirecting to dashboard…</p>
              </>
            ) : (
              <>
                <Lock size={24} className="text-slate mx-auto mb-2" />
                <p className="font-medium text-ink">Report kept private.</p>
                <p className="text-sm text-slate mt-1">Redirecting to dashboard…</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

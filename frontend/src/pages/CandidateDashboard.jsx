import { Link } from 'react-router-dom'
import { GitBranch, FileText, Award, PlayCircle, ArrowRight } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import VerificationStamp from '../components/VerificationStamp'
import NamecardCard from '../components/NamecardCard'
import { mockCurrentCandidate } from '../data/mockData'

export default function CandidateDashboard() {
  const candidate = mockCurrentCandidate

  const artifactTypes = [
    {
      key: 'github',
      icon: GitBranch,
      label: 'GitHub',
      desc: 'Verify your code repositories',
      status: 'verified',
      summary: '47 commits · High complexity · No flags · 94/100 Verified ✓',
    },
    {
      key: 'document',
      icon: FileText,
      label: 'Documents',
      desc: 'Verify reports, essays, research papers',
      status: 'verified',
      summary: 'AI probability 8% · High writing complexity · 78/100 Verified ✓',
    },
    {
      key: 'credential',
      icon: Award,
      label: 'Credentials',
      desc: 'Verify certificates and awards',
      status: 'verified',
      summary: 'AWS Developer · Issuer matched · Name matched · 90/100 Verified ✓',
    },
  ]

  const statusConfig = {
    verified: { dot: 'bg-verified', label: 'Verified', text: 'text-verified' },
    pending: { dot: 'bg-pending', label: 'Pending', text: 'text-pending' },
    empty: { dot: 'bg-line', label: 'Not started', text: 'text-slate' },
  }

  return (
    <div className="flex min-h-screen bg-parchment">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Status banner */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-ink text-3xl mb-1">
              Welcome back, {candidate.name.split(' ')[0]}
            </h1>
            <p className="text-slate text-sm">Your CREDO profile is live.</p>
          </div>
          <div className="flex items-center gap-6 border border-line rounded-card px-6 py-4 bg-parchment">
            <VerificationStamp score={candidate.trustScore} size="lg" />
            <div>
              <p className="text-xs text-slate uppercase tracking-wider mb-1">Verified Artifacts</p>
              <p className="font-mono text-2xl font-medium text-ink">{candidate.artifacts.length}</p>
            </div>
          </div>
        </div>

        {/* Verification grid */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Verification Status</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {artifactTypes.map(({ key, icon: Icon, label, desc, status, summary }) => {
            const cfg = statusConfig[status]
            return (
              <div key={key} className="border border-line rounded-card p-5 bg-parchment">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-full bg-parchment-shade border border-line flex items-center justify-center">
                    <Icon size={16} className="text-slate" />
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <h3 className="font-semibold text-ink text-sm mb-0.5">{label}</h3>
                <p className="text-xs text-slate mb-3">{desc}</p>
                {status === 'verified' && summary && (
                  <p className="text-xs font-mono text-verified leading-relaxed">{summary}</p>
                )}
                {status === 'empty' && (
                  <Link
                    to="/dashboard/verify"
                    className="inline-flex items-center gap-1 text-xs text-ink font-medium hover:underline"
                  >
                    Connect <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* SimuHire card */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">SimuHire</h2>
        <div className="border border-line rounded-card p-5 bg-parchment mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-parchment-shade border border-line flex items-center justify-center">
              <PlayCircle size={18} className="text-slate" />
            </div>
            <div>
              <p className="font-semibold text-ink text-sm">Technical Simulation · Completed</p>
              <p className="text-xs text-slate">Overall Score: <span className="font-mono text-ink">82/100</span> · Shared to namecard</p>
            </div>
          </div>
          <Link
            to="/simuhire/session-demo/report"
            className="text-xs text-ink font-medium border border-line rounded-card px-3 py-1.5 hover:bg-parchment-shade transition-colors"
          >
            View report
          </Link>
        </div>

        {/* Namecard preview */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Namecard Preview</h2>
        <div className="flex justify-start">
          <NamecardCard candidate={candidate} isOwn />
        </div>
      </main>
    </div>
  )
}

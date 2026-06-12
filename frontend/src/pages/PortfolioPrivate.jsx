import { useState } from 'react'
import { Copy, Check, Shield, GitBranch, FileText, Award } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import VerificationStamp from '../components/VerificationStamp'
import ArtifactCard from '../components/ArtifactCard'
import LedgerEntry from '../components/LedgerEntry'
import { mockCurrentCandidate } from '../data/mockData'

const typeIcons = { github: GitBranch, document: FileText, credential: Award }

export default function PortfolioPrivate() {
  const candidate = mockCurrentCandidate
  const [copied, setCopied] = useState(false)
  const [ledgerOpen, setLedgerOpen] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://credo.app/portfolio/${candidate.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen bg-parchment">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-parchment-shade border border-line flex items-center justify-center">
              <span className="font-display font-bold text-ink text-lg">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="font-display font-bold text-ink text-2xl">{candidate.name}</h1>
              <p className="text-slate text-sm">{candidate.university} · Graduating {candidate.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VerificationStamp score={candidate.trustScore} size="md" />
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 border border-line rounded-card px-4 py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium"
            >
              {copied ? <Check size={13} className="text-verified" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Share Portfolio'}
            </button>
          </div>
        </div>

        {/* Artifacts */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Verified Artifacts</h2>
        <div className="space-y-2 mb-8">
          {candidate.artifacts.length > 0
            ? candidate.artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)
            : <p className="text-sm text-slate py-4">Connect GitHub or upload documents to start building your portfolio.</p>
          }
        </div>

        {/* Timeline */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">Career Timeline</h2>
        <div className="relative mb-8">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-line" />
          {candidate.artifacts.map((a, i) => {
            const Icon = typeIcons[a.type] || FileText
            return (
              <div key={a.id} className="flex items-start gap-4 mb-4 relative">
                <div className="w-6 h-6 rounded-full bg-parchment border-2 border-line flex items-center justify-center shrink-0 z-10">
                  <Icon size={11} className="text-slate" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-ink">{a.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate font-mono">{a.date}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#F0FAF6] border border-verified/30 text-verified font-mono">
                      {a.confidence}/100
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ledger integrity */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Credential Ledger</h2>
        <div className="border border-line rounded-card bg-parchment p-5">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={16} className="text-verified" />
            <div className="flex-1">
              <p className="text-xs text-slate uppercase tracking-wider mb-0.5">Current Merkle Root</p>
              <p className="font-mono text-xs text-ink">{candidate.merkleRoot}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate">Total entries</p>
              <p className="font-mono font-medium text-ink">{candidate.ledger.length}</p>
            </div>
          </div>
          <button
            onClick={() => setLedgerOpen(!ledgerOpen)}
            className="text-xs text-ink font-medium hover:underline"
          >
            {ledgerOpen ? 'Hide' : 'View'} audit trail
          </button>
          {ledgerOpen && (
            <div className="mt-3 border-t border-line pt-3">
              <div className="grid grid-cols-4 gap-2 mb-2">
                {['Block', 'Leaf Hash', 'Prev Hash', 'Timestamp'].map(h => (
                  <span key={h} className="text-xs font-semibold text-slate uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {candidate.ledger.map(entry => <LedgerEntry key={entry.blockIndex} entry={entry} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

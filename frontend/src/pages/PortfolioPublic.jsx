import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, Mail, FileText, Award, X } from 'lucide-react'
import GitHubIcon from '../components/GitHubIcon'
import VerificationStamp from '../components/VerificationStamp'
import ArtifactCard from '../components/ArtifactCard'
import LedgerEntry from '../components/LedgerEntry'
import NotFound from './NotFound'
import { mockCandidates } from '../data/mockData'
import { getConfidenceBand } from '../utils/confidenceBand'

const typeIcons = { github: GitHubIcon, document: FileText, credential: Award }

export default function PortfolioPublic() {
  const { userId } = useParams()
  const candidate = mockCandidates.find(c => c.id === userId)
  const [contactVisible, setContactVisible] = useState(false)
  const [ledgerOpen, setLedgerOpen] = useState(false)

  if (!candidate) return <NotFound />
  const verifiedArtifacts = candidate.artifacts.filter(a => a.status === 'verified')

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-2xl mx-auto px-6 py-10">
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
              <p className="text-slate text-sm">{candidate.field} · {candidate.university} · {candidate.year}</p>
            </div>
          </div>
          <VerificationStamp score={candidate.trustScore} size="md" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setContactVisible(!contactVisible)}
            className="flex items-center gap-2 border border-line rounded-card px-4 py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium"
          >
            <Mail size={13} /> {contactVisible ? 'Hide contact' : 'Request contact'}
          </button>
          <Link
            to={`/card/${userId}`}
            className="flex items-center gap-2 border border-line rounded-card px-4 py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium"
          >
            View Namecard
          </Link>
        </div>

        {contactVisible && (
          <div className="mb-6 px-4 py-3 bg-parchment-shade border border-line rounded-card flex items-center justify-between">
            <p className="text-sm text-ink font-mono">{candidate.name.toLowerCase().replace(' ', '.')}@email.com</p>
            <button onClick={() => setContactVisible(false)} className="text-slate hover:text-ink ml-3">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Verified Artifacts */}
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Verified Artifacts</h2>
        <div className="space-y-2 mb-8">
          {verifiedArtifacts.length > 0
            ? verifiedArtifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)
            : <p className="text-sm text-slate py-4">No verified artifacts yet.</p>
          }
        </div>

        {/* Timeline — verified only, correct band colors */}
        {verifiedArtifacts.length > 0 && (
          <>
            <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">Career Timeline</h2>
            <div className="relative mb-8">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-line" />
              {verifiedArtifacts.map(a => {
                const Icon = typeIcons[a.type] || FileText
                const band = getConfidenceBand(a.confidence)
                return (
                  <div key={a.id} className="flex items-start gap-4 mb-4 relative">
                    <div className="w-6 h-6 rounded-full bg-parchment border-2 border-line flex items-center justify-center shrink-0 z-10">
                      <Icon size={11} className="text-slate" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{a.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate font-mono">{a.date}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-mono border"
                          style={{ color: band.hex, borderColor: band.hex + '40', backgroundColor: band.hex + '12' }}
                        >
                          {a.confidence}/100
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Ledger */}
        {candidate.ledger.length > 0 && (
          <>
            <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Credential Ledger</h2>
            <div className="border border-line rounded-card bg-parchment p-5 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={16} className="text-verified" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate uppercase tracking-wider mb-0.5">Merkle Root</p>
                  <p className="font-mono text-xs text-ink truncate">{candidate.merkleRoot}</p>
                </div>
              </div>
              <button onClick={() => setLedgerOpen(!ledgerOpen)} className="text-xs text-ink font-medium hover:underline">
                {ledgerOpen ? 'Hide' : 'View'} audit trail
              </button>
              {ledgerOpen && (
                <div className="mt-3 border-t border-line pt-3 overflow-x-auto">
                  <div className="grid grid-cols-4 gap-2 mb-2 min-w-[480px]">
                    {['Block', 'Leaf Hash', 'Prev Hash', 'Timestamp'].map(h => (
                      <span key={h} className="text-xs font-semibold text-slate uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                  <div className="min-w-[480px]">
                    {candidate.ledger.map(entry => <LedgerEntry key={entry.blockIndex} entry={entry} />)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-line pt-6 flex items-center justify-between">
          <p className="text-xs font-mono text-slate">
            Verified by CREDO · {candidate.merkleRoot?.slice(0, 16)}…
          </p>
          <Link
            to="/register"
            className="text-xs text-ink font-medium border border-line rounded-card px-3 py-1.5 hover:bg-parchment-shade transition-colors"
          >
            Build your CREDO →
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Copy, Check, Shield, GitBranch, FileText, Award, Lock, Globe, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import VerificationStamp from '../components/VerificationStamp'
import ArtifactCard from '../components/ArtifactCard'
import LedgerEntry from '../components/LedgerEntry'
import { getConfidenceBand } from '../utils/confidenceBand'
import { useDemo } from '../context/DemoContext'

const typeIcons = { github: GitBranch, document: FileText, credential: Award }

export default function PortfolioPrivate() {
  const { liveCandidate: candidate } = useDemo()
  const [copied, setCopied] = useState(false)
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const [visibility, setVisibility] = useState('public') // 'public' | 'private'

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://credo.app/portfolio/${candidate.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const verifiedArtifacts = candidate.artifacts.filter(a => a.status === 'verified')
  const pendingArtifacts = candidate.artifacts.filter(a => a.status === 'pending')

  return (
    <div className="flex min-h-screen bg-parchment">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl">

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
            <VerificationStamp score={candidate.trustScore} size="md" />
          </div>

          {/* Visibility + share bar */}
          <div className="flex items-center justify-between bg-parchment-shade border border-line rounded-card px-4 py-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-parchment border border-line rounded-full p-0.5">
                <button
                  onClick={() => setVisibility('public')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${visibility === 'public' ? 'bg-ink text-parchment' : 'text-slate'}`}
                >
                  <Globe size={11} /> Public
                </button>
                <button
                  onClick={() => setVisibility('private')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${visibility === 'private' ? 'bg-ink text-parchment' : 'text-slate'}`}
                >
                  <Lock size={11} /> Private
                </button>
              </div>
              <p className="text-xs text-slate">
                {visibility === 'public' ? 'Anyone with the link can view your verified artifacts.' : 'Only you can see this portfolio.'}
              </p>
            </div>
            {visibility === 'public' && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-ink font-medium border border-line rounded-card px-3 py-1.5 hover:bg-parchment transition-colors shrink-0"
              >
                {copied ? <Check size={11} className="text-verified" strokeWidth={3} /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            )}
          </div>

          {/* Verified Artifacts */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate uppercase tracking-wider">
              Verified Artifacts <span className="font-mono normal-case text-slate ml-1">({verifiedArtifacts.length})</span>
            </h2>
            <Link to="/dashboard/verify" className="text-xs text-ink font-medium hover:underline flex items-center gap-1">
              Add artifacts <ArrowRight size={10} />
            </Link>
          </div>

          <div className="space-y-2 mb-4">
            {verifiedArtifacts.length > 0
              ? verifiedArtifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)
              : (
                <div className="border border-dashed border-line rounded-card p-6 text-center">
                  <p className="text-sm text-slate mb-3">No verified artifacts yet.</p>
                  <Link
                    to="/dashboard/verify"
                    className="inline-flex items-center gap-1.5 text-xs bg-ink text-parchment px-4 py-2 rounded-card font-medium hover:bg-opacity-90 transition-colors"
                  >
                    Start verifying <ArrowRight size={11} />
                  </Link>
                </div>
              )
            }
          </div>

          {pendingArtifacts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FFFBEB] border border-pending/30 rounded-card mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-pending inline-block" />
              <p className="text-xs text-pending font-mono">
                {pendingArtifacts.length} artifact{pendingArtifacts.length !== 1 ? 's' : ''} still processing — they will appear here when verified.
              </p>
            </div>
          )}

          {/* Career Timeline — verified only */}
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
                      <div className="pb-4">
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

          {/* Credential Ledger */}
          <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Credential Ledger</h2>
          <div className="border border-line rounded-card bg-parchment p-5">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={16} className="text-verified" />
              <div className="flex-1">
                <p className="text-xs text-slate uppercase tracking-wider mb-0.5">Current Merkle Root</p>
                <p className="font-mono text-xs text-ink">{candidate.merkleRoot}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate">Entries</p>
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
        </div>
      </main>
    </div>
  )
}

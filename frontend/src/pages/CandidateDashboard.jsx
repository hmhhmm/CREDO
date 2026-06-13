import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GitBranch, FileText, Award, PlayCircle, ArrowRight,
  Copy, Check, ChevronRight, Lock, ExternalLink, Loader2,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import VerificationStamp from '../components/VerificationStamp'
import NamecardPremium from '../components/NamecardPremium'
import { getConfidenceBand } from '../utils/confidenceBand'
import { useDemo } from '../context/DemoContext'

// ─── Journey state helpers ───────────────────────────────────────────────────

function deriveJourneyState(candidate) {
  const verifiedArtifacts = candidate.artifacts.filter(a => a.status === 'verified')
  const pendingArtifacts  = candidate.artifacts.filter(a => a.status === 'pending')
  const verifiedCount = verifiedArtifacts.length
  const simuHireDone  = !!candidate.simuHire?.completed
  const simuHireShared = !!candidate.simuHire?.shared

  let activeStep = 'prove'
  if (verifiedCount >= 1 && !simuHireDone) activeStep = 'perform'
  if (simuHireDone && !simuHireShared)      activeStep = 'decide'
  if (simuHireDone && simuHireShared)       activeStep = 'complete'

  return { verifiedArtifacts, pendingArtifacts, verifiedCount, simuHireDone, simuHireShared, activeStep }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function JourneyPill({ number, label, state, count, total }) {
  // state: 'done' | 'active' | 'locked'
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      state === 'done'   ? 'bg-[#F0FAF6] border border-verified/30 text-verified' :
      state === 'active' ? 'bg-ink text-parchment' :
                           'bg-parchment-shade border border-line text-slate opacity-50'
    }`}>
      {state === 'done'
        ? <Check size={10} strokeWidth={3} />
        : state === 'locked'
        ? <Lock size={9} />
        : <span className="font-mono">{number}</span>
      }
      {label}
      {count !== undefined && (
        <span className={`font-mono ${state === 'active' ? 'text-parchment/70' : 'opacity-60'}`}>
          {count}/{total}
        </span>
      )}
    </div>
  )
}

const artifactDefs = [
  { key: 'github',     icon: GitBranch, label: 'GitHub',      hint: 'Commit authenticity + code complexity' },
  { key: 'document',   icon: FileText,  label: 'Document',    hint: 'AI probability + authorship consistency' },
  { key: 'credential', icon: Award,     label: 'Credential',  hint: 'Certificate OCR + issuer match' },
]

function SpotlightProve({ candidate, verifiedCount, pendingCount }) {
  const allVerified = verifiedCount === 3

  return (
    <div className="border-2 border-ink rounded-card p-6 bg-parchment mb-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-mono text-slate uppercase tracking-wider mb-1">Step 1 · Prove</p>
          <h2 className="font-display font-bold text-ink text-xl">
            {verifiedCount === 0
              ? 'Start by proving your skills'
              : allVerified
              ? 'All artifacts verified — ready for SimuHire'
              : `${verifiedCount}/3 artifact${verifiedCount !== 1 ? 's' : ''} verified — keep going`}
          </h2>
          <p className="text-sm text-slate mt-1">
            Each artifact you verify increases your trust score. Employers see the evidence, not just the claim.
          </p>
        </div>
        <VerificationStamp score={candidate.trustScore} size="md" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {artifactDefs.map(({ key, icon: Icon, label, hint }) => {
          const artifact = candidate.artifacts.find(a => a.type === key)
          const status = artifact?.status || 'empty'
          const band = status === 'verified' ? getConfidenceBand(artifact.confidence) : null

          return (
            <div key={key} className={`rounded-card border p-4 ${
              status === 'verified' ? 'border-verified/30 bg-[#F0FAF6]' :
              status === 'pending'  ? 'border-pending/30 bg-[#FFFBEB]' :
                                      'border-line bg-parchment-shade'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={14} className={status === 'verified' ? 'text-verified' : status === 'pending' ? 'text-pending' : 'text-slate'} />
                {status === 'verified' && <Check size={11} className="text-verified" strokeWidth={3} />}
                {status === 'pending'  && <Loader2 size={11} className="text-pending animate-spin" />}
              </div>
              <p className="text-xs font-semibold text-ink mb-0.5">{label}</p>
              {status === 'verified' && (
                <p className="text-xs font-mono" style={{ color: band.hex }}>{artifact.confidence}/100</p>
              )}
              {status === 'pending' && (
                <p className="text-xs text-pending font-mono">Analysing…</p>
              )}
              {status === 'empty' && (
                <p className="text-xs text-slate">{hint}</p>
              )}
            </div>
          )
        })}
      </div>

      <Link
        to="/dashboard/verify"
        className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-2.5 rounded-card text-sm font-semibold hover:bg-opacity-90 transition-colors"
      >
        {verifiedCount === 0 ? 'Connect your first artifact' : 'Add more artifacts'} <ArrowRight size={13} />
      </Link>
    </div>
  )
}

const simuHireTypes = [
  { key: 'technical', label: 'Technical',      desc: 'Broken-system scenario · CS, Engineering, Data Science' },
  { key: 'business',  label: 'Business Case',  desc: 'Crisis memo + strategy · Business, Finance, Management' },
  { key: 'general',   label: 'General',        desc: 'Situational questions · Any field' },
]

function SpotlightPerform({ verifiedCount }) {
  const [selected, setSelected] = useState('technical')

  return (
    <div className="border-2 border-ink rounded-card p-6 bg-parchment mb-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs font-mono text-slate uppercase tracking-wider mb-1">Step 2 · Perform</p>
          <h2 className="font-display font-bold text-ink text-xl">You're ready for SimuHire</h2>
          <p className="text-sm text-slate mt-1">
            20–30 min AI simulation. Four agents evaluate your behavioral traits and generate a report that adds a badge to your namecard.
          </p>
        </div>
        <div className="shrink-0 w-10 h-10 rounded-full bg-parchment-shade border border-line flex items-center justify-center">
          <PlayCircle size={18} className="text-ink" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 my-5">
        {simuHireTypes.map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`p-3 rounded-card border text-left transition-colors ${
              selected === key ? 'border-ink bg-parchment-shade' : 'border-line hover:border-slate'
            }`}
          >
            <p className={`text-xs font-semibold mb-0.5 ${selected === key ? 'text-ink' : 'text-slate'}`}>{label}</p>
            <p className="text-xs text-slate leading-snug">{desc}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/simuhire/session-demo"
          className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-2.5 rounded-card text-sm font-semibold hover:bg-opacity-90 transition-colors"
        >
          Start {simuHireTypes.find(t => t.key === selected)?.label} SimuHire <ArrowRight size={13} />
        </Link>
        <p className="text-xs text-slate">20–30 min · retake in 7 days · your best score is kept</p>
      </div>
    </div>
  )
}

function SpotlightDecide({ candidate }) {
  const score = candidate.simuHire?.overallScore || 0

  return (
    <div className="border-2 border-ink rounded-card p-6 bg-parchment mb-6">
      <p className="text-xs font-mono text-slate uppercase tracking-wider mb-1">Step 3 · Share decision</p>
      <h2 className="font-display font-bold text-ink text-xl mb-1">
        SimuHire complete — {score}/100
      </h2>
      <p className="text-sm text-slate mb-5">
        Review your Behavioral Traits Report and decide whether to add the badge to your namecard.
        Employers can only see it if you share.
      </p>
      <div className="flex gap-3">
        <Link
          to="/simuhire/session-demo/report"
          className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-2.5 rounded-card text-sm font-semibold hover:bg-opacity-90 transition-colors"
        >
          View report and decide <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

function SpotlightComplete({ candidate, copied, onCopy }) {
  return (
    <div className="border-2 border-verified/40 rounded-card p-6 bg-[#F0FAF6] mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-verified uppercase tracking-wider mb-1">Complete</p>
          <h2 className="font-display font-bold text-ink text-xl">Your CREDO is live</h2>
          <p className="text-sm text-slate mt-1">
            Share your namecard link with employers. They'll see verified proof, not claims.
          </p>
        </div>
        <VerificationStamp score={candidate.trustScore} size="md" />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-2.5 rounded-card text-sm font-semibold hover:bg-opacity-90 transition-colors"
        >
          {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
          {copied ? 'Link copied!' : 'Copy namecard link'}
        </button>
        <Link
          to={`/card/${candidate.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink font-medium hover:underline"
        >
          <ExternalLink size={13} /> Preview as employer
        </Link>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CandidateDashboard() {
  const { liveCandidate: candidate, reset } = useDemo()
  const [copied, setCopied] = useState(false)

  const {
    verifiedArtifacts, pendingArtifacts, verifiedCount,
    simuHireDone, simuHireShared, activeStep,
  } = deriveJourneyState(candidate)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://credo.app/card/${candidate.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const proveState   = verifiedCount >= 1 ? 'done' : activeStep === 'prove' ? 'active' : 'locked'
  const performState = simuHireDone ? 'done' : (activeStep === 'perform' || activeStep === 'decide') ? 'active' : 'locked'
  const presentState = simuHireShared ? 'done' : activeStep === 'complete' ? 'active' : 'locked'

  return (
    <div className="flex min-h-screen bg-parchment">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl">

          {/* Header */}
          <div className="flex items-start gap-5 mb-6 pb-6 border-b border-line">
            <VerificationStamp score={candidate.trustScore} size="lg" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <h1 className="font-display font-bold text-ink text-3xl">{candidate.name}</h1>
                <button
                  onClick={reset}
                  className="text-xs text-slate border border-line rounded-card px-3 py-1.5 hover:bg-parchment-shade transition-colors font-mono shrink-0"
                  title="Reset to fresh state for demo"
                >
                  ↺ Reset demo
                </button>
              </div>
              <p className="text-slate text-sm mb-4">
                {candidate.field} · {candidate.university} · {candidate.year}
              </p>
              {/* Journey pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <JourneyPill number="1" label="Prove"   state={proveState}   count={verifiedCount} total={3} />
                <ChevronRight size={11} className="text-line shrink-0" />
                <JourneyPill number="2" label="Perform" state={performState} />
                <ChevronRight size={11} className="text-line shrink-0" />
                <JourneyPill number="3" label="Present" state={presentState} />
              </div>
            </div>
          </div>

          {/* Active spotlight — drives the journey */}
          {activeStep === 'prove' && (
            <SpotlightProve
              candidate={candidate}
              verifiedCount={verifiedCount}
              pendingCount={pendingArtifacts.length}
            />
          )}
          {activeStep === 'perform' && (
            <SpotlightPerform verifiedCount={verifiedCount} />
          )}
          {activeStep === 'decide' && (
            <SpotlightDecide candidate={candidate} />
          )}
          {activeStep === 'complete' && (
            <SpotlightComplete candidate={candidate} copied={copied} onCopy={handleCopyLink} />
          )}

          {/* Prove summary — shown once at least 1 artifact is verified (collapsed when not active step) */}
          {verifiedCount > 0 && activeStep !== 'prove' && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate uppercase tracking-wider flex items-center gap-1.5">
                  <Check size={10} className="text-verified" strokeWidth={3} /> Verified Artifacts
                </h2>
                <Link to="/dashboard/verify" className="text-xs text-ink font-medium hover:underline">
                  Manage →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {artifactDefs.map(({ key, icon: Icon, label }) => {
                  const artifact = verifiedArtifacts.find(a => a.type === key)
                  const band = artifact ? getConfidenceBand(artifact.confidence) : null
                  return (
                    <div key={key} className={`border rounded-card p-3 ${artifact ? 'border-verified/30 bg-[#F0FAF6]' : 'border-line bg-parchment-shade'}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon size={12} className={artifact ? 'text-verified' : 'text-slate'} />
                        <span className="text-xs font-medium text-ink">{label}</span>
                      </div>
                      {artifact ? (
                        <>
                          <div className="h-0.5 bg-line rounded-full overflow-hidden mb-1">
                            <div className="h-full rounded-full" style={{ width: `${artifact.confidence}%`, backgroundColor: band.hex }} />
                          </div>
                          <p className="text-xs font-mono" style={{ color: band.hex }}>{artifact.confidence}/100</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate">Not verified</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* SimuHire summary — shown once complete */}
          {simuHireDone && activeStep !== 'decide' && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate uppercase tracking-wider flex items-center gap-1.5">
                  <Check size={10} className="text-verified" strokeWidth={3} /> SimuHire
                </h2>
                <Link to="/simuhire/session-demo/report" className="text-xs text-ink font-medium hover:underline">
                  View report →
                </Link>
              </div>
              <div className="border border-line rounded-card p-4 bg-parchment flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F0FAF6] border border-verified/30 flex items-center justify-center shrink-0">
                    <PlayCircle size={16} className="text-verified" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {candidate.simuHire?.type} Simulation
                      {simuHireShared
                        ? <span className="ml-2 text-xs font-mono text-verified font-normal">· Shared to namecard</span>
                        : <span className="ml-2 text-xs font-mono text-slate font-normal">· Private</span>
                      }
                    </p>
                    <p className="text-xs text-slate font-mono mt-0.5">
                      Score: {candidate.simuHire?.overallScore}/100 · Retake available in 5 days
                    </p>
                  </div>
                </div>
                <Link
                  to="/simuhire/session-demo"
                  className="text-xs text-slate border border-line rounded-card px-3 py-1.5 hover:bg-parchment-shade transition-colors shrink-0"
                >
                  Retake
                </Link>
              </div>
            </section>
          )}

          {/* Namecard — the earned output */}
          {(verifiedCount > 0 || simuHireDone) && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate uppercase tracking-wider">Your Namecard</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-xs font-medium text-ink border border-line rounded-card px-3 py-1.5 hover:bg-parchment-shade transition-colors"
                  >
                    {copied ? <Check size={10} strokeWidth={3} className="text-verified" /> : <Copy size={10} />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                  <Link
                    to="/dashboard/namecard"
                    className="text-xs font-medium text-ink border border-line rounded-card px-3 py-1.5 hover:bg-parchment-shade transition-colors"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
              <NamecardPremium candidate={candidate} />
            </section>
          )}

        </div>
      </main>
    </div>
  )
}

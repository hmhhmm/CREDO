import { useState } from 'react'
import { Copy, Check, Pencil, Lock, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import NamecardPremium from '../components/NamecardPremium'
import { mockCurrentCandidate } from '../data/mockData'

export default function NamecardOwn() {
  const candidate = mockCurrentCandidate
  const [copied, setCopied] = useState(false)
  const [saveState, setSaveState] = useState('idle') // 'idle' | 'saving' | 'saved'

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://credo.app/card/${candidate.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    setSaveState('saving')
    setTimeout(() => {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    }, 900)
  }

  const lockedFields = [
    { label: 'Trust score', note: `${candidate.trustScore}/100` },
    { label: 'Verified skills', note: `${candidate.verifiedSkills.length} skills` },
    { label: 'SimuHire badge', note: candidate.simuHire?.completed ? `${candidate.simuHire.overallScore}/100` : 'Not yet completed' },
    { label: 'Artifact confidence', note: `${candidate.artifacts.filter(a => a.status === 'verified').length} verified` },
  ]

  return (
    <div className="flex min-h-screen bg-parchment">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-ink text-3xl mb-1">Your Namecard</h1>
            <p className="text-slate text-sm">Shareable · auto-generated from verified data · scannable in 10 seconds</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/card/${candidate.id}`}
              className="flex items-center gap-1.5 text-sm text-slate hover:text-ink transition-colors"
            >
              <ExternalLink size={13} /> Employer view
            </Link>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 border border-line rounded-card px-4 py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium"
            >
              {copied ? <Check size={13} className="text-verified" strokeWidth={3} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Namecard preview */}
          <div className="flex-shrink-0">
            <p className="text-xs font-mono text-slate mb-3 text-center">Live preview · click to flip</p>
            <NamecardPremium candidate={candidate} />
          </div>

          {/* Edit + locked panels */}
          <div className="flex-1 min-w-0 max-w-sm space-y-4">

            {/* Editable fields */}
            <div className="border border-line rounded-card bg-parchment p-5">
              <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Pencil size={11} /> Editable Fields
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Bio / Headline', value: candidate.bio, type: 'textarea' },
                  { label: 'LinkedIn URL', value: candidate.linkedinUrl, type: 'url' },
                  { label: 'GitHub URL', value: candidate.githubUrl, type: 'url' },
                  { label: 'Location', value: candidate.location, type: 'input' },
                ].map(({ label, value, type }) => (
                  <div key={label}>
                    <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">{label}</label>
                    {type === 'textarea' ? (
                      <textarea
                        defaultValue={value}
                        className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink resize-none"
                        rows={2}
                      />
                    ) : (
                      <input
                        type={type === 'url' ? 'url' : 'text'}
                        defaultValue={value || ''}
                        placeholder={type === 'url' ? 'https://' : ''}
                        className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink font-mono"
                      />
                    )}
                  </div>
                ))}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={candidate.openToWork} className="rounded" />
                    <span className="text-sm text-ink font-medium">Open to Work</span>
                  </label>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saveState === 'saving'}
                  className={`w-full py-2 rounded-card text-sm font-medium transition-all ${
                    saveState === 'saved'
                      ? 'bg-verified text-parchment'
                      : 'bg-ink text-parchment hover:bg-opacity-90'
                  } disabled:opacity-60`}
                >
                  {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save changes'}
                </button>
              </div>
            </div>

            {/* Locked fields — explicit list */}
            <div className="border border-line rounded-card bg-parchment p-4">
              <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Lock size={11} /> Locked Fields
              </h2>
              <div className="space-y-2">
                {lockedFields.map(f => (
                  <div key={f.label} className="flex items-center justify-between py-1 border-b border-line last:border-0">
                    <span className="text-xs text-slate">{f.label}</span>
                    <span className="text-xs font-mono text-ink">{f.note}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate mt-3 leading-relaxed">
                These fields are auto-generated from verified artifacts and cannot be manually edited.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

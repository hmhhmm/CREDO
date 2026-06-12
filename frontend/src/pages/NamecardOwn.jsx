import { useState } from 'react'
import { Copy, Check, Pencil } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import NamecardCard from '../components/NamecardCard'
import { mockCurrentCandidate } from '../data/mockData'

export default function NamecardOwn() {
  const candidate = mockCurrentCandidate
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://credo.app/card/${candidate.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 border border-line rounded-card px-4 py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium"
            >
              {copied ? <Check size={13} className="text-verified" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Namecard */}
          <div className="flex-shrink-0">
            <NamecardCard candidate={candidate} isOwn />
          </div>

          {/* Edit panel for editable fields */}
          <div className="flex-1 min-w-0 max-w-sm">
            <div className="border border-line rounded-card bg-parchment p-5">
              <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Pencil size={11} /> Editable Fields
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Bio / Headline', value: candidate.bio, type: 'textarea' },
                  { label: 'LinkedIn URL', value: candidate.linkedinUrl, type: 'input' },
                  { label: 'GitHub URL', value: candidate.githubUrl, type: 'input' },
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
                        defaultValue={value || ''}
                        className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink"
                      />
                    )}
                  </div>
                ))}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={candidate.openToWork} />
                    <span className="text-sm text-ink font-medium">Open to Work</span>
                  </label>
                </div>
                <button className="w-full bg-ink text-parchment py-2 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors">
                  Save changes
                </button>
              </div>
            </div>

            {/* Locked fields notice */}
            <div className="mt-4 border border-line rounded-card bg-parchment p-4">
              <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Locked Fields</p>
              <p className="text-xs text-slate leading-relaxed">
                Trust score, verified skill scores, SimuHire badge, and credential data are auto-generated from verified artifacts and cannot be edited.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

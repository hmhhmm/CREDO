import { useState } from 'react'
import { GitBranch, FileText, Award, Upload, Check, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { mockCurrentCandidate } from '../data/mockData'

export default function VerifyPage() {
  const candidate = mockCurrentCandidate
  const [githubState, setGithubState] = useState('verified')
  const [docState, setDocState] = useState('pending')
  const [credState, setCredState] = useState('empty')

  const sections = [
    {
      key: 'github',
      icon: GitBranch,
      label: 'GitHub Repositories',
      desc: 'We analyse commit authenticity, code complexity via AST parsing, and originality signals.',
      state: githubState,
      setState: setGithubState,
      verifiedSummary: '47 commits · High complexity · No flags · 94/100 Verified ✓',
      pendingText: 'Analysing commits and code structure...',
      repos: ['ml-pipeline-optimizer', 'data-viz-dashboard', 'fastapi-boilerplate'],
    },
    {
      key: 'document',
      icon: FileText,
      label: 'Documents',
      desc: 'Upload a research paper, report, or essay. We check AI probability, writing complexity, and authorship consistency.',
      state: docState,
      setState: setDocState,
      verifiedSummary: 'AI probability 8% · Writing complexity 82 · 78/100 Verified ✓',
      pendingText: 'Analysing document authorship and writing style...',
    },
    {
      key: 'credential',
      icon: Award,
      label: 'Credentials',
      desc: 'Add a certificate, award, or transcript. OCR extracts issuer, name, and date for registry matching.',
      state: credState,
      setState: setCredState,
      verifiedSummary: 'AWS Developer · Issuer matched · Name matched · 90/100 Verified ✓',
      pendingText: 'Running OCR and verifying issuer against registry...',
    },
  ]

  return (
    <div className="flex min-h-screen bg-parchment">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto max-w-2xl">
        <h1 className="font-display font-bold text-ink text-3xl mb-1">Verify Artifacts</h1>
        <p className="text-slate text-sm mb-8">Connect your work and credentials. Our agents verify each artifact independently.</p>

        <div className="space-y-4">
          {sections.map(({ key, icon: Icon, label, desc, state, setState, verifiedSummary, pendingText, repos }) => (
            <div key={key} className="border border-line rounded-card bg-parchment overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-parchment-shade border border-line flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-slate" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink mb-0.5">{label}</h3>
                    <p className="text-xs text-slate leading-relaxed">{desc}</p>
                  </div>
                  {/* Status indicator */}
                  {state === 'verified' && (
                    <span className="flex items-center gap-1.5 text-xs text-verified font-medium shrink-0">
                      <Check size={12} strokeWidth={3} /> Verified
                    </span>
                  )}
                  {state === 'pending' && (
                    <span className="flex items-center gap-1.5 text-xs text-pending font-medium shrink-0">
                      <Loader2 size={12} className="animate-spin" /> Pending
                    </span>
                  )}
                </div>

                {/* States */}
                {state === 'verified' && (
                  <div className="mt-4 bg-[#F0FAF6] border border-verified/30 rounded-card px-4 py-3">
                    <p className="text-xs font-mono text-verified">{verifiedSummary}</p>
                  </div>
                )}
                {state === 'pending' && (
                  <div className="mt-4 bg-[#FFFBEB] border border-pending/30 rounded-card px-4 py-3 flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin text-pending shrink-0" />
                    <p className="text-xs font-mono text-pending">{pendingText}</p>
                  </div>
                )}
                {state === 'empty' && (
                  <div className="mt-4">
                    {key === 'github' && repos && (
                      <div className="mb-3 space-y-1.5">
                        {repos.map(r => (
                          <label key={r} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded" />
                            <span className="text-xs font-mono text-ink">{r}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => { setState('pending'); setTimeout(() => setState('verified'), 3000) }}
                      className="flex items-center gap-2 bg-ink text-parchment px-4 py-2 rounded-card text-xs font-medium hover:bg-opacity-90 transition-colors"
                    >
                      {key === 'github' ? <><GitBranch size={12} /> Connect GitHub</> : key === 'document' ? <><Upload size={12} /> Upload Document</> : <><Upload size={12} /> Add Credential</>}
                    </button>
                  </div>
                )}
              </div>

              {/* GitHub repo picker after verified */}
              {key === 'github' && state === 'verified' && (
                <div className="px-5 pb-4 border-t border-line">
                  <p className="text-xs text-slate mt-3 mb-2 uppercase tracking-wider font-medium">Verified Repositories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['ml-pipeline-optimizer', 'data-viz-dashboard'].map(r => (
                      <span key={r} className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#F0FAF6] border border-verified/30 text-verified">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

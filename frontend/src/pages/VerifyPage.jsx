import { useState } from 'react'
import { GitBranch, FileText, Award, Upload, Check, Loader2, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import VerificationStamp from '../components/VerificationStamp'
import { useDemo } from '../context/DemoContext'

export default function VerifyPage() {
  const { trustScore, verifiedAgents, markAgentVerified } = useDemo()
  const [githubState, setGithubState] = useState(() => verifiedAgents.has('github') ? 'verified' : 'empty')
  const [docState,    setDocState]    = useState(() => verifiedAgents.has('document') ? 'verified' : 'empty')
  const [credState,   setCredState]   = useState(() => verifiedAgents.has('credential') ? 'verified' : 'empty')
  const [docConsent, setDocConsent] = useState(false)
  const [credConsent, setCredConsent] = useState(false)
  const [githubConsent] = useState(true) // pre-given at OAuth

  const verifiedCount = [githubState, docState, credState].filter(s => s === 'verified').length

  const sections = [
    {
      key: 'github',
      icon: GitBranch,
      label: 'GitHub Repositories',
      desc: 'We analyse commit authenticity, AST code complexity, and originality signals. Source code is read in memory only — never stored.',
      state: githubState,
      setState: setGithubState,
      onVerified: () => markAgentVerified('github'),
      consent: githubConsent,
      setConsent: null,
      consentLabel: null,
      verifiedSummary: '47 commits · High complexity · No flags · 94/100 Verified ✓',
      pendingText: 'Analysing commits and code structure…',
      pendingEta: '~30 seconds',
      repos: ['ml-pipeline-optimizer', 'data-viz-dashboard', 'fastapi-boilerplate'],
    },
    {
      key: 'document',
      icon: FileText,
      label: 'Documents',
      desc: 'Upload a PDF or DOCX (max 10 MB). We check AI probability, writing complexity, and authorship consistency. The document is discarded after processing.',
      state: docState,
      setState: setDocState,
      onVerified: () => markAgentVerified('document'),
      consent: docConsent,
      setConsent: setDocConsent,
      consentLabel: 'I consent to CREDO processing this document. It will be analysed in memory and discarded — never stored.',
      verifiedSummary: 'AI probability 8% · Writing complexity 82 · 78/100 Verified ✓',
      pendingText: 'Analysing document authorship and writing style…',
      pendingEta: '~20 seconds',
      hint: 'PDF or DOCX · max 10 MB',
    },
    {
      key: 'credential',
      icon: Award,
      label: 'Credentials',
      desc: 'Upload a certificate image or PDF. OCR extracts institution, your name, and date for registry matching. The image is discarded after processing.',
      state: credState,
      setState: setCredState,
      onVerified: () => markAgentVerified('credential'),
      consent: credConsent,
      setConsent: setCredConsent,
      consentLabel: 'I consent to CREDO processing this credential image. It will be read by OCR and discarded — never stored.',
      verifiedSummary: 'AWS Developer · Issuer matched · Name matched · 90/100 Verified ✓',
      pendingText: 'Running OCR and verifying issuer against registry…',
      pendingEta: '~15 seconds',
      hint: 'JPG, PNG, or PDF · max 10 MB',
    },
  ]

  return (
    <div className="flex min-h-screen bg-parchment">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl">

          {/* Header with live trust score */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-display font-bold text-ink text-3xl mb-1">Verify Artifacts</h1>
              <p className="text-slate text-sm">
                Each agent runs independently. {verifiedCount}/3 artifact types verified.
              </p>
            </div>
            <div className="shrink-0">
              <VerificationStamp score={trustScore} size="md" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex gap-1.5">
              {sections.map(s => (
                <div key={s.key} className="flex-1 h-1 rounded-full overflow-hidden bg-line">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: s.state === 'verified' ? '100%' : s.state === 'pending' ? '50%' : '0%',
                      backgroundColor: s.state === 'verified' ? '#1F7A5C' : '#D9A441',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex mt-1.5">
              {sections.map(s => (
                <div key={s.key} className="flex-1 text-xs text-slate text-center">{s.label.split(' ')[0]}</div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {sections.map(({ key, icon: Icon, label, desc, state, setState, onVerified, consent, setConsent, consentLabel, verifiedSummary, pendingText, pendingEta, repos, hint }) => (
              <div key={key} className="border border-line rounded-card bg-parchment overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${state === 'verified' ? 'bg-[#F0FAF6] border-verified/30' : 'bg-parchment-shade border-line'}`}>
                      <Icon size={17} className={state === 'verified' ? 'text-verified' : 'text-slate'} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink mb-0.5">{label}</h3>
                      <p className="text-xs text-slate leading-relaxed">{desc}</p>
                      {hint && state === 'empty' && (
                        <p className="text-xs text-slate font-mono mt-1">{hint}</p>
                      )}
                    </div>
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

                  {state === 'verified' && (
                    <div className="mt-4 bg-[#F0FAF6] border border-verified/30 rounded-card px-4 py-3">
                      <p className="text-xs font-mono text-verified">{verifiedSummary}</p>
                    </div>
                  )}

                  {state === 'pending' && (
                    <div className="mt-4">
                      <div className="bg-[#FFFBEB] border border-pending/30 rounded-card px-4 py-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Loader2 size={13} className="animate-spin text-pending shrink-0" />
                          <p className="text-xs font-mono text-pending">{pendingText}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate font-mono">{pendingEta}</span>
                          <button onClick={() => setState('empty')} className="text-slate hover:text-ink">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {state === 'empty' && (
                    <div className="mt-4 space-y-3">
                      {key === 'github' && repos && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-slate uppercase tracking-wider mb-2">Select repositories</p>
                          {repos.map(r => (
                            <label key={r} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="rounded" defaultChecked={r === 'ml-pipeline-optimizer'} />
                              <span className="text-xs font-mono text-ink">{r}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {setConsent && consentLabel && (
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" className="mt-0.5" checked={consent} onChange={e => setConsent(e.target.checked)} />
                          <span className="text-xs text-slate leading-relaxed">{consentLabel}</span>
                        </label>
                      )}
                      <button
                        onClick={() => { setState('pending'); setTimeout(() => { setState('verified'); onVerified() }, 3000) }}
                        disabled={setConsent && !consent}
                        className="flex items-center gap-2 bg-ink text-parchment px-4 py-2 rounded-card text-xs font-medium hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {key === 'github' ? <><GitBranch size={12} /> Connect GitHub</> : key === 'document' ? <><Upload size={12} /> Upload Document</> : <><Upload size={12} /> Add Credential</>}
                      </button>
                    </div>
                  )}
                </div>

                {key === 'github' && state === 'verified' && (
                  <div className="px-5 pb-4 border-t border-line">
                    <p className="text-xs text-slate mt-3 mb-2 uppercase tracking-wider font-medium">Verified repositories</p>
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
        </div>
      </main>
    </div>
  )
}

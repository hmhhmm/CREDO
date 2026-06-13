import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Send, Code2, Clock, X, ChevronDown, ChevronUp, ArrowLeft, AlertTriangle, BookOpen } from 'lucide-react'
import BehavioralBar from '../components/BehavioralBar'
import { mockSimuHireSession } from '../data/mockData'

const stages = ['Setup', 'Challenge', 'Escalation', 'Resolution']

const stageDescriptions = {
  Setup:      'Understand the scenario. State your initial approach.',
  Challenge:  'New information surfaces. Adapt your diagnosis.',
  Escalation: 'Stakeholder pressure increases. Manage competing demands.',
  Resolution: 'Drive toward a decision. Justify your final recommendation.',
}

const speakerConfig = {
  interviewer: { label: 'Scenario Master', bg: 'bg-parchment-shade', border: 'border-l-2 border-verified', color: 'text-verified' },
  stakeholder:  { label: null, bg: 'bg-[#FFFBEB]', border: 'border-l-2 border-pending', color: 'text-pending' },
  candidate:    { label: 'You', bg: 'bg-parchment border border-line', border: '', color: 'text-slate' },
  system:       { label: '', bg: '', border: '', color: '' },
}

const dimLabels = {
  adaptability:   'Adaptability',
  communication:  'Communication',
  problemSolving: 'Problem-Solving',
  stressResponse: 'Stress Response',
  systemsThinking:'Systems Thinking',
}

const submitLabels = ['Respond to scenario', 'Diagnose and respond', 'Respond under pressure', 'Make your final call']

// ─── Radar chart ──────────────────────────────────────────────────────────────

function RadarChart({ dims }) {
  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 56
  const keys = Object.keys(dims)
  const n = keys.length

  const pt = (i, val) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2
    const rv = (val / 100) * r
    return [cx + rv * Math.cos(angle), cy + rv * Math.sin(angle)]
  }

  const gridPoly = (level) =>
    keys.map((_, i) => {
      const angle = (i * 2 * Math.PI / n) - Math.PI / 2
      const rv = (level / 100) * r
      return `${cx + rv * Math.cos(angle)},${cy + rv * Math.sin(angle)}`
    }).join(' ')

  const dataPoly = keys.map((k, i) => pt(i, dims[k]).join(',')).join(' ')

  const shortLabel = { adaptability: 'Adapt', communication: 'Comm', problemSolving: 'Problem', stressResponse: 'Stress', systemsThinking: 'Systems' }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {[25, 50, 75, 100].map(lvl => (
        <polygon key={lvl} points={gridPoly(lvl)} fill="none" stroke="#DCD2BC" strokeWidth="0.8" />
      ))}
      {keys.map((_, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#DCD2BC" strokeWidth="0.8" />
      })}
      <polygon points={dataPoly} fill="#1F7A5C" fillOpacity="0.15" stroke="#1F7A5C" strokeWidth="1.5" />
      {keys.map((k, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        const lr = r + 18
        const [lx, ly] = [cx + lr * Math.cos(angle), cy + lr * Math.sin(angle)]
        return (
          <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fill="#6B7785" fontFamily="IBM Plex Mono, monospace">
            {shortLabel[k]}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ session, onBegin }) {
  const [consent, setConsent] = useState(false)

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <nav className="border-b border-line px-6 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-slate hover:text-ink transition-colors">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <span className="font-display font-bold text-ink text-sm">CREDO SimuHire</span>
        <span className="text-xs text-slate">{session.type} Simulation</span>
      </nav>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <div className="mb-8">
            <p className="text-xs font-mono text-slate uppercase tracking-wider mb-2">Technical Simulation · 4 stages · ~25 min</p>
            <h1 className="font-display font-bold text-ink text-3xl mb-3">Your Scenario</h1>
            <p className="text-sm text-ink leading-relaxed bg-parchment-shade border border-line rounded-card p-4">
              {session.scenarioBrief.situation}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">You have access to</p>
            <ul className="space-y-1">
              {session.scenarioBrief.access.map(a => (
                <li key={a} className="flex items-center gap-2 text-xs text-ink">
                  <span className="w-1 h-1 rounded-full bg-ink inline-block shrink-0" /> {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Constraints</p>
            <ul className="space-y-1">
              {session.scenarioBrief.constraints.map(c => (
                <li key={c} className="flex items-center gap-2 text-xs text-slate">
                  <AlertTriangle size={10} className="text-pending shrink-0" /> {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6 border border-line rounded-card p-4 bg-parchment">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">How you'll be evaluated</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.values(dimLabels).map(d => (
                <p key={d} className="text-xs text-slate flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate inline-block" /> {d}
                </p>
              ))}
            </div>
            <p className="text-xs text-slate mt-3 leading-relaxed">
              The Evaluator agent scores your full transcript at the end — not per message. Think out loud. Reasoning matters more than conclusions.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer mb-5">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 rounded" />
            <span className="text-xs text-slate leading-relaxed">
              I consent to CREDO processing my simulation responses to generate a Behavioral Traits Report. My transcript is visible only to me unless I choose to share.
            </span>
          </label>

          <button
            onClick={onBegin}
            disabled={!consent}
            className="w-full bg-ink text-parchment py-3 rounded-card text-sm font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Begin Simulation →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Active session ───────────────────────────────────────────────────────────

export default function SimuHireSession() {
  const navigate = useNavigate()
  const session = mockSimuHireSession

  const [sessionState, setSessionState] = useState('setup') // 'setup' | 'active'
  const [messages, setMessages] = useState(session.conversation)
  const [input, setInput] = useState('')
  const [codeMode, setCodeMode] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [currentStage, setCurrentStage] = useState(session.stageIndex - 1)
  const [indicators, setIndicators] = useState(session.stageIndicators[session.stageIndex - 1])
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [stageTransition, setStageTransition] = useState(null) // stage name or null
  const [briefOpen, setBriefOpen] = useState(false)
  const [atBottom, setAtBottom] = useState(true)

  // Live timer — start from where the mock session left off
  const [timeLeft, setTimeLeft] = useState(22 * 60 + 15)
  const bottomRef = useRef(null)
  const convRef = useRef(null)

  useEffect(() => {
    if (sessionState !== 'active') return
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [sessionState])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const timerUrgent = timeLeft < 5 * 60 // < 5 min

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, atBottom])

  const handleScroll = () => {
    const el = convRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  const lastNonCandidateMsg = [...messages].reverse().find(m => m.speaker !== 'candidate' && m.speaker !== 'system')

  const handleSubmit = () => {
    if (!input.trim() || waiting) return
    const newMsg = { id: messages.length + 1, speaker: 'candidate', text: input }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setWaiting(true)

    const nextStage = currentStage < stages.length - 1 ? currentStage + 1 : currentStage
    const willAdvance = messages.length >= 5 && currentStage < stages.length - 1

    setTimeout(() => {
      if (willAdvance) {
        const newStage = currentStage + 1
        setCurrentStage(newStage)
        setIndicators(session.stageIndicators[newStage])
        setStageTransition(stages[newStage])
        setTimeout(() => setStageTransition(null), 2500)
        setMessages(prev => [...prev,
          { id: prev.length + 1, speaker: 'system', text: `— Stage ${newStage + 1}: ${stages[newStage]} —` },
          { id: prev.length + 2, speaker: 'interviewer', text: stageMessages[newStage] || nextResponse },
        ])
      } else {
        setMessages(prev => [...prev, { id: prev.length + 1, speaker: 'interviewer', text: nextResponse }])
      }
      setWaiting(false)
    }, 2000)
  }

  const nextResponse = "The connection pool exhaustion theory is sound. You find that the pool is indeed maxed out — all 50 connections held by slow queries caused by a missing index added in the same deploy. How do you prioritize: immediate rollback, hotfix, or connection pool reduction?"

  const stageMessages = {
    2: "The situation is escalating. The CTO has joined the incident channel and the Stakeholder is demanding a rollback. Before you act — walk me through your decision framework for this choice.",
    3: "You've stabilized the service. The stakeholder wants a post-mortem scheduled immediately and assurances it won't happen again. How do you close this out?",
  }

  if (sessionState === 'setup') {
    return <SetupScreen session={session} onBegin={() => setSessionState('active')} />
  }

  return (
    <div className="flex flex-col h-screen bg-parchment overflow-hidden">

      {/* Stage transition overlay */}
      {stageTransition && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center">
            <p className="text-xs font-mono text-parchment/60 uppercase tracking-widest mb-2">
              Stage {stages.indexOf(stageTransition) + 1} of 4
            </p>
            <h2 className="font-display font-bold text-parchment text-4xl mb-2">{stageTransition}</h2>
            <p className="text-sm text-parchment/70">{stageDescriptions[stageTransition]}</p>
          </div>
        </div>
      )}

      {/* End confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
          <div className="bg-parchment border border-line rounded-card p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-display font-bold text-ink text-lg">End simulation?</h2>
              <button onClick={() => setShowEndConfirm(false)} className="text-slate hover:text-ink"><X size={16} /></button>
            </div>
            <p className="text-sm text-slate mb-5 leading-relaxed">
              The Evaluator agent will score your transcript so far. You cannot return to this session once it ends.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/simuhire/session-demo/report')}
                className="flex-1 text-center bg-ink text-parchment text-sm font-medium py-2 rounded-card hover:bg-opacity-90 transition-colors"
              >
                End and see report
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 text-center border border-line text-sm text-ink py-2 rounded-card hover:bg-parchment-shade transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-line px-4 py-2.5 flex items-center gap-3 bg-parchment shrink-0">
        <button
          onClick={() => setShowEndConfirm(true)}
          className="flex items-center gap-1 text-slate hover:text-ink transition-colors shrink-0"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-ink text-sm">SimuHire</span>
            <span className="text-xs text-slate">· {session.type}</span>
            <span className="text-xs font-mono text-parchment bg-ink px-2 py-0.5 rounded-full shrink-0">
              {stages[currentStage]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {stages.map((s, i) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-700 ${i < currentStage ? 'bg-ink/50' : i === currentStage ? 'bg-ink' : 'bg-line'}`}
                style={{ width: i === currentStage ? 40 : 24 }}
              />
            ))}
            <span className="text-xs text-slate font-mono ml-1">{currentStage + 1}/4</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 font-mono text-sm shrink-0 ${timerUrgent ? 'text-alert' : 'text-slate'}`}>
          <Clock size={13} /> {formatTime(timeLeft)}
        </div>
        <button
          onClick={() => setShowEndConfirm(true)}
          className="text-xs border border-line rounded-card px-3 py-1.5 text-ink hover:bg-parchment-shade transition-colors font-medium shrink-0"
        >
          End
        </button>
      </div>

      {/* Scenario brief collapsible */}
      <div className="border-b border-line bg-parchment-shade shrink-0">
        <button
          onClick={() => setBriefOpen(!briefOpen)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate hover:text-ink transition-colors"
        >
          <span className="flex items-center gap-1.5"><BookOpen size={11} /> Scenario brief</span>
          {briefOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        {briefOpen && (
          <div className="px-4 pb-3 space-y-2">
            <p className="text-xs text-ink leading-relaxed">{session.scenarioBrief.situation}</p>
            <div className="flex flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-slate mb-1">Access</p>
                {session.scenarioBrief.access.map(a => <p key={a} className="text-xs text-slate">· {a}</p>)}
              </div>
              <div>
                <p className="text-xs font-medium text-slate mb-1">Constraints</p>
                {session.scenarioBrief.constraints.map(c => <p key={c} className="text-xs text-slate">· {c}</p>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Three panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: conversation */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-line" style={{ minWidth: 0 }}>
          <div ref={convRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => {
              const cfg = speakerConfig[msg.speaker]
              if (msg.speaker === 'system') {
                return (
                  <div key={msg.id} className="text-center text-xs text-slate py-1 font-mono">{msg.text}</div>
                )
              }
              const speakerLabel = msg.speaker === 'stakeholder'
                ? `Stakeholder · ${session.stakeholderPersona}`
                : cfg.label
              return (
                <div key={msg.id} className={`rounded-card p-3 ${cfg.bg} ${cfg.border}`}>
                  <p className={`text-xs font-semibold mb-1 ${cfg.color}`}>{speakerLabel}</p>
                  <p className="text-sm text-ink leading-relaxed">{msg.text}</p>
                </div>
              )
            })}
            {waiting && (
              <div className="rounded-card p-3 bg-parchment-shade border-l-2 border-verified">
                <p className="text-xs font-semibold text-verified mb-1">Scenario Master</p>
                <div className="flex gap-1 mt-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {!atBottom && (
            <div className="absolute bottom-20 left-1/4 transform -translate-x-1/2">
              <button
                onClick={() => { setAtBottom(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                className="text-xs bg-ink text-parchment px-3 py-1 rounded-full shadow font-medium"
              >
                ↓ Latest
              </button>
            </div>
          )}
        </div>

        {/* Center: input */}
        <div className="w-72 shrink-0 flex flex-col border-r border-line">
          {/* Last message context */}
          {lastNonCandidateMsg && (
            <div className="p-3 border-b border-line bg-parchment-shade">
              <p className={`text-xs font-semibold mb-1 ${speakerConfig[lastNonCandidateMsg.speaker]?.color}`}>
                {lastNonCandidateMsg.speaker === 'stakeholder'
                  ? `Stakeholder · ${session.stakeholderPersona}`
                  : speakerConfig[lastNonCandidateMsg.speaker]?.label}
              </p>
              <p className="text-xs text-ink leading-relaxed line-clamp-3">{lastNonCandidateMsg.text}</p>
            </div>
          )}

          <div className="flex-1 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCodeMode(!codeMode)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-card border transition-colors ${codeMode ? 'border-ink bg-ink text-parchment' : 'border-line text-slate hover:text-ink'}`}
              >
                <Code2 size={10} /> Code block
              </button>
              <span className={`text-xs font-mono ${input.length < 40 && input.length > 0 ? 'text-pending' : 'text-slate'}`}>
                {input.length} {input.length > 0 && input.length < 40 ? '— consider elaborating' : ''}
              </span>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Think out loud — reasoning matters more than conclusions…"
              className={`flex-1 resize-none border border-line rounded-card p-3 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate ${codeMode ? 'font-mono text-xs' : ''}`}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || waiting}
              className="flex items-center justify-center gap-2 bg-ink text-parchment py-2.5 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={12} /> {submitLabels[currentStage] || 'Submit'}
            </button>
            <p className="text-xs text-slate text-center font-mono">⌘ Enter to submit</p>
          </div>
        </div>

        {/* Right: live indicators */}
        <div className="w-56 shrink-0 flex flex-col">
          <div className="p-3 border-b border-line">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider">Live Indicators</p>
            <p className="text-xs text-slate mt-0.5">Updates each stage.</p>
          </div>
          <div className="flex-1 p-3 flex flex-col items-center">
            <RadarChart dims={indicators} />
            <div className="w-full mt-2 space-y-1.5">
              {Object.entries(indicators).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs text-slate w-16 shrink-0 truncate">{dimLabels[k].split('-')[0]}</span>
                  <div className="flex-1 h-1 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-verified rounded-full transition-all duration-700" style={{ width: `${v}%` }} />
                  </div>
                  <span className="text-xs font-mono text-ink w-6 text-right">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate mt-3 text-center leading-relaxed italic">
              Indicative — Evaluator scores the full transcript at end.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

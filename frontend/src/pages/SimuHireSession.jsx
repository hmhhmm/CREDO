import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Send, Code2, Clock, X, ChevronDown, ChevronUp, AlertTriangle, BookOpen } from 'lucide-react'
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
  adaptability:    'Adaptability',
  communication:   'Communication',
  problemSolving:  'Problem-Solving',
  stressResponse:  'Stress Response',
  systemsThinking: 'Systems Thinking',
}

const submitLabels = ['Respond to scenario', 'Diagnose and respond', 'Respond under pressure', 'Make your final call']

// ─── Radar chart ──────────────────────────────────────────────────────────────

function RadarChart({ dims, size = 160 }) {
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.35
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

  const shortLabel = {
    adaptability: 'Adapt', communication: 'Comm',
    problemSolving: 'Problem', stressResponse: 'Stress', systemsThinking: 'Systems',
  }

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
        const lr = r + size * 0.12
        const [lx, ly] = [cx + lr * Math.cos(angle), cy + lr * Math.sin(angle)]
        return (
          <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize={size * 0.048} fill="#6B7785" fontFamily="IBM Plex Mono, monospace">
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
        <Link to="/dashboard" className="text-sm text-slate hover:text-ink transition-colors">
          ← Dashboard
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

          <p className="text-xs text-slate leading-relaxed mb-3 flex items-center gap-1.5">
            
            Camera access will be requested when the simulation begins. Video is will be recorded for integrity monitoring purposes.
          </p>

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
  const session  = mockSimuHireSession

  const [sessionState,    setSessionState]    = useState('setup')
  const [messages,        setMessages]        = useState(session.conversation)
  const [input,           setInput]           = useState('')
  const [codeMode,        setCodeMode]        = useState(false)
  const [waiting,         setWaiting]         = useState(false)
  const [currentStage,    setCurrentStage]    = useState(session.stageIndex - 1)
  const [indicators,      setIndicators]      = useState(session.stageIndicators[0])
  const [showEndConfirm,  setShowEndConfirm]  = useState(false)
  const [stageTransition, setStageTransition] = useState(null)
  const [briefOpen,       setBriefOpen]       = useState(false)
  const [atBottom,        setAtBottom]        = useState(true)
  const [finalSubmitted,  setFinalSubmitted]  = useState(false)
  const [stageReplyCount, setStageReplyCount] = useState(0)

  const [timeLeft, setTimeLeft] = useState(22 * 60 + 15)
  const [cameraStream, setCameraStream] = useState(null)
  const bottomRef = useRef(null)
  const convRef   = useRef(null)
  const videoRef  = useRef(null)

  useEffect(() => {
    if (sessionState !== 'active') return
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [sessionState])

  useEffect(() => {
    if (sessionState !== 'active') return
    let stream = null
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s
        setCameraStream(s)
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => {})
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [sessionState])

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream
  }, [cameraStream])

  useEffect(() => {
    if (sessionState !== 'active') return
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setMessages(prev => [...prev, { id: prev.length + 1, speaker: 'system', text: '— Candidate switched tabs —' }])
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [sessionState])

  const formatTime  = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const timerUrgent = timeLeft < 5 * 60

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, atBottom])

  const handleScroll = () => {
    const el = convRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  // Scripted responses — keyed to candidate message count (0-indexed)
  const scriptedResponses = {
    0: {
      messages: [
        { speaker: 'interviewer', text: "Good call. The console shows: TypeError: Cannot read properties of undefined (reading 'trim'). It fires on Submit and correlates with users who leave the phone field empty. The phone field is optional. What do you do next?" },
      ],
    },
    1: {
      messages: [
        { speaker: 'stakeholder', text: "Hey — I just got a message from a client saying they can't submit the form at all. Should I tell them to try again later? Do we know what's happening?" },
      ],
    },
    2: {
      messages: [
        { speaker: 'interviewer', text: "You find the form validation calling input.phone.trim() before checking if phone exists — undefined for users who skip the optional field. You've reproduced it in staging. What's your next step: fix it yourself, message the tech lead, or something else?" },
      ],
    },
  }

  const stageResponses = {
    1: [
      "How would you communicate your current status to the tech lead in two sentences on Slack?",
      "What would you write in the PR description to make it easy for the tech lead to review and approve quickly?",
      "What would you tell the client-facing team right now so they can manage the client's expectation?",
    ],
    2: [
      "Is there any way to partially mitigate the issue for users right now without a full deployment?",
      "What's the risk if you merge without the tech lead's approval just this once?",
      "The tech lead finally approves — what do you check before you hit merge?",
    ],
    3: [
      "What do you include in the incident summary, and what do you leave out?",
      "How do you make sure this class of null-check bug doesn't slip through code review again?",
      "The client wants a written explanation of what happened. How do you frame it without exposing internal technical debt?",
    ],
  }

  const stageMessages = {
    1: "You've identified the bug and can reproduce it in staging. The Client Success manager is now messaging you — the client is getting impatient. Walk me through how you handle both the fix and the communication simultaneously. What does your fix look like, and how do you make sure it doesn't break anything else?",
    2: "You've written the fix and opened a PR. Branch protection requires tech lead approval before merge. The tech lead responds on Slack: 'Looks fine, but I can't approve until after the meeting.' The client is still waiting. What do you do right now? And if the tech lead stays unavailable for another hour, what's your escalation path?",
    3: "The fix is merged and deployed. Submissions are working again. Your tech lead asks for a short incident summary to share with the team. What do you include? And what process change would you propose to prevent this class of bug from reaching production again?",
  }

  const handleSubmit = () => {
    if (!input.trim() || waiting || finalSubmitted) return
    const candidateCount = messages.filter(m => m.speaker === 'candidate').length
    const newMsg = { id: messages.length + 1, speaker: 'candidate', text: input }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setWaiting(true)

    setTimeout(() => {
      if (scriptedResponses[candidateCount]) {
        // Early scripted exchanges (first 3 candidate messages)
        const replies = scriptedResponses[candidateCount].messages
        setMessages(prev => {
          const base = prev.length
          return [...prev, ...replies.map((r, i) => ({ id: base + i + 1, ...r }))]
        })
        setWaiting(false)
      } else {
        const pool = stageResponses[currentStage] || []
        if (stageReplyCount < pool.length) {
          // Ask the next follow-up question in this stage sequentially
          setMessages(prev => [...prev, { id: prev.length + 1, speaker: 'interviewer', text: pool[stageReplyCount] }])
          setStageReplyCount(r => r + 1)
          setWaiting(false)
        } else if (currentStage < stages.length - 1) {
          // All questions for this stage done — advance to next stage
          const newStage = currentStage + 1
          setCurrentStage(newStage)
          setStageReplyCount(0)
          setIndicators(session.stageIndicators[newStage])
          setStageTransition(stages[newStage])
          setTimeout(() => setStageTransition(null), 2500)
          setMessages(prev => [...prev,
            { id: prev.length + 1, speaker: 'system',      text: `— Stage ${newStage + 1}: ${stages[newStage]} —` },
            { id: prev.length + 2, speaker: 'interviewer', text: stageMessages[newStage] },
          ])
          setWaiting(false)
        } else {
          // All stages done — close the session
          setFinalSubmitted(true)
          setMessages(prev => [...prev, {
            id: prev.length + 1, speaker: 'interviewer',
            text: "Thank you — that's all the questions for today's simulation. You've worked through some challenging situations and I appreciated seeing your reasoning process. The Evaluator agent will now score your full transcript. Your Behavioral Traits Report will be ready in a moment.",
          }])
          setWaiting(false)
          setTimeout(() => navigate('/simuhire/session-demo/report'), 3500)
        }
      }
    }, 2000)
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

      {/* End confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
          <div className="bg-parchment border border-line rounded-card p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-display font-bold text-ink text-lg">End simulation?</h2>
              <button onClick={() => setShowEndConfirm(false)} className="text-slate hover:text-ink">
                <X size={16} />
              </button>
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
      <div className="border-b border-line px-4 py-2.5 flex items-center gap-4 bg-parchment shrink-0">
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
                className={`h-1 rounded-full transition-all duration-700 ${
                  i < currentStage ? 'bg-ink/50' : i === currentStage ? 'bg-ink' : 'bg-line'
                }`}
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

      {/* Scenario brief — collapsible */}
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
            <div className="flex flex-wrap gap-6">
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

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: conversation + input */}
        <div className="flex flex-col flex-1 overflow-hidden border-r border-line relative">

          {/* Conversation */}
          <div ref={convRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => {
              const cfg = speakerConfig[msg.speaker]
              if (msg.speaker === 'system') {
                return <div key={msg.id} className="text-center text-xs text-slate py-1 font-mono">{msg.text}</div>
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

          {/* Scroll-to-bottom — anchored above the input area */}
          {!atBottom && (
            <div className="absolute bottom-[160px] left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={() => { setAtBottom(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                className="text-xs bg-ink text-parchment px-3 py-1 rounded-full shadow-md font-medium"
              >
                ↓ Latest
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-line p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setCodeMode(!codeMode)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-card border transition-colors ${
                  codeMode ? 'border-ink bg-ink text-parchment' : 'border-line text-slate hover:text-ink'
                }`}
              >
                <Code2 size={10} /> Code block
              </button>
              {input.length > 0 && (
                <span className="text-xs font-mono text-slate">{input.length} chars</span>
              )}
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Think out loud — reasoning matters more than conclusions…"
              rows={4}
              className={`w-full resize-none border border-line rounded-card p-3 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate ${codeMode ? 'font-mono text-xs' : ''}`}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || waiting}
                className="flex items-center gap-2 bg-ink text-parchment px-5 py-2 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={12} /> {submitLabels[currentStage] || 'Submit'}
              </button>
              <p className="text-xs text-slate font-mono">⌘ Enter to submit</p>
            </div>
          </div>
        </div>

        {/* Right: live indicators */}
        <div className="w-64 shrink-0 flex flex-col">
          {/* Camera feed */}
          <div className="p-3 border-b border-line">
            <div className="w-full rounded-card overflow-hidden bg-[#1a1a1a] aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)', display: cameraStream ? 'block' : 'none' }}
              />
            </div>
            
          </div>
          <div className="p-3 border-b border-line">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider">Live Indicators</p>
            <p className="text-xs text-slate mt-0.5">Updates each stage.</p>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center overflow-y-auto">
            <RadarChart dims={indicators} size={200} />
            <div className="w-full mt-4 space-y-2.5">
              {Object.entries(indicators).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs text-slate w-16 shrink-0 truncate">{dimLabels[k]}</span>
                  <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-verified rounded-full transition-all duration-700" style={{ width: `${v}%` }} />
                  </div>
                  <span className="text-xs font-mono text-ink w-6 text-right shrink-0">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate mt-5 text-center leading-relaxed italic">
              Indicative only — Evaluator scores the full transcript at the end.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Send, Code2, Clock } from 'lucide-react'
import BehavioralBar from '../components/BehavioralBar'
import { mockSimuHireSession } from '../data/mockData'

const stages = ['Setup', 'Challenge', 'Escalation', 'Resolution']

const speakerConfig = {
  interviewer: { label: 'Interviewer', bg: 'bg-parchment-shade', border: 'border-l-2 border-verified' },
  stakeholder: { label: 'Stakeholder', bg: 'bg-parchment-shade', border: 'border-l-2 border-pending' },
  candidate: { label: 'You', bg: 'bg-parchment border border-line', border: '' },
  system: { label: '', bg: '', border: '' },
}

export default function SimuHireSession() {
  const session = mockSimuHireSession
  const [messages, setMessages] = useState(session.conversation)
  const [input, setInput] = useState('')
  const [codeMode, setCodeMode] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [currentStage, setCurrentStage] = useState(session.stageIndex - 1)
  const [indicators, setIndicators] = useState(session.liveIndicators)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = () => {
    if (!input.trim() || waiting) return
    const newMsg = { id: messages.length + 1, speaker: 'candidate', text: input }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setWaiting(true)

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        speaker: 'interviewer',
        text: "The connection pool exhaustion theory is sound. You find that the pool is indeed maxed out — all 50 connections held by slow queries caused by a missing index added in the same deploy. How do you prioritize: immediate rollback, hotfix, or connection pool reduction?",
      }])
      setWaiting(false)
    }, 2000)
  }

  const dimLabels = {
    adaptability: 'Adaptability',
    communication: 'Communication',
    problemSolving: 'Problem-Solving',
    stressResponse: 'Stress Response',
    systemsThinking: 'Systems Thinking',
  }

  return (
    <div className="flex flex-col h-screen bg-parchment overflow-hidden">
      {/* Header */}
      <div className="border-b border-line px-6 py-3 flex items-center gap-4 bg-parchment shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-ink text-sm">CREDO SimuHire</span>
            <span className="text-xs text-slate">· Technical Simulation</span>
          </div>
          <div className="flex items-center gap-1">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`h-1 rounded-full transition-all ${i <= currentStage ? 'bg-ink' : 'bg-line'}`}
                  style={{ width: 48 }} />
                <span className="text-xs text-slate hidden sm:block">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono text-slate">
          <Clock size={14} /> {session.timer}
        </div>
        <Link
          to="/simuhire/session-demo/report"
          className="text-xs border border-line rounded-card px-3 py-1.5 text-ink hover:bg-parchment-shade transition-colors font-medium"
        >
          End Simulation →
        </Link>
      </div>

      {/* Three panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: conversation */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-line" style={{ minWidth: 0 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => {
              const cfg = speakerConfig[msg.speaker]
              if (msg.speaker === 'system') {
                return (
                  <div key={msg.id} className="text-center text-xs text-slate py-2">— {msg.text} —</div>
                )
              }
              return (
                <div key={msg.id} className={`rounded-card p-3 ${cfg.bg} ${cfg.border}`}>
                  <p className="text-xs font-semibold text-slate mb-1">{cfg.label}</p>
                  <p className="text-sm text-ink leading-relaxed">{msg.text}</p>
                </div>
              )
            })}
            {waiting && (
              <div className="rounded-card p-3 bg-parchment-shade border-l-2 border-verified">
                <p className="text-xs font-semibold text-slate mb-1">Interviewer</p>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Center: input */}
        <div className="w-80 shrink-0 flex flex-col border-r border-line">
          <div className="p-4 border-b border-line">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider">Your Response</p>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCodeMode(!codeMode)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-card border transition-colors ${codeMode ? 'border-ink bg-ink text-parchment' : 'border-line text-slate hover:text-ink hover:border-slate'}`}
              >
                <Code2 size={11} /> Code block
              </button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your response..."
              className={`flex-1 resize-none border border-line rounded-card p-3 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate ${codeMode ? 'font-mono text-xs' : ''}`}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || waiting}
              className="flex items-center justify-center gap-2 bg-ink text-parchment py-2.5 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={13} /> Submit Response
            </button>
          </div>
        </div>

        {/* Right: live indicators */}
        <div className="w-64 shrink-0 flex flex-col">
          <div className="p-4 border-b border-line">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider">Live Indicators</p>
          </div>
          <div className="flex-1 p-4">
            {Object.entries(indicators).map(([k, v]) => (
              <BehavioralBar key={k} label={dimLabels[k]} value={v} small />
            ))}
            <p className="text-xs text-slate mt-4 leading-relaxed italic">
              Indicative only — final report shown at end.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

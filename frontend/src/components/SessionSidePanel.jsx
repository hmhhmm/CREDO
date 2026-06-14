import { Check } from 'lucide-react'
import RadarChart from './RadarChart'
import { dimLabels } from '../data/simuHireSignals'

// Small left-accent tint per dimension for the signal chips.
const dimAccent = {
  adaptability:    'border-l-pending',
  communication:   'border-l-verified',
  problemSolving:  'border-l-ink',
  stressResponse:  'border-l-alert',
  systemsThinking: 'border-l-slate',
}

// Right column of the active session: camera feed, accumulating signal chips,
// a demoted radar summary, and the five indicator bars (derived from signals).
export default function SessionSidePanel({ videoRef, cameraStream, signals, indicators }) {
  return (
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

      {/* Signals observed */}
      <div className="p-3 border-b border-line">
        <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Signals observed</p>
        {signals.length === 0 ? (
          <p className="text-xs text-slate leading-relaxed">Signals appear as you work through the scenario.</p>
        ) : (
          <div className="space-y-1.5">
            {signals.map(s => (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 text-xs text-ink bg-parchment-shade border-l-2 ${dimAccent[s.dim] || 'border-l-slate'} rounded-card px-2 py-1 motion-safe:animate-[fadeIn_0.3s_ease-out]`}
              >
                <Check size={11} className="text-verified shrink-0" /> {s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demoted radar + indicator bars */}
      <div className="flex-1 p-4 flex flex-col items-center overflow-y-auto">
        <RadarChart dims={indicators} size={120} />
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
  )
}

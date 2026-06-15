import { Check } from 'lucide-react'
import { getConfidenceBand } from '../utils/confidenceBand'

export default function VerificationStamp({ score, size = 'md', animate = false }) {
  const band = getConfidenceBand(score)
  const sizes = {
    sm: { outer: 48, font: 'text-xs', label: 'text-[9px]' },
    md: { outer: 72, font: 'text-sm', label: 'text-[10px]' },
    lg: { outer: 96, font: 'text-base', label: 'text-xs' },
    xl: { outer: 128, font: 'text-2xl', label: 'text-xs' },
  }
  const s = sizes[size]

  const colorMap = {
    verified: { border: '#1F7A5C', text: '#1F7A5C', bg: '#F0FAF6' },
    blue: { border: '#2F6E8F', text: '#2F6E8F', bg: '#ECF3F6' },
    pending: { border: '#D9A441', text: '#D9A441', bg: '#FFFBEB' },
    alert: { border: '#C4503A', text: '#C4503A', bg: '#FEF2F0' },
  }
  const col = colorMap[band.color] || colorMap.pending

  // Respect prefers-reduced-motion — rotation stays, scale-in animation removed
  const motionClass = animate ? 'motion-safe:animate-stamp' : ''

  return (
    <div
      className={`flex flex-col items-center gap-1 ${motionClass}`}
      style={{ transform: 'rotate(-4deg)', display: 'inline-flex' }}
      role="img"
      aria-label={`Trust score ${score} out of 100 — ${band.label}`}
    >
      <div
        style={{
          width: s.outer,
          height: s.outer,
          border: `2px solid ${col.border}`,
          borderRadius: '50%',
          backgroundColor: col.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          className={`font-mono font-medium ${s.font}`}
          style={{ color: col.text, lineHeight: 1 }}
        >
          {score}
        </span>
        <Check size={10} color={col.text} strokeWidth={3} style={{ marginTop: 1 }} aria-hidden="true" />
      </div>
      <span
        className={`font-mono uppercase tracking-widest ${s.label} text-center`}
        style={{ color: col.text }}
      >
        {band.label}
      </span>
    </div>
  )
}

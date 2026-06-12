import { Check } from 'lucide-react'

export default function SkillBar({ name, confidence, verified }) {
  const color = verified
    ? confidence >= 80 ? '#1F7A5C' : confidence >= 60 ? '#2563EB' : '#D9A441'
    : '#6B7785'

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm font-medium w-32 shrink-0 text-ink">{name}</span>
      <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
        {verified ? (
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${confidence}%`, backgroundColor: color }}
          />
        ) : (
          <div className="h-full w-full bg-line rounded-full" />
        )}
      </div>
      {verified ? (
        <span className="flex items-center gap-1 text-xs font-mono text-verified shrink-0">
          <Check size={12} strokeWidth={3} />
          Verified
        </span>
      ) : (
        <span className="text-xs text-slate font-mono shrink-0">Claimed (unverified)</span>
      )}
    </div>
  )
}

import { getConfidenceBand } from '../utils/confidenceBand'

export default function BehavioralBar({ label, value, small = false }) {
  const band = getConfidenceBand(value)

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className={`${small ? 'text-xs' : 'text-sm'} text-ink font-medium`}>{label}</span>
        <span className="text-xs font-mono" style={{ color: band.hex }}>{value}</span>
      </div>
      <div className={`${small ? 'h-1.5' : 'h-2'} bg-line/70 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${band.hex}D9 0%, ${band.hex} 100%)` }}
        />
      </div>
    </div>
  )
}

import { getConfidenceBand } from '../utils/confidenceBand'

export default function BehavioralBar({ label, value, small = false }) {
  const band = getConfidenceBand(value)

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className={`${small ? 'text-xs' : 'text-sm'} text-ink font-medium`}>{label}</span>
        <span className="text-xs font-mono" style={{ color: band.hex }}>{value}</span>
      </div>
      <div className="h-1.5 bg-line rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: band.hex }}
        />
      </div>
    </div>
  )
}

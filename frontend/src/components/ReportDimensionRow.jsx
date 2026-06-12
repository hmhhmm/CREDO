import { TrendingUp, ArrowUpRight } from 'lucide-react'
import BehavioralBar from './BehavioralBar'

export default function ReportDimensionRow({ dimension }) {
  return (
    <div className="border border-line rounded-card p-4 bg-parchment">
      <div className="mb-3">
        <h4 className="font-semibold text-ink mb-2">{dimension.name}</h4>
        <BehavioralBar label="" value={dimension.score} />
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <TrendingUp size={14} className="text-verified shrink-0 mt-0.5" />
          <p className="text-sm text-ink">{dimension.strength}</p>
        </div>
        <div className="flex gap-2">
          <ArrowUpRight size={14} className="text-pending shrink-0 mt-0.5" />
          <p className="text-sm text-ink">{dimension.growth}</p>
        </div>
      </div>
    </div>
  )
}

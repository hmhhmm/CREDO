import { useState } from 'react'
import { GitBranch, FileText, Award, ChevronDown, ChevronUp, Check, Clock, X } from 'lucide-react'
import { getConfidenceBand } from '../utils/confidenceBand'

const typeIcons = {
  github: GitBranch,
  document: FileText,
  credential: Award,
}

const statusConfig = {
  verified: { label: 'Verified', icon: Check, color: 'text-verified', bg: 'bg-[#F0FAF6]', border: 'border-verified' },
  pending: { label: 'Pending', icon: Clock, color: 'text-pending', bg: 'bg-[#FFFBEB]', border: 'border-pending' },
  failed: { label: 'Unverified', icon: X, color: 'text-alert', bg: 'bg-[#FEF2F0]', border: 'border-alert' },
}

export default function ArtifactCard({ artifact }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = typeIcons[artifact.type] || FileText
  const status = statusConfig[artifact.status] || statusConfig.pending
  const StatusIcon = status.icon
  const band = getConfidenceBand(artifact.confidence)

  return (
    <div className="border border-line rounded-card bg-parchment overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-parchment-shade transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon size={18} className="text-slate shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink text-sm truncate">{artifact.name}</p>
          <p className="text-xs text-slate font-mono">
            {artifact.type} · {artifact.date}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-1.5 w-16 bg-line rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${artifact.confidence}%`, backgroundColor: band.hex }}
            />
          </div>
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${status.color} ${status.bg} ${status.border}`}>
            <StatusIcon size={10} strokeWidth={3} />
            {status.label}
          </span>
          {expanded ? <ChevronUp size={14} className="text-slate" /> : <ChevronDown size={14} className="text-slate" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-line bg-parchment-shade">
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate uppercase tracking-wider mb-1">Confidence Score</p>
              <p className="font-mono font-medium text-ink">{artifact.confidence}/100 · {band.label}</p>
            </div>
            {artifact.metadata && Object.entries(artifact.metadata).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-slate uppercase tracking-wider mb-1">{k.replace(/([A-Z])/g, ' $1')}</p>
                <p className="font-mono text-sm text-ink">{String(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

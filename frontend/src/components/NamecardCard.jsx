import { MapPin, Briefcase, ExternalLink, QrCode } from 'lucide-react'
import VerificationStamp from './VerificationStamp'
import SkillBar from './SkillBar'
import { getConfidenceBand } from '../utils/confidenceBand'
import { Link } from 'react-router-dom'

export default function NamecardCard({ candidate, compact = false, isOwn = false }) {
  const band = getConfidenceBand(candidate.trustScore)

  if (compact) {
    return (
      <div className="border border-line rounded-card bg-parchment p-4 hover:border-slate transition-colors cursor-pointer">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-parchment-shade border border-line flex items-center justify-center shrink-0">
            <span className="font-display font-semibold text-ink text-sm">
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-ink text-base leading-tight truncate">{candidate.name}</h3>
            <p className="text-xs text-slate truncate">{candidate.field} · {candidate.university}</p>
          </div>
          <div style={{ transform: 'rotate(-4deg)' }}>
            <div
              className="w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center"
              style={{ borderColor: band.hex, backgroundColor: `${band.hex}15` }}
            >
              <span className="font-mono text-xs font-medium" style={{ color: band.hex }}>{candidate.trustScore}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          {candidate.verifiedSkills.slice(0, 3).map(s => (
            <SkillBar key={s.name} name={s.name} confidence={s.confidence} verified={s.verified} />
          ))}
        </div>
        {candidate.simuHire?.completed && candidate.simuHire?.shared && (
          <div className="mt-2 pt-2 border-t border-line">
            <span className="text-xs text-verified font-mono">✓ SimuHire · {candidate.simuHire.overallScore}/100</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-line rounded-card bg-parchment max-w-md w-full mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-line">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-parchment-shade border border-line flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-ink text-xl">
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-ink text-2xl leading-tight">{candidate.name}</h2>
            <p className="text-slate text-sm mt-0.5">{candidate.field} · {candidate.university} · {candidate.year}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate">
              {candidate.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {candidate.location}
                </span>
              )}
              {candidate.openToWork && (
                <span className="flex items-center gap-1 text-verified font-medium">
                  <Briefcase size={11} /> Open to Work
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-center">
            <VerificationStamp score={candidate.trustScore} size="md" />
          </div>
        </div>
        {candidate.bio && <p className="text-sm text-ink mt-4 leading-relaxed">{candidate.bio}</p>}
      </div>

      {/* Verified Skills */}
      <div className="p-6 border-b border-line">
        <h3 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">Verified Skills</h3>
        <div className="space-y-1">
          {candidate.verifiedSkills.map(s => (
            <SkillBar key={s.name} name={s.name} confidence={s.confidence} verified={s.verified} />
          ))}
          {candidate.claimedSkills?.map(s => (
            <SkillBar key={s} name={s} confidence={0} verified={false} />
          ))}
        </div>
      </div>

      {/* SimuHire */}
      {candidate.simuHire?.completed && candidate.simuHire?.shared && (
        <div className="p-6 border-b border-line">
          <h3 className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">SimuHire Assessment</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0FAF6] border border-verified text-verified font-mono">
              ✓ {candidate.simuHire.type} · {candidate.simuHire.overallScore}/100
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs font-mono text-slate">
            {Object.entries(candidate.simuHire.dimensions).map(([k, v]) => (
              <span key={k}>{k.replace(/([A-Z])/g, ' $1').trim()}: <span className="text-ink">{v}</span></span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex gap-2">
        <Link
          to={`/portfolio/${candidate.id}`}
          className="flex-1 text-center text-sm py-2 border border-line rounded-card text-ink hover:bg-parchment-shade transition-colors font-medium flex items-center justify-center gap-1"
        >
          <ExternalLink size={13} /> View Portfolio
        </Link>
        <button className="flex-1 text-sm py-2 border border-line rounded-card text-ink hover:bg-parchment-shade transition-colors font-medium flex items-center justify-center gap-1">
          <QrCode size={13} /> QR Code
        </button>
      </div>
    </div>
  )
}

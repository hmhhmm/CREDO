import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Mail, BookOpen, X } from 'lucide-react'
import NamecardPremium from '../components/NamecardPremium'
import NotFound from './NotFound'
import { mockCandidates } from '../data/mockData'

export default function NamecardPublic() {
  const { userId } = useParams()
  const candidate = mockCandidates.find(c => c.id === userId)
  const [contactVisible, setContactVisible] = useState(false)

  if (!candidate) return <NotFound />

  const lastVerified = candidate.artifacts
    .filter(a => a.status === 'verified')
    .map(a => a.date)
    .sort()
    .pop() || '2025-05-28'

  return (
    <div className="min-h-screen bg-parchment flex flex-col">

      {/* Header */}
      <nav className="border-b border-line px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-ink text-lg">CREDO</Link>
        <Link
          to="/register"
          className="text-xs bg-ink text-parchment px-3 py-1.5 rounded-card font-medium hover:bg-opacity-90 transition-colors"
        >
          Build your CREDO →
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Employer action bar */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setContactVisible(!contactVisible)}
            className="flex items-center gap-1.5 border border-line rounded-card px-4 py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium"
          >
            <Mail size={13} /> {contactVisible ? 'Hide contact' : 'Request contact'}
          </button>
          <Link
            to={`/portfolio/${userId}`}
            className="flex items-center gap-1.5 border border-line rounded-card px-4 py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium"
          >
            <BookOpen size={13} /> View Portfolio
          </Link>
        </div>

        {contactVisible && (
          <div className="mb-4 px-4 py-3 bg-parchment-shade border border-line rounded-card flex items-center gap-3 w-full max-w-sm">
            <p className="text-sm font-mono text-ink flex-1">{candidate.name.toLowerCase().replace(' ', '.')}@email.com</p>
            <button onClick={() => setContactVisible(false)} className="text-slate hover:text-ink shrink-0">
              <X size={13} />
            </button>
          </div>
        )}

        <NamecardPremium candidate={candidate} />

        <p className="mt-6 text-xs font-mono text-slate text-center">
          credo.app/card/{candidate.id} · Last verified {lastVerified}
        </p>
      </div>

      {/* Conversion footer */}
      <div className="border-t border-line bg-parchment-shade px-6 py-5 text-center">
        <p className="text-sm text-ink mb-3">
          Turn your GitHub commits and certificates into a verified career identity.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-ink text-parchment px-6 py-2.5 rounded-card text-sm font-semibold hover:bg-opacity-90 transition-colors"
        >
          Build your CREDO — free
        </Link>
      </div>
    </div>
  )
}

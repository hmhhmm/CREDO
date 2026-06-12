import { useParams, Link } from 'react-router-dom'
import NamecardCard from '../components/NamecardCard'
import { mockCandidates } from '../data/mockData'

export default function NamecardPublic() {
  const { userId } = useParams()
  const candidate = mockCandidates.find(c => c.id === userId) || mockCandidates[0]

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <Link to="/" className="font-display font-bold text-ink text-xl">CREDO</Link>
        <p className="text-xs text-slate mt-0.5">Verified career identity</p>
      </div>
      <NamecardCard candidate={candidate} />
      <p className="mt-6 text-xs font-mono text-slate text-center">
        credo.app/card/{candidate.id} · Verified {new Date().toLocaleDateString()}
      </p>
    </div>
  )
}

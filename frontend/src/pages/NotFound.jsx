import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-slate text-xs uppercase tracking-widest mb-4">404</p>
      <h1 className="font-display font-bold text-ink text-3xl mb-2">Page not found</h1>
      <p className="text-slate text-sm mb-8 max-w-xs">
        This profile or page doesn't exist. It may have been removed or the link is incorrect.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 text-sm font-medium text-ink border border-line rounded-card px-4 py-2 hover:bg-parchment-shade transition-colors"
      >
        <ArrowLeft size={13} /> Back to CREDO
      </Link>
    </div>
  )
}

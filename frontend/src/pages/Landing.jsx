import { Link } from 'react-router-dom'
import { ShieldCheck, PlayCircle, CreditCard, ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-parchment">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-line">
        <span className="font-display font-bold text-ink text-xl tracking-tight">CREDO</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-slate hover:text-ink transition-colors">Sign in</Link>
          <Link
            to="/register"
            className="text-sm bg-ink text-parchment px-4 py-2 rounded-card font-medium hover:bg-opacity-90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-parchment-shade border border-line rounded-full px-3 py-1 text-xs text-slate mb-8 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-verified inline-block" />
          Talentbank Tech Hackathon 2026
        </div>
        <h1 className="font-display font-bold text-ink leading-tight mb-6" style={{ fontSize: '3rem', lineHeight: 1.1 }}>
          Prove. Present. Perform.
        </h1>
        <p className="text-body-l text-slate max-w-xl mx-auto mb-10 leading-relaxed">
          CREDO gives you a verified career identity that employers can trust. Not a resume. A record.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 bg-ink text-parchment px-6 py-3 rounded-card font-medium text-sm hover:bg-opacity-90 transition-colors"
          >
            Build your profile <ArrowRight size={14} />
          </Link>
          <Link
            to="/employer/candidates"
            className="flex items-center gap-2 border border-line text-ink px-6 py-3 rounded-card font-medium text-sm hover:bg-parchment-shade transition-colors"
          >
            Browse candidates
          </Link>
        </div>
      </div>

      {/* Pillars */}
      <div className="max-w-4xl mx-auto px-8 pb-24 grid grid-cols-3 gap-6">
        {[
          { icon: ShieldCheck, color: '#1F7A5C', title: 'Prove', desc: 'GitHub analysis, document authorship, and certificate OCR — three AI agents building your confidence score.' },
          { icon: CreditCard, color: '#10192B', title: 'Present', desc: 'A Smart Namecard auto-generated from verified data, scannable by employers in under 10 seconds.' },
          { icon: PlayCircle, color: '#D9A441', title: 'Perform', desc: 'SimuHire — a 30-minute AI-driven behavioral simulation that produces a Traits Report backed by transcript evidence.' },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="border border-line rounded-card p-6 bg-parchment">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${color}15` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <h3 className="font-display font-bold text-ink text-lg mb-2">{title}</h3>
            <p className="text-sm text-slate leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Demo candidates */}
      <div className="border-t border-line bg-parchment-shade py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-ink text-2xl mb-2">See it live</h2>
          <p className="text-slate text-sm mb-8">Three real profiles, three different trust levels.</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'Ahmad Farid', score: 87, label: 'Highly Authentic', field: 'CS · UM · SimuHire ✓' },
              { name: 'Priya Nair', score: 71, label: 'Authentic', field: 'SE · UTM' },
              { name: 'Wei Chen', score: 38, label: 'Low Confidence', field: 'Business · Taylor\'s' },
            ].map(c => (
              <Link
                key={c.name}
                to={`/card/${c.name.toLowerCase().replace(' ', '-')}`}
                className="border border-line rounded-card p-4 bg-parchment hover:border-slate transition-colors"
              >
                <p className="font-display font-semibold text-ink">{c.name}</p>
                <p className="text-xs text-slate mt-0.5 mb-3">{c.field}</p>
                <p className="font-mono text-2xl font-medium text-ink">{c.score}<span className="text-slate text-sm">/100</span></p>
                <p className="text-xs text-slate">{c.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

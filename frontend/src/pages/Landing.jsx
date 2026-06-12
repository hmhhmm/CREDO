import { Link } from 'react-router-dom'
import { ShieldCheck, IdCard, PlayCircle, ArrowRight, Check } from 'lucide-react'
import NamecardCard from '../components/NamecardCard'
import { mockCandidates } from '../data/mockData'

const ahmad = mockCandidates[0]
const priya = mockCandidates[1]
const wei = mockCandidates[2]

export default function Landing() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-line shrink-0">
        <span className="font-display font-bold text-ink text-xl tracking-tight">CREDO</span>
        <div className="flex items-center gap-6">
          <Link to="/employer/candidates" className="text-sm text-slate hover:text-ink transition-colors">Browse candidates</Link>
          <Link to="/login" className="text-sm text-slate hover:text-ink transition-colors">Sign in</Link>
          <Link
            to="/register"
            className="text-sm bg-ink text-parchment px-4 py-2 rounded-card font-medium hover:bg-opacity-90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero — split layout */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-8 py-20 flex items-center gap-16">
        {/* Left: copy + CTAs */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 bg-parchment-shade border border-line rounded-full px-3 py-1 text-xs text-slate mb-8 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-verified inline-block" />
            Cryptographic proof · PDPA 2010 compliant
          </div>

          <h1 className="font-display font-bold text-ink mb-6" style={{ fontSize: '3rem', lineHeight: 1.1 }}>
            Prove. Present.<br />Perform.
          </h1>

          <p className="text-lg text-slate leading-relaxed mb-4 max-w-md">
            A verified career identity built from real evidence — not claims. Employers see verified skills, a trust score, and behavioral proof before the first interview.
          </p>

          {/* Two-audience value props */}
          <div className="space-y-2 mb-8">
            {[
              { audience: 'For candidates', claim: 'Turn your GitHub commits and certificates into a cryptographically verified record.' },
              { audience: 'For employers', claim: 'Every score has a source. Stop guessing. Filter by verified skills in one click.' },
            ].map(({ audience, claim }) => (
              <div key={audience} className="flex gap-2">
                <Check size={14} className="text-verified mt-0.5 shrink-0" strokeWidth={3} />
                <p className="text-sm text-ink">
                  <span className="font-semibold">{audience}:</span> {claim}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-ink text-parchment px-6 py-3 rounded-card font-semibold text-sm hover:bg-opacity-90 transition-colors"
            >
              Build your profile <ArrowRight size={14} />
            </Link>
            <Link
              to="/employer/candidates"
              className="flex items-center gap-1 text-sm text-ink font-medium hover:underline"
            >
              Browse verified candidates <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right: live namecard preview */}
        <div className="shrink-0 hidden lg:block">
          <div className="relative">
            <div className="absolute -top-3 -left-3 text-xs font-mono text-slate bg-parchment-shade border border-line rounded-full px-2 py-0.5 z-10">
              Live example
            </div>
            <NamecardCard candidate={ahmad} />
          </div>
        </div>
      </div>

      {/* Pillars — Present is dominant */}
      <div className="border-t border-line bg-parchment-shade">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <p className="text-xs font-semibold text-slate uppercase tracking-wider text-center mb-10">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

            {/* Prove */}
            <div className="border border-line rounded-card p-6 bg-parchment">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-[#F0FAF6]">
                <ShieldCheck size={18} className="text-verified" />
              </div>
              <h3 className="font-display font-bold text-ink text-lg mb-2">Prove</h3>
              <p className="text-sm text-slate leading-relaxed mb-4">
                Three AI agents analyse your GitHub commits, document authorship, and certificate OCR — each returning a confidence score from 0 to 100.
              </p>
              <ul className="space-y-1">
                {['Commit authenticity', 'AST code complexity', 'Issuer registry match'].map(f => (
                  <li key={f} className="text-xs text-slate flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-verified inline-block shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Present — featured/dominant */}
            <div className="border-2 border-ink rounded-card p-6 bg-parchment relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono font-semibold bg-ink text-parchment px-3 py-0.5 rounded-full">
                The output
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-parchment-shade">
                <IdCard size={18} className="text-ink" />
              </div>
              <h3 className="font-display font-bold text-ink text-xl mb-2">Present</h3>
              <p className="text-sm text-ink leading-relaxed mb-4">
                A Smart Namecard auto-generated from verified data. Shareable in one link. Scannable by employers in under 10 seconds. Locked fields can never be faked.
              </p>
              <ul className="space-y-1">
                {['Verified skill confidence bars', 'Trust score with audit trail', 'QR code + shareable link'].map(f => (
                  <li key={f} className="text-xs text-ink flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-ink inline-block shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Perform */}
            <div className="border border-line rounded-card p-6 bg-parchment">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-[#FFFBEB]">
                <PlayCircle size={18} className="text-pending" />
              </div>
              <h3 className="font-display font-bold text-ink text-lg mb-2">Perform</h3>
              <p className="text-sm text-slate leading-relaxed mb-4">
                SimuHire: a 30-minute AI behavioral simulation with four agents — Scenario Master, Stakeholder, Evaluator, and Feedback. Results feed directly into your namecard.
              </p>
              <ul className="space-y-1">
                {['Technical, Business, or General', 'Evidence-backed trait report', '7-day retake · best score kept'].map(f => (
                  <li key={f} className="text-xs text-slate flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-pending inline-block shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Demo — compact namecards */}
      <div className="border-t border-line bg-parchment">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display font-bold text-ink text-2xl mb-1">Three profiles. Three trust levels.</h2>
              <p className="text-slate text-sm">Toggle "Verified Only" on the employer browse page — watch Wei Chen disappear.</p>
            </div>
            <Link
              to="/employer/candidates"
              className="text-sm font-medium text-ink border border-line rounded-card px-4 py-2 hover:bg-parchment-shade transition-colors shrink-0"
            >
              Open employer view →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[ahmad, priya, wei].map(c => (
              <Link key={c.id} to={`/card/${c.id}`}>
                <NamecardCard candidate={c} compact />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-line px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-ink text-sm">CREDO</span>
          <span className="text-slate text-xs">· Prove. Present. Perform.</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate">
          <span>PDPA 2010 compliant</span>
          <span>Talentbank Tech Hackathon 2026</span>
          <Link to="/register" className="hover:text-ink transition-colors">Get started</Link>
        </div>
      </footer>
    </div>
  )
}

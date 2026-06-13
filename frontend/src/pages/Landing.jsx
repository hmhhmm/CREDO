import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck, IdCard, PlayCircle, ArrowRight, Check, ChevronRight } from 'lucide-react'
import NamecardCard from '../components/NamecardCard'
import Card3D from '../components/Card3D'
import { mockCandidates } from '../data/mockData'

const ahmad = mockCandidates[0]
const priya = mockCandidates[1]
const wei   = mockCandidates[2]

// Ease-out-expo — confident, decisive, never bouncy
const EXPO = [0.16, 1, 0.3, 1]

// Pillar card stagger
const pillarContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}
const pillarCard = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}
const pillarCardFeatured = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

// Demo card stagger
const demoContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const demoCard = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export default function Landing() {
  const reduced = useReducedMotion()

  // When reduced: initial={false} starts elements in their animate state immediately
  const ri = reduced ? false : undefined

  return (
    <div className="min-h-screen bg-parchment flex flex-col">

      {/* Nav ─ slides in from top */}
      <motion.nav
        className="flex items-center justify-between px-8 py-4 border-b border-line shrink-0"
        initial={reduced ? false : { y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.38, ease: EXPO }}
      >
        <span className="font-display font-bold text-ink text-xl tracking-tight">CREDO</span>
        <div className="flex items-center gap-6">
          <Link
            to="/employer/candidates"
            className="text-sm text-slate hover:text-ink transition-colors duration-150"
          >
            Browse candidates
          </Link>
          <Link
            to="/login"
            className="text-sm text-slate hover:text-ink transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm bg-ink text-parchment px-4 py-2 rounded-card font-medium hover:opacity-90 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-parchment"
          >
            Get started
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto w-full px-8 py-20 flex items-center gap-12 lg:gap-20">

        {/* Left: copy + CTAs */}
        <div className="flex-1 min-w-0">

          {/* Trust badge pill */}
          <motion.div
            className="inline-flex items-center gap-2 bg-parchment-shade border border-line rounded-full px-3 py-1 text-xs text-slate mb-8 font-mono"
            initial={reduced ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: EXPO, delay: 0.08 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-verified inline-block" />
            Cryptographic proof · PDPA 2010 compliant
          </motion.div>

          {/* Headline — per-line clip-path wipe (reveal like a stamp) */}
          <h1 className="font-display font-bold text-ink text-5xl leading-[1.08] mb-6">
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={reduced ? false : { clipPath: 'inset(0 102% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: 0.52, ease: EXPO, delay: 0.15 }}
              >
                Prove. Present.
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={reduced ? false : { clipPath: 'inset(0 102% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: 0.52, ease: EXPO, delay: 0.31 }}
              >
                Perform.
              </motion.span>
            </span>
          </h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg text-slate leading-relaxed mb-6 max-w-[44ch]"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EXPO, delay: 0.46 }}
          >
            A verified career identity built from real evidence — not claims. Employers see verified skills, a trust score, and behavioral proof before the first interview.
          </motion.p>

          {/* Feature bullets — stagger from left */}
          <div className="space-y-2 mb-8">
            {[
              { audience: 'For candidates', claim: 'Turn your GitHub commits and certificates into a cryptographically verified record.', delay: 0.55 },
              { audience: 'For employers',  claim: 'Every score has a source. Stop guessing. Filter by verified skills in one click.', delay: 0.65 },
            ].map(({ audience, claim, delay }) => (
              <motion.div
                key={audience}
                className="flex gap-2.5"
                initial={reduced ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.38, ease: EXPO, delay }}
              >
                <Check size={14} className="text-verified mt-0.5 shrink-0" strokeWidth={3} />
                <p className="text-sm text-ink">
                  <span className="font-semibold">{audience}:</span> {claim}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTAs */}
          <motion.div
            className="flex items-center gap-4 flex-wrap"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: EXPO, delay: 0.73 }}
          >
            <motion.div whileTap={reduced ? {} : { scale: 0.97 }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-ink text-parchment px-6 py-3 rounded-card font-semibold text-sm hover:opacity-90 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-parchment"
              >
                Build your profile <ArrowRight size={14} />
              </Link>
            </motion.div>
            <Link
              to="/employer/candidates"
              className="inline-flex items-center gap-1.5 text-sm text-ink font-medium hover:underline focus:outline-none focus:underline transition-colors duration-150"
            >
              Browse verified candidates <ChevronRight size={14} />
            </Link>
          </motion.div>
        </div>

        {/* Right: live namecard — 3D interactive, enters from right */}
        <motion.div
          className="shrink-0 hidden lg:block"
          style={{ perspective: '900px' }}
          initial={reduced ? false : { opacity: 0, x: 32, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.62, ease: EXPO, delay: 0.28 }}
        >
          <div className="relative">
            <span className="absolute -top-2.5 left-3 z-10 text-xs font-mono text-slate bg-parchment border border-line rounded-full px-2.5 py-0.5 shadow-sm pointer-events-none">
              Live example
            </span>
            <Card3D floatAmplitude={8}>
              <NamecardCard candidate={ahmad} />
            </Card3D>
          </div>
        </motion.div>
      </div>

      {/* Pillars */}
      <div className="border-t border-line bg-parchment-shade">
        <div className="max-w-6xl mx-auto px-8 py-16">

          {/* Section heading */}
          <motion.h2
            className="font-display font-bold text-ink text-2xl text-center mb-10 [text-wrap:balance]"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, ease: EXPO }}
          >
            One flow. Three layers of proof.
          </motion.h2>

          {/* Card grid — stagger */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch"
            variants={reduced ? {} : pillarContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >

            {/* Prove */}
            <motion.div
              className="border border-line rounded-card p-6 bg-parchment flex flex-col"
              variants={reduced ? {} : pillarCard}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#F0FAF6] shrink-0">
                  <ShieldCheck size={16} className="text-verified" />
                </div>
                <div>
                  <p className="text-xs font-mono text-verified uppercase tracking-wider">Step 1</p>
                  <h3 className="font-display font-bold text-ink text-lg leading-tight">Prove</h3>
                </div>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4 flex-1">
                Three AI agents analyse your GitHub commits, document authorship, and certificate OCR — each returning a confidence score from 0 to 100.
              </p>
              <ul className="space-y-1.5 mt-auto">
                {['Commit authenticity', 'AST code complexity', 'Issuer registry match'].map(f => (
                  <li key={f} className="text-xs text-slate flex items-center gap-2">
                    <Check size={11} className="text-verified shrink-0" strokeWidth={3} />{f}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Present — dominant, featured entrance */}
            <motion.div
              className="border-2 border-ink rounded-card p-6 bg-parchment relative flex flex-col shadow-sm"
              variants={reduced ? {} : pillarCardFeatured}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-mono font-semibold bg-ink text-parchment px-3 py-0.5 rounded-full">
                The output
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-parchment-shade shrink-0">
                  <IdCard size={16} className="text-ink" />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate uppercase tracking-wider">Result</p>
                  <h3 className="font-display font-bold text-ink text-xl leading-tight">Present</h3>
                </div>
              </div>
              <p className="text-sm text-ink leading-relaxed mb-4 flex-1">
                A Smart Namecard auto-generated from verified data. Shareable in one link. Scannable in under 10 seconds. Locked fields can never be faked.
              </p>
              <ul className="space-y-1.5 mt-auto">
                {['Verified skill confidence bars', 'Trust score with audit trail', 'QR code + shareable link'].map(f => (
                  <li key={f} className="text-xs text-ink flex items-center gap-2">
                    <Check size={11} className="text-ink shrink-0" strokeWidth={3} />{f}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Perform */}
            <motion.div
              className="border border-line rounded-card p-6 bg-parchment flex flex-col"
              variants={reduced ? {} : pillarCard}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FFFBEB] shrink-0">
                  <PlayCircle size={16} className="text-pending" />
                </div>
                <div>
                  <p className="text-xs font-mono text-pending uppercase tracking-wider">Step 2</p>
                  <h3 className="font-display font-bold text-ink text-lg leading-tight">Perform</h3>
                </div>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4 flex-1">
                SimuHire: a 30-minute AI behavioral simulation with four agents. Results feed directly into your namecard as a behavioral badge.
              </p>
              <ul className="space-y-1.5 mt-auto">
                {['Technical, Business, or General', 'Evidence-backed trait report', '7-day retake · best score kept'].map(f => (
                  <li key={f} className="text-xs text-slate flex items-center gap-2">
                    <Check size={11} className="text-pending shrink-0" strokeWidth={3} />{f}
                  </li>
                ))}
              </ul>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* Demo */}
      <div className="border-t border-line bg-parchment">
        <div className="max-w-6xl mx-auto px-8 py-16">

          {/* Section header */}
          <motion.div
            className="flex items-end justify-between mb-8 gap-4 flex-wrap"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, ease: EXPO }}
          >
            <div>
              <h2 className="font-display font-bold text-ink text-2xl mb-1 [text-wrap:balance]">
                Three profiles. Three trust levels.
              </h2>
              <p className="text-slate text-sm">
                Toggle "Verified Only" on the employer browse page — watch Wei Chen disappear.
              </p>
            </div>
            <Link
              to="/employer/candidates"
              className="text-sm font-medium text-ink border border-line rounded-card px-4 py-2 hover:bg-parchment-shade transition-colors duration-150 shrink-0 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-parchment"
            >
              Open employer view →
            </Link>
          </motion.div>

          {/* Demo cards — stagger */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={reduced ? {} : demoContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {[ahmad, priya, wei].map(c => (
              <motion.div key={c.id} variants={reduced ? {} : demoCard}>
                <Link
                  to={`/card/${c.id}`}
                  className="block rounded-card transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-parchment"
                >
                  <NamecardCard candidate={c} compact />
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-line bg-parchment">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-ink text-sm">CREDO</span>
            <span className="text-slate text-xs">· Prove. Present. Perform.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate">
            <span>PDPA 2010 compliant</span>
            <span>Talentbank Tech Hackathon 2026</span>
            <Link
              to="/register"
              className="hover:text-ink transition-colors duration-150 focus:outline-none focus:underline"
            >
              Get started
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

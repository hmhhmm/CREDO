import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, useMotionValue, useSpring, useTransform,
  useReducedMotion, animate as fmAnimate,
} from 'framer-motion'
import { GitBranch, Award, FileText, ExternalLink, RotateCcw, Check, Briefcase } from 'lucide-react'
import { getConfidenceBand } from '../utils/confidenceBand'

// ─── Physics ──────────────────────────────────────────────────────────────────
const TILT   = { stiffness: 280, damping: 28, mass: 0.65 }
const SCALE  = { stiffness: 260, damping: 28 }
const FLIP   = { type: 'spring', stiffness: 180, damping: 30 }
const TILT_MAX = 10  // degrees

// ─── Material ─────────────────────────────────────────────────────────────────
// SVG feTurbulence grain tile — multiply-blended onto the warm gradient to
// break the perfectly-smooth digital surface and suggest quality card stock.
const GRAIN_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="188">' +
  '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>' +
  '<feColorMatrix type="saturate" values="0"/></filter>' +
  '<rect width="300" height="188" filter="url(#g)"/></svg>'
)}`

// Layer order (front → back):
//   1. radial highlight — single light source at top-left corner
//   2. grain tile       — multiply-blended with color base → paper texture
//   3. warm gradient    — base color field
const CARD_BG = {
  backgroundImage: [
    'radial-gradient(ellipse 80% 70% at 22% 18%, rgba(255,255,255,0.22) 0%, transparent 65%)',
    `url("${GRAIN_URL}")`,
    'linear-gradient(148deg, #F7EFE2 0%, #ECE0C8 55%, #E4D3B2 100%)',
  ].join(', '),
  backgroundBlendMode: 'normal, multiply, normal',
  backgroundRepeat:    'no-repeat, repeat, no-repeat',
  backgroundSize:      '100% 100%, 300px 188px, 100% 100%',
  // Top-edge white catch + bottom-edge dark hint → physical card thickness
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(16,25,43,0.08)',
}

// ─── Font scale (4 sizes) ─────────────────────────────────────────────────────
// 72px — hero number (trust score)
// 20px — identity anchor (candidate name)
// 11px — all readable body (wordmark, field, university, skills, SimuHire, links)
//  8px — all metadata (labels, strip, hash, indicators, hints)

// ─── QR finder-pattern placeholder ───────────────────────────────────────────
function QRCode({ size = 52 }) {
  const c = size / 7
  const cells = [
    // Outer ring
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
    [0,1],[6,1],[0,2],[6,2],[0,3],[6,3],[0,4],[6,4],[0,5],[6,5],
    [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],
    // Inner block
    [2,2],[3,2],[4,2],[2,3],[3,3],[4,3],[2,4],[3,4],[4,4],
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="opacity-60 shrink-0">
      {cells.map(([ci, ri], i) => (
        <rect key={i} x={ci * c + 0.4} y={ri * c + 0.4} width={c - 0.8} height={c - 0.8} fill="#10192B" rx="0.5" />
      ))}
    </svg>
  )
}

// ─── Agent indicator dot ──────────────────────────────────────────────────────
function AgentDot({ active, icon: Icon, hex, label }) {
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: 20, height: 20,
        backgroundColor: active ? `${hex}18` : 'rgba(220,210,188,0.3)',
        border: `1px solid ${active ? hex : '#DCD2BC'}`,
      }}
      title={`${label} ${active ? '✓ Verified' : '— Not verified'}`}
    >
      <Icon size={9} color={active ? hex : '#6B7785'} strokeWidth={2.5} />
    </div>
  )
}

// ─── Front face ───────────────────────────────────────────────────────────────
function Front({ candidate, band, merkleSnippet }) {
  const arts     = candidate.artifacts || []
  const hasGH    = arts.some(a => a.type === 'github'     && a.status === 'verified')
  const hasCR    = arts.some(a => a.type === 'credential' && a.status === 'verified')
  const hasDOC   = arts.some(a => a.type === 'document'   && a.status === 'verified')
  const anyVerif = hasGH || hasCR || hasDOC

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        borderRadius: 'inherit',
        ...CARD_BG,
      }}
    >
      {/* Trust-band accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: band.hex }} />

      {/* Top row — CREDO + agent dots */}
      <div className="flex items-center justify-between px-6 pt-[18px]">
        <span
          className="font-display font-bold text-ink tracking-tight select-none"
          style={{ fontSize: 11 }}
        >
          CREDO
        </span>
        <div className="flex items-center gap-[5px]">
          <AgentDot active={hasGH}  icon={GitBranch} hex={band.hex} label="GitHub" />
          <AgentDot active={hasCR}  icon={Award}     hex={band.hex} label="Credential" />
          <AgentDot active={hasDOC} icon={FileText}  hex={band.hex} label="Document" />
        </div>
      </div>

      {/* Main content — identity left, trust score right, aligned to bottom */}
      <div className="flex-1 flex items-end justify-between px-6">

        {/* Identity */}
        <div className="pb-[18px]">
          <h2
            className="font-display font-bold text-ink leading-tight mb-[4px]"
            style={{ fontSize: 20 }}
          >
            {candidate.name}
          </h2>
          <p className="font-mono text-slate" style={{ fontSize: 11, lineHeight: 1.6 }}>
            {candidate.field}
          </p>
          <p className="font-mono text-slate" style={{ fontSize: 11, lineHeight: 1.6 }}>
            {candidate.university}
          </p>
          {candidate.openToWork && (
            <div className="flex items-center gap-[5px] mt-[8px]">
              <span className="w-[5px] h-[5px] rounded-full bg-verified inline-block" />
              <span
                className="font-mono uppercase tracking-wider text-verified"
                style={{ fontSize: 8 }}
              >
                Open to Work
              </span>
            </div>
          )}
        </div>

        {/* Trust score — hero element */}
        <div className="text-right pb-[14px]">
          <div className="flex items-baseline justify-end gap-[2px]">
            <span
              className="font-mono font-bold"
              style={{ fontSize: 72, color: band.hex, lineHeight: 1 }}
            >
              {candidate.trustScore}
            </span>
            <span
              className="font-mono text-slate"
              style={{ fontSize: 8, paddingBottom: 6 }}
            >
              /100
            </span>
          </div>
          <p
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 8, color: band.hex, marginTop: 2 }}
          >
            {band.label}
          </p>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className="flex items-center justify-between px-6 py-[9px]"
        style={{ borderTop: '1px solid rgba(220,210,188,0.7)' }}
      >
        <div className="flex items-center gap-[8px]">
          {anyVerif ? (
            [{ v: hasGH, l: 'GitHub' }, { v: hasCR, l: 'Credential' }, { v: hasDOC, l: 'Document' }]
              .filter(x => x.v)
              .map(({ l }) => (
                <span
                  key={l}
                  className="font-mono uppercase tracking-wider flex items-center gap-[3px]"
                  style={{ fontSize: 8, color: band.hex }}
                >
                  <Check size={7} strokeWidth={3} />{l}
                </span>
              ))
          ) : (
            <span className="font-mono text-slate" style={{ fontSize: 8 }}>No verified artifacts</span>
          )}
        </div>
        <div className="flex items-center gap-[10px]">
          {merkleSnippet && (
            <span className="font-mono text-slate" style={{ fontSize: 8, opacity: 0.45 }}>
              {merkleSnippet}
            </span>
          )}
          <span
            className="font-mono text-slate flex items-center gap-[3px]"
            style={{ fontSize: 8, opacity: 0.35 }}
          >
            <RotateCcw size={7} /> flip
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Back face ────────────────────────────────────────────────────────────────
function Back({ candidate, band }) {
  const topSkills   = (candidate.verifiedSkills || []).slice(0, 3)
  const simu        = candidate.simuHire
  const verCount    = (candidate.artifacts || []).filter(a => a.status === 'verified').length
  const hasMerkle   = !!candidate.merkleRoot

  return (
    <div
      className="absolute inset-0 flex flex-col px-6 py-[18px] overflow-hidden"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        borderRadius: 'inherit',
        ...CARD_BG,
      }}
    >
      {/* Accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: band.hex }} />

      {/* Top row: skills label + QR */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <p
            className="font-mono uppercase tracking-wider text-slate mb-[10px]"
            style={{ fontSize: 8 }}
          >
            Verified Evidence
          </p>

          {/* Top skills — compact: name + score only */}
          {topSkills.length > 0 ? (
            <div className="space-y-[7px]">
              {topSkills.map(s => (
                <div key={s.name} className="flex items-center justify-between gap-4">
                  <span className="font-mono text-ink" style={{ fontSize: 11 }}>{s.name}</span>
                  <span
                    className="font-mono font-medium flex items-center gap-[3px] shrink-0"
                    style={{ fontSize: 11, color: band.hex }}
                  >
                    {s.confidence} <Check size={8} strokeWidth={3} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-slate" style={{ fontSize: 11 }}>
              No verified skills yet
            </p>
          )}
        </div>

        {/* QR code */}
        <div className="flex flex-col items-center gap-[4px]">
          <QRCode size={54} />
          <span className="font-mono text-slate" style={{ fontSize: 8, opacity: 0.5 }}>
            {candidate.id}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(220,210,188,0.6)', marginBottom: 10 }} />

      {/* SimuHire */}
      {simu?.completed && simu?.shared ? (
        <div className="flex items-center gap-[8px] mb-[6px]">
          <span
            className="font-mono uppercase tracking-wider"
            style={{ fontSize: 8, color: '#D9A441' }}
          >
            SimuHire
          </span>
          <span className="font-mono text-ink" style={{ fontSize: 11 }}>
            {simu.type}
            <span className="text-slate"> · </span>
            <span style={{ color: band.hex }}>{simu.overallScore}/100</span>
          </span>
        </div>
      ) : (
        <p className="font-mono text-slate mb-[6px]" style={{ fontSize: 8, opacity: 0.5 }}>
          SimuHire not completed
        </p>
      )}

      {/* Artifact + Merkle summary */}
      {verCount > 0 && (
        <div className="flex items-center gap-[6px] mb-auto">
          <span className="font-mono text-slate" style={{ fontSize: 8 }}>
            {verCount} artifact{verCount !== 1 ? 's' : ''} verified
          </span>
          {hasMerkle && (
            <>
              <span className="text-slate opacity-40" style={{ fontSize: 8 }}>·</span>
              <span className="font-mono text-slate" style={{ fontSize: 8 }}>Merkle intact</span>
            </>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div
        className="flex items-center justify-between pt-[9px] mt-auto"
        style={{ borderTop: '1px solid rgba(220,210,188,0.6)' }}
      >
        <Link
          to={`/portfolio/${candidate.id}`}
          className="font-mono text-ink flex items-center gap-[4px] hover:opacity-60 transition-opacity"
          style={{ fontSize: 11 }}
          onClick={e => e.stopPropagation()}
        >
          View Portfolio <ExternalLink size={8} />
        </Link>
        <div className="flex items-center gap-[10px]">
          {candidate.openToWork && (
            <span
              className="font-mono text-verified flex items-center gap-[4px]"
              style={{ fontSize: 8 }}
            >
              <Briefcase size={8} /> Open to Work
            </span>
          )}
          <span
            className="font-mono text-slate flex items-center gap-[3px]"
            style={{ fontSize: 8, opacity: 0.35 }}
          >
            <RotateCcw size={7} /> flip
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NamecardPremium({ candidate }) {
  const ref     = useRef(null)
  const reduced = useReducedMotion()
  const [flipped,  setFlipped]  = useState(false)
  const [hovering, setHovering] = useState(false)

  // Motion values
  const rawX       = useSpring(0, TILT)
  const rawY       = useSpring(0, TILT)
  const scaleV     = useSpring(1, SCALE)
  const flipAngle  = useMotionValue(0)  // 0 = front, 180 = back

  const band         = getConfidenceBand(candidate.trustScore)
  const merkleSnippet = candidate.merkleRoot
    ? `${candidate.merkleRoot.slice(0, 8)}···${candidate.merkleRoot.slice(-4)}`
    : null

  // Tilt magnitude fades to zero as flip reaches 90°
  const tiltFade = useTransform(flipAngle, [0, 90, 180], [1, 0, 0])

  // Combined rotateY: flip angle + mouse tilt (fades during flip)
  const rotateY = useTransform(
    [flipAngle, rawX, tiltFade],
    ([fa, rx, tf]) => fa + rx * TILT_MAX * tf,
  )
  // RotateX: mouse tilt only (fades during flip)
  const rotateX = useTransform(
    [rawY, tiltFade],
    ([ry, tf]) => ry * -TILT_MAX * tf,
  )

  // Dynamic drop-shadow
  const shadowX     = useTransform(rawX, [-1, 1], [16, -16])
  const shadowY     = useTransform(rawY, [-1, 1], [-16, 16])
  const shadowBlur  = useTransform([rawX, rawY], ([x, y]) => 24 + Math.sqrt(x * x + y * y) * 20)
  const shadowAlpha = useTransform([rawX, rawY], ([x, y]) => 0.1 + Math.sqrt(x * x + y * y) * 0.1)
  const boxShadow   = useTransform(
    [shadowX, shadowY, shadowBlur, shadowAlpha],
    ([sx, sy, bl, al]) =>
      `${sx}px ${sy}px ${bl}px rgba(16,25,43,${al}), 0 6px 22px rgba(16,25,43,0.08)`,
  )

  // Cursor-following glare
  const glareX = useTransform(rawX, [-1, 1], ['5%', '95%'])
  const glareY = useTransform(rawY, [-1, 1], ['5%', '95%'])
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(ellipse 62% 52% at ${gx} ${gy}, rgba(255,255,255,0.18) 0%, transparent 65%)`,
  )

  // Tilt-reactive metallic border — hot spot tracks the light direction
  const borderGradient = useTransform(
    [rawX, rawY],
    ([x, y]) => {
      const deg = 45 + x * 70 + y * 40
      return `conic-gradient(from ${deg}deg, #8B6914, #B8902A, #D4AF37, #F0D878, #FEFADC, #F0D878, #D4AF37, #B8902A, #8B6914)`
    }
  )

  // Pointer helpers
  const normalize = useCallback((clientX, clientY) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return [0, 0]
    return [
      ((clientX - r.left)  / r.width)  * 2 - 1,
      ((clientY - r.top)   / r.height) * 2 - 1,
    ]
  }, [])

  const onMouseMove  = useCallback(e => {
    if (flipped) return
    const [x, y] = normalize(e.clientX, e.clientY)
    rawX.set(x); rawY.set(y)
  }, [flipped, normalize, rawX, rawY])

  const onMouseEnter = useCallback(() => { setHovering(true);  scaleV.set(1.025) }, [scaleV])
  const onMouseLeave = useCallback(() => {
    setHovering(false)
    rawX.set(0); rawY.set(0); scaleV.set(1)
  }, [rawX, rawY, scaleV])

  const onTouchMove  = useCallback(e => {
    if (!e.touches[0] || flipped) return
    e.preventDefault()
    const [x, y] = normalize(e.touches[0].clientX, e.touches[0].clientY)
    rawX.set(x); rawY.set(y)
  }, [flipped, normalize, rawX, rawY])

  const onTouchStart = useCallback(() => { setHovering(true);  scaleV.set(1.025) }, [scaleV])
  const onTouchEnd   = useCallback(() => {
    setHovering(false)
    rawX.set(0); rawY.set(0); scaleV.set(1)
  }, [rawX, rawY, scaleV])

  // Flip on click
  const onFlip = useCallback(() => {
    const next   = !flipped
    const target = next ? 180 : 0
    setFlipped(next)
    rawX.set(0); rawY.set(0)
    if (reduced) {
      flipAngle.set(target)
    } else {
      fmAnimate(flipAngle, target, FLIP)
    }
  }, [flipped, flipAngle, rawX, rawY, reduced])

  return (
    <div
      ref={ref}
      style={{ width: 420, height: 265, perspective: '1200px' }}
      className="relative select-none cursor-pointer"
      onClick={onFlip}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchMove={onTouchMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="button"
      aria-label={`${candidate.name}'s verified identity card. Trust score ${candidate.trustScore}. Click to flip.`}
    >
      <motion.div
        className="absolute inset-0 rounded-[16px]"
        style={{
          rotateX,
          rotateY,
          scale: scaleV,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          boxShadow,
          borderRadius: '16px',
        }}
        // Floating idle — pauses when hovered or flipped
        animate={hovering || flipped ? { y: 0 } : {
          y: [0, -7, 0],
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <Front candidate={candidate} band={band} merkleSnippet={merkleSnippet} />
        <Back  candidate={candidate} band={band} />

        {/* Glare overlay — visible only on front face while hovering */}
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: '16px' }}
          animate={{ opacity: hovering && !flipped ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="absolute inset-0" style={{ background: glareBg }} />
        </motion.div>

        {/* Shiny metallic border ring — conic gradient hot spot tracks card tilt */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: -1.5, right: -1.5, bottom: -1.5, left: -1.5,
            borderRadius: 17.5,
            padding: 1.5,
            background: borderGradient,
            // Mask technique: XOR of border-box and content-box leaves only
            // the padding ring visible — card content shows through the center
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      </motion.div>
    </div>
  )
}

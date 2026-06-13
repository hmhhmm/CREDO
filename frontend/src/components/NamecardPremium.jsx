import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, useMotionValue, useSpring, useTransform,
  useReducedMotion, animate as fmAnimate,
} from 'framer-motion'
import { GitBranch, Award, FileText, ExternalLink, RotateCcw, Check, Briefcase } from 'lucide-react'
import { getConfidenceBand } from '../utils/confidenceBand'

// ─── Physics ──────────────────────────────────────────────────────────────────
const TILT     = { stiffness: 280, damping: 28, mass: 0.65 }
const SCALE    = { stiffness: 260, damping: 28 }
const FLIP     = { type: 'spring', stiffness: 180, damping: 30 }
const TILT_MAX = 10

// ─── Material ─────────────────────────────────────────────────────────────────
const GRAIN_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="188">' +
  '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>' +
  '<feColorMatrix type="saturate" values="0"/></filter>' +
  '<rect width="300" height="188" filter="url(#g)"/></svg>'
)}`

const CARD_BG = {
  backgroundImage: [
    `url("${GRAIN_URL}")`,
    'linear-gradient(160deg, #161A1F 0%, #14181C 100%)',
  ].join(', '),
  backgroundBlendMode: 'soft-light, normal',
  backgroundRepeat: 'repeat, no-repeat',
  backgroundSize: '300px 188px, 100% 100%',
  boxShadow: 'inset 0 0 0 0.5px #2A2F35',
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_GOLD      = '#C9A646'
const C_GOLD_RING = 'rgba(201,166,70,0.5)'
const C_PRIMARY   = '#E8E6DF'
const C_BODY      = '#8A8F96'
const C_FOOTER    = '#5A5F66'
const C_DIVIDER   = '#2A2F35'
const SERIF       = '"Georgia", "Times New Roman", serif'
const MONO        = '"IBM Plex Mono", "Courier New", monospace'

// ─── Font scale ───────────────────────────────────────────────────────────────
// 42px — trust score (serif, gold)
// 20px — candidate name (serif)
// 11px — readable body (field, university, skills, links)
//  8px — metadata (labels, badges, footer)

// ─── QR finder-pattern placeholder ───────────────────────────────────────────
function QRCode({ size = 52 }) {
  const c = size / 7
  const cells = [
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
    [0,1],[6,1],[0,2],[6,2],[0,3],[6,3],[0,4],[6,4],[0,5],[6,5],
    [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],
    [2,2],[3,2],[4,2],[2,3],[3,3],[4,3],[2,4],[3,4],[4,4],
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: 0.55 }} className="shrink-0">
      {cells.map(([ci, ri], i) => (
        <rect key={i} x={ci * c + 0.4} y={ri * c + 0.4} width={c - 0.8} height={c - 0.8} fill={C_GOLD} rx="0.5" />
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
        backgroundColor: active ? 'rgba(201,166,70,0.10)' : 'rgba(255,255,255,0.04)',
        border: `0.5px solid ${active ? C_GOLD_RING : C_DIVIDER}`,
      }}
      title={`${label} ${active ? '✓ Verified' : '— Not verified'}`}
    >
      <Icon size={9} color={active ? C_GOLD : C_BODY} strokeWidth={2} />
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

  const initials = candidate.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

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
      {/* Gold accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: C_GOLD, opacity: 0.65 }} />

      {/* Decorative concentric rings — centered at top-right corner, clipped by overflow */}
      <div aria-hidden className="absolute pointer-events-none" style={{
        top: -115, right: -115, width: 230, height: 230,
        borderRadius: '50%', border: '0.5px solid rgba(201,166,70,0.18)',
      }} />
      <div aria-hidden className="absolute pointer-events-none" style={{
        top: -78, right: -78, width: 156, height: 156,
        borderRadius: '50%', border: '0.5px solid rgba(201,166,70,0.10)',
      }} />

      {/* Top row — CREDO wordmark + tagline + agent dots */}
      <div className="flex items-start justify-between px-6 pt-[18px]">
        <div>
          <span
            style={{
              fontSize: 19,
              fontFamily: SERIF,
              fontWeight: 600,
              letterSpacing: '0.2em',
              color: C_GOLD,
              display: 'block',
            }}
          >
            CREDO
          </span>
          <p style={{
            fontSize: 9,
            fontFamily: MONO,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: C_BODY,
            marginTop: 5,
          }}>
            Verified career identity
          </p>
        </div>
        <div className="flex items-center gap-[5px]">
          <AgentDot active={hasGH}  icon={GitBranch} hex={band.hex} label="GitHub" />
          <AgentDot active={hasCR}  icon={Award}     hex={band.hex} label="Credential" />
          <AgentDot active={hasDOC} icon={FileText}  hex={band.hex} label="Document" />
        </div>
      </div>

      {/* Main content — identity left, trust score right */}
      <div className="flex-1 flex items-end justify-between px-6">

        {/* Identity — monogram + name + field + university */}
        <div className="pb-[18px]">

          {/* Circular monogram */}
          <div style={{
            width: 36, height: 36,
            borderRadius: '50%',
            border: `0.5px solid ${C_GOLD}`,
            backgroundColor: 'rgba(201,166,70,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}>
            <span style={{
              fontSize: 12,
              fontFamily: SERIF,
              fontWeight: 500,
              color: C_GOLD,
              letterSpacing: '0.06em',
            }}>
              {initials}
            </span>
          </div>

          <h2 style={{
            fontSize: 20,
            fontFamily: SERIF,
            fontWeight: 600,
            letterSpacing: '0.04em',
            lineHeight: 1.2,
            color: C_PRIMARY,
            marginBottom: 4,
          }}>
            {candidate.name}
          </h2>
          <p style={{ fontSize: 11, lineHeight: 1.6, color: C_BODY, fontFamily: MONO }}>
            {candidate.field}
          </p>
          <p style={{ fontSize: 11, lineHeight: 1.6, color: C_BODY, fontFamily: MONO }}>
            {candidate.university}
          </p>
          {candidate.openToWork && (
            <div className="flex items-center gap-[5px] mt-[8px]">
              <span className="w-[5px] h-[5px] rounded-full inline-block" style={{ backgroundColor: C_GOLD }} />
              <span style={{
                fontSize: 8, fontFamily: MONO,
                textTransform: 'uppercase', letterSpacing: '0.2em', color: C_GOLD,
              }}>
                Open to Work
              </span>
            </div>
          )}
        </div>

        {/* Trust score — hero element */}
        <div className="text-right pb-[14px]">
          <div className="flex items-baseline justify-end gap-[2px]">
            <span style={{
              fontSize: 42,
              fontFamily: SERIF,
              fontWeight: 600,
              color: C_GOLD,
              lineHeight: 1,
            }}>
              {candidate.trustScore}
            </span>
            <span style={{
              fontSize: 8, fontFamily: MONO,
              paddingBottom: 4, color: C_FOOTER,
            }}>
              /100
            </span>
          </div>
          {/* Trust label removed — score speaks for itself */}
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className="flex items-center justify-between px-6 py-[9px]"
        style={{ borderTop: `0.5px solid ${C_DIVIDER}` }}
      >
        {/* Verification badge pills — outline only, gold */}
        <div className="flex items-center gap-[6px]">
          {anyVerif ? (
            [{ v: hasGH, l: 'GitHub' }, { v: hasCR, l: 'Credential' }, { v: hasDOC, l: 'Document' }]
              .filter(x => x.v)
              .map(({ l }) => (
                <span key={l} style={{
                  fontSize: 8,
                  fontFamily: MONO,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: C_GOLD,
                  border: `0.5px solid ${C_GOLD_RING}`,
                  borderRadius: 100,
                  padding: '1px 7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  <Check size={6} strokeWidth={2.5} />{l}
                </span>
              ))
          ) : (
            <span style={{ fontSize: 8, fontFamily: MONO, color: C_FOOTER }}>No verified artifacts</span>
          )}
        </div>

        {/* Footer right — domain only */}
        <span style={{
          fontSize: 8, fontFamily: MONO,
          letterSpacing: '0.1em', color: C_FOOTER,
        }}>
          credo.app
        </span>
      </div>
    </div>
  )
}

// ─── Back face ────────────────────────────────────────────────────────────────
function Back({ candidate, band }) {
  const topSkills = (candidate.verifiedSkills || []).slice(0, 3)
  const initials  = candidate.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const simu      = candidate.simuHire
  const verCount  = (candidate.artifacts || []).filter(a => a.status === 'verified').length
  const hasMerkle = !!candidate.merkleRoot

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
      {/* Gold accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: C_GOLD, opacity: 0.65 }} />

      {/* Decorative concentric rings — mirrored to top-left on back face */}
      <div aria-hidden className="absolute pointer-events-none" style={{
        top: -115, left: -115, width: 230, height: 230,
        borderRadius: '50%', border: '0.5px solid rgba(201,166,70,0.18)',
      }} />
      <div aria-hidden className="absolute pointer-events-none" style={{
        top: -78, left: -78, width: 156, height: 156,
        borderRadius: '50%', border: '0.5px solid rgba(201,166,70,0.10)',
      }} />

      {/* Top row: skills label + QR */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <p style={{
            fontSize: 8, fontFamily: MONO,
            textTransform: 'uppercase', letterSpacing: '0.25em',
            color: C_FOOTER, marginBottom: 10,
          }}>
            Verified Evidence
          </p>

          {topSkills.length > 0 ? (
            <div className="space-y-[7px]">
              {topSkills.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C_PRIMARY }}>{s.name}</span>
                    <span style={{
                      fontSize: 11, fontFamily: MONO,
                      fontWeight: 500, color: C_GOLD,
                      display: 'flex', alignItems: 'center', gap: 3,
                    }} className="shrink-0">
                      {s.confidence} <Check size={8} strokeWidth={2.5} />
                    </span>
                  </div>
                  {/* Progress bar — track + gold fill proportional to score */}
                  <div style={{ height: 2, backgroundColor: C_DIVIDER, borderRadius: 1, marginTop: 3 }}>
                    <div style={{
                      height: '100%', width: `${s.confidence}%`,
                      backgroundColor: C_GOLD, opacity: 0.25, borderRadius: 1,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 11, fontFamily: MONO, color: C_BODY }}>
              No verified skills yet
            </p>
          )}
        </div>

        {/* QR code — hidden */}
      </div>

      {/* Divider */}
      <div style={{ borderTop: `0.5px solid ${C_DIVIDER}`, marginBottom: 7 }} />

      {/* SimuHire */}
      {simu?.completed && simu?.shared ? (
        <div className="flex items-center gap-[8px] mb-[5px]">
          <span style={{
            fontSize: 8, fontFamily: MONO,
            textTransform: 'uppercase', letterSpacing: '0.2em', color: C_GOLD,
            border: `0.5px solid ${C_GOLD_RING}`,
            borderRadius: 100, padding: '1px 7px',
          }}>
            SimuHire
          </span>
          <span style={{ fontSize: 11, fontFamily: MONO, color: C_PRIMARY }}>
            {simu.type}
            <span style={{ color: C_FOOTER }}> · </span>
            <span style={{ color: C_GOLD }}>{simu.overallScore}/100</span>
          </span>
        </div>
      ) : (
        <p style={{ fontSize: 8, fontFamily: MONO, color: C_FOOTER, marginBottom: 6, opacity: 0.7 }}>
          SimuHire not completed
        </p>
      )}

      {/* Artifact + Merkle — pill badges in neutral gray */}
      {verCount > 0 && (
        <div className="flex items-center gap-[5px] mb-auto">
          <span style={{
            fontSize: 8, fontFamily: MONO,
            textTransform: 'uppercase', letterSpacing: '0.15em',
            color: C_BODY, border: `0.5px solid ${C_BODY}`,
            borderRadius: 100, padding: '1px 6px',
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            <Check size={6} strokeWidth={2.5} /> {verCount} artifact{verCount !== 1 ? 's' : ''} verified
          </span>
          {hasMerkle && (
            <span style={{
              fontSize: 8, fontFamily: MONO,
              textTransform: 'uppercase', letterSpacing: '0.15em',
              color: C_BODY, border: `0.5px solid ${C_BODY}`,
              borderRadius: 100, padding: '1px 6px',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              🔒 Merkle intact
            </span>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div
        className="flex items-center justify-between pt-[9px] mt-auto"
        style={{ borderTop: `0.5px solid ${C_DIVIDER}` }}
      >
        <Link
          to={`/portfolio/${candidate.id}`}
          className="flex items-center gap-[4px] hover:opacity-60 transition-opacity"
          style={{ fontSize: 11, fontFamily: MONO, color: C_PRIMARY }}
          onClick={e => e.stopPropagation()}
        >
          View Portfolio <ExternalLink size={8} />
        </Link>
        <span style={{
          fontSize: 8, fontFamily: MONO,
          letterSpacing: '0.1em', color: C_FOOTER,
        }}>
          credo.app
        </span>
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
  const rawX      = useSpring(0, TILT)
  const rawY      = useSpring(0, TILT)
  const scaleV    = useSpring(1, SCALE)
  const flipAngle = useMotionValue(0)

  const band          = getConfidenceBand(candidate.trustScore)
  const merkleSnippet = candidate.merkleRoot
    ? `${candidate.merkleRoot.slice(0, 8)}···${candidate.merkleRoot.slice(-4)}`
    : null

  const tiltFade = useTransform(flipAngle, [0, 90, 180], [1, 0, 0])

  const rotateY = useTransform(
    [flipAngle, rawX, tiltFade],
    ([fa, rx, tf]) => fa + rx * TILT_MAX * tf,
  )
  const rotateX = useTransform(
    [rawY, tiltFade],
    ([ry, tf]) => ry * -TILT_MAX * tf,
  )

  // Deep drop-shadow for dark card
  const shadowX     = useTransform(rawX, [-1, 1], [20, -20])
  const shadowY     = useTransform(rawY, [-1, 1], [-20, 20])
  const shadowBlur  = useTransform([rawX, rawY], ([x, y]) => 32 + Math.sqrt(x * x + y * y) * 30)
  const shadowAlpha = useTransform([rawX, rawY], ([x, y]) => 0.55 + Math.sqrt(x * x + y * y) * 0.20)
  const boxShadow   = useTransform(
    [shadowX, shadowY, shadowBlur, shadowAlpha],
    ([sx, sy, bl, al]) =>
      `${sx}px ${sy}px ${bl}px rgba(0,0,0,${al}), 0 8px 40px rgba(0,0,0,0.6)`,
  )

  // Glare — subtle on dark
  const glareX  = useTransform(rawX, [-1, 1], ['5%', '95%'])
  const glareY  = useTransform(rawY, [-1, 1], ['5%', '95%'])
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(ellipse 62% 52% at ${gx} ${gy}, rgba(255,255,255,0.07) 0%, transparent 65%)`,
  )

  // Border ring — dark metallic tones matching #2A2F35 palette
  const borderGradient = useTransform(
    [rawX, rawY],
    ([x, y]) => {
      const deg = 45 + x * 70 + y * 40
      return `conic-gradient(from ${deg}deg, #1E2328, #252B32, #323840, #3A4048, #323840, #252B32, #1E2328)`
    }
  )

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
        animate={hovering || flipped ? { y: 0 } : {
          y: [0, -7, 0],
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <Front candidate={candidate} band={band} merkleSnippet={merkleSnippet} />
        <Back  candidate={candidate} band={band} />

        {/* Glare overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: '16px' }}
          animate={{ opacity: hovering && !flipped ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="absolute inset-0" style={{ background: glareBg }} />
        </motion.div>

        {/* Subtle dark metallic border ring — tilt-reactive sheen */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: -0.5, right: -0.5, bottom: -0.5, left: -0.5,
            borderRadius: 16.5,
            padding: 0.5,
            background: borderGradient,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      </motion.div>
    </div>
  )
}

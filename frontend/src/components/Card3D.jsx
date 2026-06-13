import { useRef, useState, useCallback } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

const SPRING_CFG  = { stiffness: 300, damping: 30, mass: 0.6 }
const SCALE_CFG   = { stiffness: 260, damping: 28 }
const MAX_TILT    = 18
const GLARE_ALPHA = 0.18

export default function Card3D({ children, className = '', floatAmplitude = 8 }) {
  const ref      = useRef(null)
  const [hover, setHover] = useState(false)

  // Normalised cursor position: -1 to 1 on each axis
  const rawX = useSpring(0, SPRING_CFG)
  const rawY = useSpring(0, SPRING_CFG)
  const scaleV = useSpring(1, SCALE_CFG)

  // 3D tilt
  const rotateX = useTransform(rawY, [-1, 1], [ MAX_TILT, -MAX_TILT])
  const rotateY = useTransform(rawX, [-1, 1], [-MAX_TILT,  MAX_TILT])

  // Shadow components — all derived at the top level
  const shadowX = useTransform(rawX, [-1, 1], [20, -20])
  const shadowY = useTransform(rawY, [-1, 1], [-20, 20])
  const shadowBlur = useTransform(
    [rawX, rawY],
    ([x, y]) => 24 + Math.sqrt(x * x + y * y) * 28
  )
  const shadowAlpha = useTransform(
    [rawX, rawY],
    ([x, y]) => 0.13 + Math.sqrt(x * x + y * y) * 0.14
  )
  const boxShadow = useTransform(
    [shadowX, shadowY, shadowBlur, shadowAlpha],
    ([sx, sy, bl, al]) =>
      `${sx}px ${sy}px ${bl}px rgba(16,25,43,${al}), 0 4px 12px rgba(16,25,43,0.07)`
  )

  // Glare position
  const glareX = useTransform(rawX, [-1, 1], ['5%', '95%'])
  const glareY = useTransform(rawY, [-1, 1], ['5%', '95%'])
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(ellipse 65% 55% at ${gx} ${gy}, rgba(255,255,255,${GLARE_ALPHA}) 0%, transparent 70%)`
  )

  // Helpers
  const normalize = useCallback((clientX, clientY) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return [0, 0]
    return [
      ((clientX - r.left) / r.width)  * 2 - 1,
      ((clientY - r.top)  / r.height) * 2 - 1,
    ]
  }, [])

  const handleMouseMove = useCallback((e) => {
    const [x, y] = normalize(e.clientX, e.clientY)
    rawX.set(x); rawY.set(y)
  }, [normalize, rawX, rawY])

  const handleMouseEnter = useCallback(() => {
    setHover(true); scaleV.set(1.03)
  }, [scaleV])

  const handleMouseLeave = useCallback(() => {
    setHover(false)
    rawX.set(0); rawY.set(0); scaleV.set(1)
  }, [rawX, rawY, scaleV])

  const handleTouchMove = useCallback((e) => {
    if (!e.touches[0]) return
    e.preventDefault()
    const [x, y] = normalize(e.touches[0].clientX, e.touches[0].clientY)
    rawX.set(x); rawY.set(y)
  }, [normalize, rawX, rawY])

  const handleTouchStart = useCallback(() => {
    setHover(true); scaleV.set(1.03)
  }, [scaleV])

  const handleTouchEnd = useCallback(() => {
    setHover(false)
    rawX.set(0); rawY.set(0); scaleV.set(1)
  }, [rawX, rawY, scaleV])

  return (
    <div
      ref={ref}
      className={`relative select-none ${className}`}
      style={{ perspective: '900px' }}
    >
      <motion.div
        className="relative"
        style={{
          rotateX,
          rotateY,
          scale: scaleV,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        animate={hover ? { y: 0 } : {
          y: [0, -floatAmplitude, 0],
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Dynamic shadow layer (behind card) */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-card -z-10"
          style={{ boxShadow }}
        />

        {/* Card content */}
        {children}

        {/* Glass glare overlay */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-card overflow-hidden"
          animate={{ opacity: hover ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: glareBackground }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

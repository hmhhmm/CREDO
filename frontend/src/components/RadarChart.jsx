// Radar chart for the five SimuHire evaluation dimensions. `dims` is an object
// of { dimKey: 0-100 }. Pure presentational; no app state.
export default function RadarChart({ dims, size = 160 }) {
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.35
  const keys = Object.keys(dims)
  const n = keys.length

  const pt = (i, val) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2
    const rv = (val / 100) * r
    return [cx + rv * Math.cos(angle), cy + rv * Math.sin(angle)]
  }

  const gridPoly = (level) =>
    keys.map((_, i) => {
      const angle = (i * 2 * Math.PI / n) - Math.PI / 2
      const rv = (level / 100) * r
      return `${cx + rv * Math.cos(angle)},${cy + rv * Math.sin(angle)}`
    }).join(' ')

  const dataPoly = keys.map((k, i) => pt(i, dims[k]).join(',')).join(' ')

  const shortLabel = {
    adaptability: 'Adapt', communication: 'Comm',
    problemSolving: 'Problem', stressResponse: 'Stress', systemsThinking: 'Systems',
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {[25, 50, 75, 100].map(lvl => (
        <polygon key={lvl} points={gridPoly(lvl)} fill="none" stroke="#DCD2BC" strokeWidth="0.8" />
      ))}
      {keys.map((_, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#DCD2BC" strokeWidth="0.8" />
      })}
      <polygon points={dataPoly} fill="#1F7A5C" fillOpacity="0.15" stroke="#1F7A5C" strokeWidth="1.5" />
      {keys.map((k, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        const lr = r + size * 0.12
        const [lx, ly] = [cx + lr * Math.cos(angle), cy + lr * Math.sin(angle)]
        return (
          <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize={size * 0.048} fill="#6B7785" fontFamily="IBM Plex Mono, monospace">
            {shortLabel[k]}
          </text>
        )
      })}
    </svg>
  )
}

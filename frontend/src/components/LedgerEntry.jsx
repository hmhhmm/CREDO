export default function LedgerEntry({ entry }) {
  return (
    <div className="grid grid-cols-4 gap-2 py-2 border-b border-line last:border-0 text-xs font-mono">
      <span className="text-slate">#{entry.blockIndex}</span>
      <span className="text-ink truncate">{entry.leafHash.slice(0, 16)}…</span>
      <span className="text-ink truncate">{entry.prevHash.slice(0, 16)}…</span>
      <span className="text-slate">{new Date(entry.timestamp).toLocaleDateString()}</span>
    </div>
  )
}

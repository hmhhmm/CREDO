export function getConfidenceBand(score) {
  if (score >= 80) return { label: 'Highly Authentic', color: 'verified', hex: '#1F7A5C' }
  if (score >= 60) return { label: 'Authentic', color: 'blue', hex: '#2563EB' }
  if (score >= 40) return { label: 'Inconclusive', color: 'pending', hex: '#D9A441' }
  return { label: 'Low Confidence', color: 'alert', hex: '#C4503A' }
}

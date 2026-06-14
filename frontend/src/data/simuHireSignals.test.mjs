import assert from 'node:assert/strict'
import { matchSignals, SIGNAL_WEIGHT, signals, fallbackSignals } from './simuHireSignals.js'

// Keyword match returns the matching signal
assert.deepEqual(
  matchSignals('I would reproduce the issue locally', new Set(), 0).map(s => s.id),
  ['reproduce'],
)

// Multiple keywords in one message fire multiple signals
assert.deepEqual(
  matchSignals('reproduce locally then check the console logs', new Set(), 1).map(s => s.id).sort(),
  ['logs', 'reproduce'],
)

// No keyword match → the stage's fallback signal fires
assert.deepEqual(
  matchSignals('um ok sure', new Set(), 0).map(s => s.id),
  ['fb-setup'],
)

// A signal already shown is not returned again (dedup)
assert.deepEqual(
  matchSignals('reproduce locally', new Set(['reproduce']), 0).map(s => s.id),
  ['fb-setup'], // reproduce filtered out, no other match → fallback
)

// Fallback already shown → nothing returned
assert.deepEqual(
  matchSignals('um ok sure', new Set(['fb-setup']), 0).map(s => s.id),
  [],
)

// Sanity on shape
assert.ok(signals.length >= 8)
assert.equal(fallbackSignals.length, 4)
assert.equal(typeof SIGNAL_WEIGHT, 'number')

console.log('simuHireSignals: all assertions passed')

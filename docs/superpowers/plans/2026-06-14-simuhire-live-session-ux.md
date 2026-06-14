# SimuHire Live Session UX (Unit A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SimuHire active-session screen feel alive — accumulating "signal" chips that drive the indicator bars, word-by-word streaming of the Scenario Master's replies, and a bottom-anchored conversation layout.

**Architecture:** Pure frontend, no backend. A new data module holds keyword-matched signal definitions + a `matchSignals` helper; the session component fires signals on each candidate submit, derives the five indicator values purely from accumulated signals, streams scripted replies via a small reveal helper, and renders the right column through an extracted `SessionSidePanel`. `RadarChart` is extracted to its own component so both the session and the side panel can use it.

**Tech Stack:** React 19, Vite, Tailwind, lucide-react. Pure-logic verified with `node` + `node:assert`; browser behavior verified with Playwright driving the installed Google Chrome (`channel: 'chrome'`, fake media stream).

---

## File Structure

- **Create** `frontend/src/data/simuHireSignals.js` — signal definitions, stage fallbacks, `dimLabels`, `SIGNAL_WEIGHT`, and `matchSignals()`. One responsibility: signal data + matching logic.
- **Create** `frontend/src/data/simuHireSignals.test.mjs` — node assertion test for `matchSignals`.
- **Create** `frontend/src/components/RadarChart.jsx` — the radar chart, extracted from `SimuHireSession.jsx` unchanged.
- **Create** `frontend/src/components/SessionSidePanel.jsx` — right column: camera feed, signal chips, demoted radar, indicator bars.
- **Modify** `frontend/src/pages/SimuHireSession.jsx` — signal state + derived indicators, fire signals in `handleSubmit`, streaming reveal, bottom-anchored layout, use the two new components.

## Prerequisites (one-time, not committed)

- [ ] **Dev server running:** `cd frontend && npm run dev` (serves http://localhost:5173). Leave it running; Vite hot-reloads each change.
- [ ] **Playwright available for browser verification:**

Run: `cd frontend && npm i -D playwright`
Expected: playwright added to devDependencies. Browser binaries are NOT needed — the verify scripts use the installed Google Chrome via `channel: 'chrome'`.

---

## Task 1: Signal data module + matcher (pure logic, TDD)

**Files:**
- Create: `frontend/src/data/simuHireSignals.js`
- Test: `frontend/src/data/simuHireSignals.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/data/simuHireSignals.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && node src/data/simuHireSignals.test.mjs`
Expected: FAIL — `Cannot find module './simuHireSignals.js'`.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/data/simuHireSignals.js`:

```js
// Live "signals" surfaced during a SimuHire session. Each signal fires at most
// once; `dim` is one of the five evaluation dimensions, `weight` (SIGNAL_WEIGHT)
// is added to that dimension's indicator when the signal fires.

export const dimLabels = {
  adaptability:    'Adaptability',
  communication:   'Communication',
  problemSolving:  'Problem-Solving',
  stressResponse:  'Stress Response',
  systemsThinking: 'Systems Thinking',
}

export const SIGNAL_WEIGHT = 25 // added to a dimension when a signal fires (capped at 100)

export const signals = [
  { id: 'reproduce', label: 'Reproduced before fixing',    dim: 'problemSolving',
    keywords: [/reproduc/i, /replicat/i, /staging/i, /\blocally\b/i, /\brepro\b/i] },
  { id: 'logs',      label: 'Checked logs / evidence',      dim: 'systemsThinking',
    keywords: [/\blogs?\b/i, /console/i, /stack ?trace/i, /network tab/i, /error message/i] },
  { id: 'scope',     label: 'Scoped the impact',            dim: 'systemsThinking',
    keywords: [/how many/i, /\bimpact\b/i, /affected/i, /\bscope\b/i, /\b20\s?%/i, /percentage/i] },
  { id: 'rootcause', label: 'Identified the root cause',    dim: 'problemSolving',
    keywords: [/undefined/i, /\bnull\b/i, /\btrim\b/i, /optional/i, /root cause/i, /phone field/i] },
  { id: 'escalate',  label: 'Escalated appropriately',      dim: 'communication',
    keywords: [/tech lead/i, /\bslack\b/i, /\bnotify\b/i, /escalat/i, /message (the|my)/i] },
  { id: 'client',    label: 'Managed client communication', dim: 'communication',
    keywords: [/\bclient\b/i, /customer/i, /expectation/i, /update them/i, /let them know/i] },
  { id: 'rollback',  label: 'Weighed rollback / risk',      dim: 'adaptability',
    keywords: [/rollback/i, /revert/i, /\brisk\b/i, /regression/i, /break (anything|something)/i] },
  { id: 'approval',  label: 'Respected merge approval',     dim: 'stressResponse',
    keywords: [/approval/i, /branch protection/i, /can.?t merge/i, /permission/i, /wait for/i] },
  { id: 'triage',    label: 'Stayed calm and triaged',      dim: 'stressResponse',
    keywords: [/prioriti/i, /triage/i, /one (thing|step) at a time/i, /stay calm/i, /first.*then/i] },
  { id: 'process',   label: 'Proposed a process fix',       dim: 'systemsThinking',
    keywords: [/code review/i, /\btest(s|ing)?\b/i, /\blint/i, /prevent/i, /post-?mortem/i, /\bPR\b/] },
]

// Index 0-3 = stage index. Fired when a candidate message matches no signal,
// mapped to that stage's primary dimension so a bar still moves.
export const fallbackSignals = [
  { id: 'fb-setup',      label: 'Engaged with the problem',   dim: 'problemSolving' },
  { id: 'fb-challenge',  label: 'Adapted to new information', dim: 'adaptability'   },
  { id: 'fb-escalation', label: 'Managed competing demands',  dim: 'stressResponse' },
  { id: 'fb-resolution', label: 'Worked toward a decision',   dim: 'communication'  },
]

// Returns keyword-matched signals not already shown. If none match, returns the
// stage's fallback signal (unless it too was already shown). `shownIds` is a Set.
export function matchSignals(text, shownIds, stageIndex) {
  const matched = signals.filter(s => !shownIds.has(s.id) && s.keywords.some(k => k.test(text)))
  if (matched.length) return matched
  const fb = fallbackSignals[stageIndex]
  return fb && !shownIds.has(fb.id) ? [fb] : []
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && node src/data/simuHireSignals.test.mjs`
Expected: PASS — prints `simuHireSignals: all assertions passed`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/simuHireSignals.js frontend/src/data/simuHireSignals.test.mjs
git commit -m "feat(simuhire): signal definitions + matchSignals helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Extract RadarChart into its own component

**Files:**
- Create: `frontend/src/components/RadarChart.jsx`
- Modify: `frontend/src/pages/SimuHireSession.jsx`

- [ ] **Step 1: Create the RadarChart component**

Create `frontend/src/components/RadarChart.jsx` — move the existing chart verbatim, exported as default:

```jsx
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
```

- [ ] **Step 2: Remove the inline RadarChart from SimuHireSession.jsx and import the component**

In `frontend/src/pages/SimuHireSession.jsx`, delete the entire `function RadarChart({ dims, size = 160 }) { ... }` block (the `// ─── Radar chart ───` section, lines ~32-84) including its section comment.

Then add this import near the top, after the existing `import { mockSimuHireSession } from '../data/mockData'` line:

```jsx
import RadarChart from '../components/RadarChart'
```

- [ ] **Step 3: Verify the app still renders (no behavior change yet)**

Run: `cd frontend && npx vite build`
Expected: build succeeds with no "RadarChart is not defined" error.

(Alternatively, with the dev server running, reload http://localhost:5173/simuhire/session-demo, consent, Begin — the radar still appears as before.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/RadarChart.jsx frontend/src/pages/SimuHireSession.jsx
git commit -m "refactor(simuhire): extract RadarChart into its own component

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Signal-driven indicators + SessionSidePanel

**Files:**
- Create: `frontend/src/components/SessionSidePanel.jsx`
- Modify: `frontend/src/pages/SimuHireSession.jsx`

- [ ] **Step 1: Create the SessionSidePanel component**

Create `frontend/src/components/SessionSidePanel.jsx`:

```jsx
import { Check } from 'lucide-react'
import RadarChart from './RadarChart'
import { dimLabels } from '../data/simuHireSignals'

// Small left-accent tint per dimension for the signal chips.
const dimAccent = {
  adaptability:    'border-l-pending',
  communication:   'border-l-verified',
  problemSolving:  'border-l-ink',
  stressResponse:  'border-l-alert',
  systemsThinking: 'border-l-slate',
}

// Right column of the active session: camera feed, accumulating signal chips,
// a demoted radar summary, and the five indicator bars (derived from signals).
export default function SessionSidePanel({ videoRef, cameraStream, signals, indicators }) {
  return (
    <div className="w-64 shrink-0 flex flex-col">
      {/* Camera feed */}
      <div className="p-3 border-b border-line">
        <div className="w-full rounded-card overflow-hidden bg-[#1a1a1a] aspect-video">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', display: cameraStream ? 'block' : 'none' }}
          />
        </div>
      </div>

      {/* Signals observed */}
      <div className="p-3 border-b border-line">
        <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Signals observed</p>
        {signals.length === 0 ? (
          <p className="text-xs text-slate leading-relaxed">Signals appear as you work through the scenario.</p>
        ) : (
          <div className="space-y-1.5">
            {signals.map(s => (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 text-xs text-ink bg-parchment-shade border-l-2 ${dimAccent[s.dim] || 'border-l-slate'} rounded-card px-2 py-1 motion-safe:animate-[fadeIn_0.3s_ease-out]`}
              >
                <Check size={11} className="text-verified shrink-0" /> {s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demoted radar + indicator bars */}
      <div className="flex-1 p-4 flex flex-col items-center overflow-y-auto">
        <RadarChart dims={indicators} size={120} />
        <div className="w-full mt-4 space-y-2.5">
          {Object.entries(indicators).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-slate w-16 shrink-0 truncate">{dimLabels[k]}</span>
              <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                <div className="h-full bg-verified rounded-full transition-all duration-700" style={{ width: `${v}%` }} />
              </div>
              <span className="text-xs font-mono text-ink w-6 text-right shrink-0">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate mt-5 text-center leading-relaxed italic">
          Indicative only — Evaluator scores the full transcript at the end.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the `fadeIn` keyframe to Tailwind config**

In `frontend/tailwind.config.js`, inside `theme.extend`, add (merge with any existing `keyframes`/`animation` keys):

```js
keyframes: {
  fadeIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
},
```

(If `theme.extend` already has `keyframes`, add the `fadeIn` entry to it rather than duplicating the key.)

- [ ] **Step 3: Wire signals + derived indicators into SimuHireSession.jsx**

In `frontend/src/pages/SimuHireSession.jsx`:

(a) Update the React import to include `useMemo`:

```jsx
import { useState, useRef, useEffect, useMemo } from 'react'
```

(b) Add imports after the `import RadarChart from '../components/RadarChart'` line:

```jsx
import SessionSidePanel from '../components/SessionSidePanel'
import { matchSignals, SIGNAL_WEIGHT } from '../data/simuHireSignals'
```

(c) Delete the local `const dimLabels = { ... }` block near the top of the file (the `adaptability: 'Adaptability'` ... object). It now lives in the signals module. Then add an import for it (used by `SetupScreen`):

```jsx
import { dimLabels } from '../data/simuHireSignals'
```

(d) Replace this state line:

```jsx
  const [indicators,      setIndicators]      = useState(session.stageIndicators[0])
```

with:

```jsx
  const [shownSignals, setShownSignals] = useState([])
```

(e) Immediately after the `const [stageReplyCount, setStageReplyCount] = useState(0)` line, add the derived indicators:

```jsx
  const indicators = useMemo(() => {
    const base = { adaptability: 0, communication: 0, problemSolving: 0, stressResponse: 0, systemsThinking: 0 }
    for (const s of shownSignals) base[s.dim] = Math.min(100, base[s.dim] + SIGNAL_WEIGHT)
    return base
  }, [shownSignals])
```

(f) In `handleSubmit`, right after `setInput('')` and before `setWaiting(true)`, fire signals from the candidate's input:

```jsx
    const shownIds = new Set(shownSignals.map(s => s.id))
    const fired = matchSignals(input, shownIds, currentStage)
    if (fired.length) {
      setShownSignals(prev => [...prev, ...fired.map(s => ({ id: s.id, label: s.label, dim: s.dim }))])
    }
```

(g) In the stage-advance branch of `handleSubmit`, delete this now-obsolete line (indicators are derived from signals, not stages):

```jsx
          setIndicators(session.stageIndicators[newStage])
```

(h) Replace the entire right-column block — the `{/* Right: live indicators */}` `<div className="w-64 shrink-0 flex flex-col"> ... </div>` (everything from that comment through its closing `</div>` just before the final `{/* Body */}` wrapper closes) — with:

```jsx
        {/* Right: camera + signals + indicators */}
        <SessionSidePanel
          videoRef={videoRef}
          cameraStream={cameraStream}
          signals={shownSignals}
          indicators={indicators}
        />
```

- [ ] **Step 4: Write the browser verification script**

Create `frontend/verify-a3.mjs`:

```js
import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:5173/simuhire/session-demo', { waitUntil: 'networkidle' })
await page.locator('input[type="checkbox"]').first().check()
await page.getByRole('button', { name: /Begin Simulation/i }).click()
await page.waitForTimeout(800)

// Keyword message → matching chips appear and bars climb
await page.locator('textarea').first().fill('I would reproduce the issue locally and check the console logs first.')
await page.getByRole('button', { name: /Respond to scenario|Submit/i }).first().click()
await page.waitForTimeout(600)
const reproduce = await page.getByText('Reproduced before fixing').count()
const logs = await page.getByText('Checked logs / evidence').count()
console.log('[chips] reproduce:', reproduce, '| logs:', logs)

// Problem-Solving and Systems Thinking bars should now read 25
const has25 = await page.getByText('25', { exact: true }).count()
console.log('[bars] cells showing 25:', has25)

await page.screenshot({ path: 'verify-a3.png' })
await browser.close()
console.log('DONE')
```

- [ ] **Step 5: Run the verification**

Run: `cd frontend && node verify-a3.mjs`
Expected output includes `[chips] reproduce: 1 | logs: 1` and `[bars] cells showing 25:` a value `>= 2`, then `DONE`. Open `verify-a3.png` and confirm the "Signals observed" chips are visible and the bars are no longer all zero.

- [ ] **Step 6: Clean up the throwaway script and commit**

```bash
rm -f frontend/verify-a3.mjs frontend/verify-a3.png
git add frontend/src/components/SessionSidePanel.jsx frontend/src/pages/SimuHireSession.jsx frontend/tailwind.config.js
git commit -m "feat(simuhire): accumulating signal chips drive live indicators

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Stream the Scenario Master's replies

**Files:**
- Modify: `frontend/src/pages/SimuHireSession.jsx`

- [ ] **Step 1: Add streaming state + reveal helper**

In `frontend/src/pages/SimuHireSession.jsx`, after the `const [cameraStream, setCameraStream] = useState(null)` line, add:

```jsx
  const [streaming, setStreaming] = useState(null) // { speaker, shown } | null
  const streamTimer = useRef(null)
```

After the existing camera/video effects, add a cleanup effect and the reveal helper (place the helper just above `handleSubmit`):

```jsx
  useEffect(() => () => clearInterval(streamTimer.current), [])

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // Reveal an interviewer/stakeholder reply word-by-word, then commit it to
  // `messages`. Reduced-motion users get the full text immediately.
  const streamReply = (speaker, full, onDone) => {
    if (prefersReducedMotion()) {
      setMessages(prev => [...prev, { id: prev.length + 1, speaker, text: full }])
      onDone?.()
      return
    }
    const words = full.split(' ')
    let i = 0
    setStreaming({ speaker, shown: '' })
    streamTimer.current = setInterval(() => {
      i += 1
      if (i >= words.length) {
        clearInterval(streamTimer.current)
        setStreaming(null)
        setMessages(prev => [...prev, { id: prev.length + 1, speaker, text: full }])
        onDone?.()
      } else {
        setStreaming({ speaker, shown: words.slice(0, i).join(' ') })
      }
    }, 40)
  }
```

- [ ] **Step 2: Rewrite the reply branches in handleSubmit to stream**

Replace the entire `setTimeout(() => { ... }, 2000)` body inside `handleSubmit` (the block that branches on `scriptedResponses` / `stageResponses`) with:

```jsx
    setTimeout(() => {
      if (scriptedResponses[candidateCount]) {
        // Early scripted exchanges — stream each reply in sequence
        const replies = scriptedResponses[candidateCount].messages
        const playNext = (idx) => {
          if (idx >= replies.length) { setWaiting(false); return }
          streamReply(replies[idx].speaker, replies[idx].text, () => playNext(idx + 1))
        }
        playNext(0)
      } else {
        const pool = stageResponses[currentStage] || []
        if (stageReplyCount < pool.length) {
          // Ask the next follow-up question in this stage sequentially
          const q = pool[stageReplyCount]
          setStageReplyCount(r => r + 1)
          streamReply('interviewer', q, () => setWaiting(false))
        } else if (currentStage < stages.length - 1) {
          // All questions for this stage done — advance to next stage
          const newStage = currentStage + 1
          setCurrentStage(newStage)
          setStageReplyCount(0)
          setStageTransition(stages[newStage])
          setTimeout(() => setStageTransition(null), 2500)
          setMessages(prev => [...prev,
            { id: prev.length + 1, speaker: 'system', text: `— Stage ${newStage + 1}: ${stages[newStage]} —` },
          ])
          streamReply('interviewer', stageMessages[newStage], () => setWaiting(false))
        } else {
          // All stages done — close the session
          setFinalSubmitted(true)
          streamReply('interviewer',
            "Thank you — that's all the questions for today's simulation. You've worked through some challenging situations and I appreciated seeing your reasoning process. The Evaluator agent will now score your full transcript. Your Behavioral Traits Report will be ready in a moment.",
            () => {
              setWaiting(false)
              setTimeout(() => navigate('/simuhire/session-demo/report', { state: { duration: 30 * 60 - timeLeft } }), 3500)
            },
          )
        }
      }
    }, 2000)
```

- [ ] **Step 3: Render the streaming bubble and gate the typing dots**

In the conversation JSX, replace the existing `{waiting && ( ...dots... )}` block with the dots gated on `!streaming`, followed by the streaming bubble:

```jsx
            {waiting && !streaming && (
              <div className="rounded-card p-3 bg-parchment-shade border-l-2 border-verified">
                <p className="text-xs font-semibold text-verified mb-1">Scenario Master</p>
                <div className="flex gap-1 mt-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            {streaming && (
              <div className={`rounded-card p-3 ${speakerConfig[streaming.speaker].bg} ${speakerConfig[streaming.speaker].border}`}>
                <p className={`text-xs font-semibold mb-1 ${speakerConfig[streaming.speaker].color}`}>
                  {streaming.speaker === 'stakeholder'
                    ? `Stakeholder · ${session.stakeholderPersona}`
                    : speakerConfig[streaming.speaker].label}
                </p>
                <p className="text-sm text-ink leading-relaxed">{streaming.shown}<span className="animate-pulse">▋</span></p>
              </div>
            )}
```

- [ ] **Step 4: Keep auto-scroll following the stream**

Find the scroll effect:

```jsx
  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, atBottom])
```

Add `streaming` to its dependency array so the view follows the growing text:

```jsx
  }, [messages, atBottom, streaming])
```

- [ ] **Step 5: Write the browser verification script**

Create `frontend/verify-a4.mjs`:

```js
import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:5173/simuhire/session-demo', { waitUntil: 'networkidle' })
await page.locator('input[type="checkbox"]').first().check()
await page.getByRole('button', { name: /Begin Simulation/i }).click()
await page.waitForTimeout(800)

await page.locator('textarea').first().fill('I would reproduce it locally first.')
await page.getByRole('button', { name: /Respond to scenario|Submit/i }).first().click()

// Caret appears while streaming; input is disabled during the stream
await page.waitForSelector('text=▋', { timeout: 5000 })
const disabledMidStream = await page.getByRole('button', { name: /Respond to scenario|Submit/i }).first().isDisabled()
console.log('[stream] caret seen; submit disabled mid-stream:', disabledMidStream)

// Full scripted reply eventually lands and the caret is gone
await page.waitForSelector("text=Cannot read properties of undefined", { timeout: 8000 })
await page.waitForFunction(() => !document.body.innerText.includes('▋'), { timeout: 8000 })
// Re-fill (the box was cleared on submit) so the only reason the button could be
// disabled is `waiting`; it should now be enabled because the stream finished.
await page.locator('textarea').first().fill('next thought')
const enabledAfter = !(await page.getByRole('button', { name: /Respond to scenario|Submit/i }).first().isDisabled())
console.log('[stream] full reply landed; input re-enabled after:', enabledAfter)

await browser.close()
console.log('DONE')
```

- [ ] **Step 6: Run the verification**

Run: `cd frontend && node verify-a4.mjs`
Expected: `[stream] caret seen; submit disabled mid-stream: true`, then `[stream] full reply landed; input re-enabled after: true`, then `DONE`.

- [ ] **Step 7: Clean up and commit**

```bash
rm -f frontend/verify-a4.mjs
git add frontend/src/pages/SimuHireSession.jsx
git commit -m "feat(simuhire): stream Scenario Master replies word-by-word

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Bottom-anchor the conversation layout

**Files:**
- Modify: `frontend/src/pages/SimuHireSession.jsx`

- [ ] **Step 1: Wrap the conversation in a bottom-anchored, width-capped column**

Find the conversation container:

```jsx
          <div ref={convRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => {
```

Change the outer div to remove padding/spacing, and add an inner wrapper that anchors content to the bottom and caps width. The opening becomes:

```jsx
          <div ref={convRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
            <div className="min-h-full flex flex-col justify-end gap-3 p-4 max-w-[720px] mx-auto w-full">
            {messages.map(msg => {
```

Then add one extra closing `</div>` for the new inner wrapper — immediately after the existing `<div ref={bottomRef} />` and before the container's original closing `</div>`:

```jsx
            <div ref={bottomRef} />
            </div>
          </div>
```

(Net effect: messages, the dots/streaming bubble, and `bottomRef` all sit inside the new inner wrapper.)

- [ ] **Step 2: Write the browser verification script**

Create `frontend/verify-a5.mjs`:

```js
import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:5173/simuhire/session-demo', { waitUntil: 'networkidle' })
await page.locator('input[type="checkbox"]').first().check()
await page.getByRole('button', { name: /Begin Simulation/i }).click()
await page.waitForTimeout(1000)

// With a single opening message, it should sit in the LOWER half (bottom-anchored),
// not pinned to the top of the tall conversation area.
const box = await page.getByText(/Welcome to your Technical SimuHire/).boundingBox()
console.log('[layout] opening message top y =', Math.round(box.y), '(viewport 900; expect > 300)')
await page.screenshot({ path: 'verify-a5.png' })
await browser.close()
console.log('DONE')
```

- [ ] **Step 3: Run the verification**

Run: `cd frontend && node verify-a5.mjs`
Expected: `[layout] opening message top y =` a value greater than ~300 (it sits low in the panel, not near the top), then `DONE`. Open `verify-a5.png` and confirm the lone message rests just above the input rather than floating at the top.

- [ ] **Step 4: Clean up and commit**

```bash
rm -f frontend/verify-a5.mjs frontend/verify-a5.png
git add frontend/src/pages/SimuHireSession.jsx
git commit -m "feat(simuhire): bottom-anchor and width-cap the conversation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Full end-to-end regression pass

**Files:** none (verification only)

- [ ] **Step 1: Write the end-to-end verification script**

Create `frontend/verify-a6.mjs`:

```js
import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
const ctx = await browser.newContext({ permissions: ['camera'], viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:5173/simuhire/session-demo', { waitUntil: 'networkidle' })
await page.locator('input[type="checkbox"]').first().check()
await page.getByRole('button', { name: /Begin Simulation/i }).click()
await page.waitForTimeout(800)

const submit = () => page.getByRole('button', { name: /Respond to scenario|Diagnose and respond|Respond under pressure|Make your final call|Submit/i }).first()

// Walk through enough turns to cross at least one stage boundary.
const lines = [
  'I would reproduce it locally and check the console logs to scope the impact.',
  'The root cause looks like calling trim on an undefined optional phone field.',
  'I will message the tech lead on Slack and update the client on expectations.',
  'I weigh the rollback risk and add a test to prevent this regression.',
  'I would wait for approval given branch protection, and triage calmly meanwhile.',
]
for (const line of lines) {
  await page.locator('textarea').first().fill(line)
  await submit().click()
  // Wait for the think delay + word-by-word stream to fully finish before the
  // next turn (the stage-advance message is long); guard against desync.
  await page.waitForTimeout(2200)
  await page.waitForFunction(() => !document.body.innerText.includes('▋'), { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(400)
}

const stageChip = await page.locator('span.bg-ink').first().innerText().catch(() => '?')
const chipCount = await page.locator('text=Signals observed').count()
console.log('[e2e] current stage chip:', stageChip, '| signals panel present:', chipCount)
await page.screenshot({ path: 'verify-a6.png', fullPage: false })
await browser.close()
console.log('DONE')
```

- [ ] **Step 2: Run it and review**

Run: `cd frontend && node verify-a6.mjs`
Expected: `DONE` with no thrown errors; the stage chip has advanced beyond `Setup` and the signals panel is present. Open `verify-a6.png` and confirm: multiple signal chips listed, several bars above zero, the radar shows a filled shape, replies are full sentences, and the conversation is readable.

- [ ] **Step 3: Confirm the signal unit test still passes**

Run: `cd frontend && node src/data/simuHireSignals.test.mjs`
Expected: `simuHireSignals: all assertions passed`.

- [ ] **Step 4: Clean up**

```bash
rm -f frontend/verify-a6.mjs frontend/verify-a6.png
```

No commit (verification only). If `verify-a6.png` revealed a defect, return to the relevant task before considering Unit A done.

---

## Notes for the implementer

- **Do not touch** the timer effect, the time-up auto-end effect, the End-confirm modal, or the scenario-brief collapsible — they are working and out of scope.
- The candidate's `input` value is still readable inside `handleSubmit` after `setInput('')` because `input` is the render-closure constant; signals are matched against it correctly.
- `session.stageIndicators` in `mockData.js` becomes unused after Task 3 — leave it in place (removing mock fields is out of scope).
- Keep commits per-task as written; each task leaves the app in a working state.

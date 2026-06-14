# SimuHire Live Session UX — Unit A Design

**Date:** 2026-06-14
**Status:** Approved, ready for implementation planning
**Scope:** `frontend/src/pages/SimuHireSession.jsx` (active-session screen only)

## Context

The SimuHire active-session screen currently feels flat: the conversation is a
single message pinned to the top of a large empty area, the Scenario Master's
scripted replies appear after a fixed 2-second blank pause, and the right-hand
"Live Indicators" radar and per-dimension bars sit at `0` for all of Stage 1
and only jump at stage boundaries — which reads as broken and unrewarding.

The session is entirely frontend mock data (`mockSimuHireSession`). The
candidate types freeform text, but the Scenario Master's replies are scripted by
candidate-message count, not by reading the input. Any per-message feedback must
therefore be derived on the frontend without a backend or LLM.

This is **Unit A** of a three-unit overhaul. Units B (Setup/onboarding) and
C (Report) are out of scope here and get their own specs.

## Goals

1. Make the simulation feel *alive* and *earned* — feedback on every message,
   not every stage.
2. Keep all existing session mechanics intact: timer, stage progression,
   scripted exchanges, end-confirm modal, auto-end-on-time-up, navigation to the
   report. None of these change.
3. Stay on-brand: proof over promise (evidence accumulates), honest copy
   (the Evaluator still scores the full transcript at the end), parchment
   aesthetic, `prefers-reduced-motion` respected.

## Non-Goals

- No backend or LLM scoring. Pure frontend.
- No changes to Setup screen (Unit B) or Report screen (Unit C).
- No change to the scripted Scenario Master / stakeholder reply content or the
  stage-advancement logic.

## Design

### 1. Signal chips + signal-driven indicators

**Replaces** the per-stage `stageIndicators[stage]` lookup as the source of the
live indicator values. The radar and bars are kept but now driven by accumulated
signals.

**Signal definitions** — new module `frontend/src/data/simuHireSignals.js`:

```js
// Each signal fires at most once. `dim` is one of the five evaluation
// dimensions; `weight` is added to that dimension's indicator when fired.
export const signals = [
  { id: 'reproduce',  label: 'Reproduced before fixing',     dim: 'problemSolving',
    keywords: [/reproduc/i, /replicat/i, /staging/i, /\blocally\b/i, /repro\b/i] },
  { id: 'logs',       label: 'Checked logs / evidence',       dim: 'systemsThinking',
    keywords: [/\blogs?\b/i, /console/i, /stack ?trace/i, /network tab/i, /error message/i] },
  { id: 'scope',      label: 'Scoped the impact',             dim: 'systemsThinking',
    keywords: [/how many/i, /\bimpact\b/i, /affected/i, /\bscope\b/i, /\b20%\b/i, /percentage/i] },
  { id: 'rootcause',  label: 'Identified the root cause',     dim: 'problemSolving',
    keywords: [/undefined/i, /\bnull\b/i, /\btrim\b/i, /optional/i, /root cause/i, /phone field/i] },
  { id: 'escalate',   label: 'Escalated appropriately',       dim: 'communication',
    keywords: [/tech lead/i, /\bslack\b/i, /\bnotify\b/i, /\bescalat/i, /message (the|my)/i] },
  { id: 'client',     label: 'Managed client communication',  dim: 'communication',
    keywords: [/\bclient\b/i, /customer/i, /expectation/i, /update them/i, /let them know/i] },
  { id: 'rollback',   label: 'Weighed rollback / risk',       dim: 'adaptability',
    keywords: [/rollback/i, /revert/i, /\brisk\b/i, /regression/i, /break (anything|something)/i] },
  { id: 'approval',   label: 'Respected merge approval',      dim: 'stressResponse',
    keywords: [/approval/i, /branch protection/i, /can.?t merge/i, /permission/i, /wait for/i] },
  { id: 'triage',     label: 'Stayed calm and triaged',       dim: 'stressResponse',
    keywords: [/prioriti/i, /triage/i, /one (thing|step) at a time/i, /stay calm/i, /first.*then/i] },
  { id: 'process',    label: 'Proposed a process fix',        dim: 'systemsThinking',
    keywords: [/code review/i, /\btest(s|ing)?\b/i, /lint/i, /prevent/i, /post-?mortem/i, /\bPR\b/] },
]

// Fired when a candidate message matches no signal. One per stage index (0-3),
// mapped to that stage's primary dimension so a bar still moves.
export const fallbackSignals = [
  { id: 'fb-setup',      label: 'Engaged with the problem',     dim: 'problemSolving'  },
  { id: 'fb-challenge',  label: 'Adapted to new information',   dim: 'adaptability'    },
  { id: 'fb-escalation', label: 'Managed competing demands',    dim: 'stressResponse'  },
  { id: 'fb-resolution', label: 'Worked toward a decision',     dim: 'communication'   },
]

export const SIGNAL_WEIGHT = 25 // added to a dimension when a signal fires (capped at 100)
```

**Matching helper** (same module):

```js
// Returns the keyword-matched signals not already shown. If none match,
// returns the stage's fallback signal (unless it was already shown).
export function matchSignals(text, shownIds, stageIndex) {
  const matched = signals.filter(s => !shownIds.has(s.id) && s.keywords.some(k => k.test(text)))
  if (matched.length) return matched
  const fb = fallbackSignals[stageIndex]
  return fb && !shownIds.has(fb.id) ? [fb] : []
}
```

**State + flow in `SimuHireSession`:**

- New state `shownSignals` (array of `{ id, label, dim }`) — drives the chip list.
- `indicators` is no longer a separate `useState`; it becomes a **`useMemo`
  derived from `shownSignals`**: start all five dimensions at `0`, and for each
  shown signal add `SIGNAL_WEIGHT` to `signal.dim`, capped at `100`. This makes
  the bars/radar a pure function of the signals, so they can never drift out of
  sync.
- In `handleSubmit`, immediately after appending the candidate message, call
  `matchSignals(input, shownIdSet, currentStage)` and append any returned signals
  to `shownSignals`. (Fire on the candidate's submit, before the scripted reply.)
- Remove the per-stage `setIndicators(session.stageIndicators[newStage])` call;
  indicators now flow from signals only. `session.stageIndicators` may remain in
  mock data, unused.

**Right-panel layout** (top → bottom):

1. Camera feed — unchanged.
2. **Signals observed** — the `shownSignals` rendered as check-pill chips,
   newest last. Each chip: check icon + label, subtly tinted by `dim`. Slide/fade
   in on appear (respect reduced motion). Empty state before the first submit:
   a one-line hint ("Signals appear as you work through the scenario").
3. **Radar** — demoted: smaller (e.g. `size={120}`), labeled as a stage-shape
   summary, fed by the derived `indicators`.
4. **Five dimension bars** — kept, fed by the derived `indicators`, animating up
   as signals fire (existing `transition-all duration-700`).
5. Keep the existing "Indicative only — Evaluator scores the full transcript at
   the end." caption.

### 2. Streaming Scenario Master replies

Replace the "2s dots → whole paragraph appears at once" behavior.

- When a scripted reply (interviewer or stakeholder) is ready, first show the
  existing typing dots briefly (~500ms), then **stream the text word-by-word**
  (~30–50ms per word) into the message bubble.
- The input stays disabled (`waiting`) until the stream completes.
- Candidate messages and system messages render instantly (no streaming).
- `prefers-reduced-motion`: skip streaming, render the full text immediately
  (current behavior).
- Isolate the streaming mechanic (a small helper / hook, e.g.
  `useStreamedMessage` or a `streamMessage(text, onUpdate, onDone)` util) so
  `handleSubmit` stays readable. When multiple replies are queued (rare — mostly
  one), stream them sequentially.

### 3. Bottom-anchored conversation layout

- The conversation column anchors its content to the bottom: when sparse,
  messages sit just above the input area and grow upward, instead of floating at
  the top of a tall empty region. (e.g. inner wrapper with `mt-auto`, or the
  scroll container using `justify-end` until it overflows.)
- Cap the conversation column at ~720px centered within the left panel.
- Preserve existing auto-scroll-to-bottom and the "↓ Latest" affordance.

### Structure / isolation

- New data module: `frontend/src/data/simuHireSignals.js` (definitions +
  `matchSignals`).
- Extract the right panel into a `SessionSidePanel` component (props: camera
  ref/stream, `signals`, `indicators`) to keep the already-large
  `SimuHireSession.jsx` focused.
- Extract the streaming mechanic into a small helper/hook.
- Untouched: timer effect, time-up auto-end effect, stage progression in
  `handleSubmit`, scripted/stage reply content, end-confirm modal, navigation.

## Edge Cases

- A signal fires at most once (dedup via the shown-id set).
- Multiple signals can fire from a single message — all appear; each bumps its
  dimension (capped at 100).
- No keyword match → the stage fallback fires; if that fallback already fired,
  no chip appears that turn (acceptable — bars still reflect prior progress).
- Reduced motion: chips appear without slide-in; replies render instantly. The
  bars keep their CSS width transition (it is a width change, not large motion) —
  this is intentionally not gated.
- Streaming must not block the time-up auto-end or the End button.

## Testing / Verification

Driven in a real browser (Playwright + installed Chrome, fake media stream),
mirroring the existing verification approach:

1. Type a message containing known keywords (e.g. "reproduce locally", "check the
   logs") → the corresponding chips appear and the matching dimension bars climb.
2. Type a no-keyword message → the stage fallback chip appears and its bar moves.
3. Confirm the Scenario Master reply streams in word-by-word and the input is
   disabled until it finishes.
4. Confirm a sparse conversation is bottom-anchored (not floating at the top).
5. Confirm timer, stage transitions, End modal, and auto-navigation to the report
   still work unchanged.

## Out of Scope (future units)

- **Unit B** — Setup/onboarding: sticky/visible "Begin" CTA (currently below the
  fold), camera-notice callout, tightened hierarchy.
- **Unit C** — Report: verification seal/stamp on the result,
  transcript-anchored Key Observations, reduced-motion-aware score count-up.

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

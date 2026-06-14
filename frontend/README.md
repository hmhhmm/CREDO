# CREDO Frontend

React + Vite + Tailwind single-page application for the CREDO candidate and employer experience.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 |
| Bundler | Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 (custom design tokens) |
| Animation | Framer Motion v12 (3D namecard, landing page) |
| Icons | Lucide React + custom `GitHubIcon` SVG component |
| State | React Context (`DemoContext`) — no external store |
| Data | Static mock data (`src/data/mockData.js`) |

---

## Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

No environment variables are required. The frontend runs entirely on mock data.

---

## Environment Variables

The frontend has no `.env` requirements for the June 15 prototype. If connecting to a live backend, create `frontend/.env`:

```
VITE_API_URL=http://localhost:8000
```

No existing code reads this variable yet — it is reserved for when backend integration begins.

---

## Project Structure

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js         Design tokens (colors, fonts, border-radius)
└── src/
    ├── main.jsx               React entry point
    ├── App.jsx                React Router — all routes defined here
    ├── App.css
    ├── index.css              Tailwind directives + Google Fonts import
    ├── assets/
    │   └── hero.png
    ├── context/
    │   └── DemoContext.jsx    Shared demo pipeline state (trust score, agent verification)
    ├── data/
    │   └── mockData.js        All seeded mock data (candidates, sessions, report)
    ├── utils/
    │   └── confidenceBand.js  Maps 0–100 score → color token + label
    ├── components/
    │   ├── ArtifactCard.jsx       Expandable card for github/document/credential artefacts
    │   ├── BehavioralBar.jsx      Single labeled bar 0–100 for SimuHire dimensions
    │   ├── Card3D.jsx             3D flip animation wrapper (used in NamecardPremium)
    │   ├── GitHubIcon.jsx         Authentic GitHub Octocat SVG (drop-in for lucide API)
    │   ├── LedgerEntry.jsx        Mono-font row: block_index, hashes, timestamp
    │   ├── NamecardCard.jsx       Full and compact namecard variants
    │   ├── NamecardPremium.jsx    Animated 3D namecard with verified badge layers
    │   ├── ReportDimensionRow.jsx Score bar + strength/weakness comments
    │   ├── Sidebar.jsx            Candidate nav sidebar
    │   ├── SkillBar.jsx           Horizontal bar, verified vs claimed states
    │   └── VerificationStamp.jsx  Circular ink-stamp seal (-4deg rotation), trust score
    └── pages/
        ├── Landing.jsx            /  — marketing page, three-pillar layout
        ├── Login.jsx              /login
        ├── Register.jsx           /register — role selector + PDPA consent checkbox
        ├── CandidateDashboard.jsx /dashboard — journey progress, live namecard, reset demo
        ├── VerifyPage.jsx         /dashboard/verify — three agent cards with state transitions
        ├── PortfolioPrivate.jsx   /dashboard/portfolio — artefacts, timeline, ledger panel
        ├── PortfolioPublic.jsx    /portfolio/:userId — verified-only public view
        ├── NamecardOwn.jsx        /dashboard/namecard — own namecard view
        ├── NamecardPublic.jsx     /card/:userId — shareable public namecard
        ├── SimuHireSession.jsx    /simuhire/:sessionId — full session UI
        ├── SimuHireReport.jsx     /simuhire/:sessionId/report — report + share decision
        ├── EmployerDashboard.jsx  /employer
        ├── EmployerCandidates.jsx /employer/candidates — filter sidebar + namecard grid
        └── NotFound.jsx           * — 404
```

---

## Key Pages

### `/dashboard` — CandidateDashboard
Drives the demo pipeline. Reads `liveCandidate` from `DemoContext` — trust score and namecard update live as verification agents are confirmed. Includes a "Reset demo" button. `deriveJourneyState()` maps the candidate's artefact statuses to a progress journey (Unverified → Verified → SimuHire done → Complete).

### `/dashboard/verify` — VerifyPage
Three agent cards: GitHub (two-step OAuth simulation with throbber), Document, Credential. Each triggers a 3-second pending animation then calls `markAgentVerified()` on the shared context. The verification stamp updates trust score in real time.

### `/simuhire/:sessionId` — SimuHireSession
Three-panel layout:

```
┌─────────────────────────────┬──────────────┐
│  Conversation history        │  Camera feed │
│  (scrollable, auto-scroll)   │  Integrity   │
│                              │  monitoring  │
│                              │  ──────────  │
│  [Input textarea]            │  Live radar  │
│  [Submit button]             │  Score bars  │
└─────────────────────────────┴──────────────┘
```

- **Stage flow**: Setup → Challenge → Escalation → Resolution (4 stages, 3 follow-up questions each)
- **Scripted first 3 exchanges**: TypeError clue → Stakeholder ping → phone.trim() finding
- **Sequential follow-ups**: `stageResponses[stageIndex]` queried by `stageReplyCount`; pool exhausted → stage advances
- **Closing**: Final stage last answer triggers Scenario Master closing message then auto-navigates to report after 3.5 s, passing actual elapsed time via router state

### Integrity Monitoring
- Camera requested via `navigator.mediaDevices.getUserMedia` only after "Begin Simulation" is clicked — never on the setup screen
- Stream attached to a `<video>` ref (mirrored with `scaleX(-1)`, `muted`, `playsInline`)
- Permission denial caught silently — video element hidden, green "Integrity monitoring on" dot remains
- `visibilitychange` event injects `— Candidate switched tabs —` system message into the conversation log

### `/simuhire/:sessionId/report` — SimuHireReport
Displays Behavioral Traits Report with radar chart, overall score, dimension breakdown (strength `+` / weakness `–`), and key observations. Duration shows the candidate's actual session time (passed via `useLocation().state.duration`), falling back to `mockReport.duration` if navigated directly.

---

## Design System

Tokens defined in `tailwind.config.js`. Never hardcode these values.

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#10192B` | Primary text, dark surfaces |
| `parchment` | `#F5EDE0` | Page background |
| `parchment-shade` | `#EBE0CC` | Secondary surfaces, hover states |
| `verified` | `#1F7A5C` | Verified badges, trust ≥ 80 |
| `pending` | `#D9A441` | Unverified, trust 40–59 |
| `alert` | `#C4503A` | Failed, trust < 40 |
| `slate` | `#6B7785` | Secondary text, muted UI |
| `line` | `#DCD2BC` | Hairline rules, card borders |

Fonts: `font-display` (Fraunces, serif), `font-sans` (Inter), `font-mono` (IBM Plex Mono).

Cards: `border border-line rounded-card` (6 px radius). No shadow by default.

---

## DemoContext

`src/context/DemoContext.jsx` provides the live demo pipeline state:

```js
const { liveCandidate, trustScore, verifiedCount, markAgentVerified, markSimuHireShared, reset } = useDemo()
```

- `markAgentVerified('github' | 'credential' | 'document')` — adds agent to verified Set, recomputes `liveCandidate`
- `markSimuHireShared()` — marks SimuHire as done and shared
- `reset()` — resets all state to zero for a fresh demo run
- `liveCandidate` is a derived object with the same shape as `mockCurrentCandidate` — drops into any component that previously used mock data directly

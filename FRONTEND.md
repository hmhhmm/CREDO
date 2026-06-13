# CREDO — Frontend Build Guide

This document is the design and implementation reference for building the CREDO prototype UI. It covers visual identity (tokens), page-by-page layouts mapped to the PRD features, component inventory, and a recommended build order for the hackathon timeline.

---

## 1. Design Direction

### Concept
CREDO's core idea is **proof** — turning claims into verified records. The visual language should feel like an **official, notarized document crossed with a modern fintech dashboard**: trustworthy, precise, slightly formal — not a generic SaaS admin panel, and not a typical "AI startup" gradient-and-glow look.

The signature motif is a **verification stamp / seal** — used for trust scores, verified badges, and the ledger integrity check. It should feel like ink pressed onto paper: a circular mark with a subtle rotation and "stamped" weight.

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#10192B` | Primary text, dark surfaces, headers |
| `--parchment` | `#F5EDE0` | Page background (light mode — warm, aged-paper tone) |
| `--parchment-shade` | `#EBE0CC` | Secondary surfaces on parchment (e.g. chat bubbles, subtle section fills) |
| `--verified` | `#1F7A5C` | Verified badges, trust score ≥80, success states |
| `--pending` | `#D9A441` | Pending/unverified states, trust score 40–59 |
| `--alert` | `#C4503A` | Failed verification, trust score <40, errors |
| `--slate` | `#6B7785` | Secondary text, borders, muted UI |
| `--line` | `#DCD2BC` | Hairline rules, dividers, card borders |

**On the warm background**: `--parchment` is deliberately warmer and slightly more saturated than the generic flat-cream (`#F4F1EA`-style) background that has become a default "tasteful" AI choice. The parchment tone is chosen specifically because it reinforces CREDO's "official record / certificate" concept — it should read as the surface of a document being verified, not just a neutral page backdrop. `--line` is tinted from the same warm family so dividers feel like creases/edges in paper rather than generic UI hairlines. Do not lighten `--parchment` toward a cooler or flatter off-white; the warmth is the point.

Do not introduce additional accent colors. Status colors (`--verified`, `--pending`, `--alert`) map 1:1 to trust score bands defined in the PRD (F5) — reuse these everywhere a confidence/status signal appears, never invent new status colors.

### Typography

| Role | Typeface | Usage |
|---|---|---|
| Display | **Fraunces** (serif, weight 600–900) | Page headings, namecard candidate name, hero text — evokes a certificate/diploma feel |
| Body / UI | **Inter** | All interface text: labels, buttons, body copy, nav |
| Data / Mono | **IBM Plex Mono** | Trust scores, confidence percentages, hashes, ledger entries, timestamps — reinforces "cryptographic record" |

Type scale (rem, base 16px):
- Display XL: 3rem / 1.1 (page heroes)
- Display L: 2rem / 1.15 (section headers, namecard name)
- Body L: 1.125rem
- Body: 1rem
- Caption / mono data: 0.875rem, letter-spacing 0.02em

### Layout Concept

- Base unit: 8px grid.
- Cards use **1px hairline borders** (`--line`) and **no shadow** by default — flat, document-like. Reserve shadow/elevation only for modals and the SimuHire live-indicator panel (things that float above the page).
- Border radius: small and consistent — 6px for cards/buttons, 999px (pill) only for status badges and skill bars. Avoid large rounded corners; they undercut the "official document" feel.
- Verified items get a small stamp/seal icon (the signature element) — a circular badge with a checkmark, slightly rotated (-4deg), rendered in `--verified`.

### Signature Element: The Verification Stamp

A reusable circular seal component:
- Circle outline (2px), checkmark or percentage inside, label below (e.g. "VERIFIED", "87").
- Rotated -3° to -6° to mimic an ink stamp.
- Color follows trust-score band (`--verified` / `--pending` / `--alert`).
- Used on: namecard trust score, verified skill rows, F4 ledger integrity check result, F2 verification result cards.

### Motion

Keep motion minimal and purposeful:
- Verification result cards: brief fade + 4px slide-up when a "pending" card flips to "verified" (reflects an async job completing).
- Stamp component: on first appearance, a quick scale-in (0.9 → 1.0) + slight rotation settle — like a stamp being pressed.
- SimuHire live indicators (F6 right panel): bars animate smoothly between stage updates, not per keystroke.
- No hover-tilt effects, no parallax, no gradient animations.

---

## 2. Page Inventory

Mapped directly to PRD features. Build order follows the 28-day plan (Section 9 of PRD) and the June 15 prototype scope (Section 10).

| Page | Route | PRD Feature | Priority (June 15 scope) |
|---|---|---|---|
| Landing / Marketing | `/` | — | Optional |
| Register / Login | `/register`, `/login` | F1 | Required |
| Candidate Dashboard | `/dashboard` | F1 | Required |
| Connect Artifacts | `/dashboard/verify` | F2 | Required (GitHub real, others mocked) |
| Living Portfolio (private) | `/dashboard/portfolio` | F3, F4 | Required |
| Living Portfolio (public) | `/portfolio/[userId]` | F3 | Required |
| SimuHire Session | `/simuhire/[sessionId]` | F6 | Required (pre-scripted) |
| SimuHire Report | `/simuhire/[sessionId]/report` | F6 | Required |
| Smart Namecard (own) | `/dashboard/namecard` | F5 | Required |
| Smart Namecard (shared) | `/card/[userId]` | F5 | Required |
| Employer Dashboard | `/employer` | F1 | Required |
| Employer Candidate Browse | `/employer/candidates` | F1 | Required |
| Job Listings | `/employer/jobs` | F1 | Optional for June 15 |

---

## 3. Page-by-Page Layout Specs

### 3.1 Register / Login (`/register`, `/login`)

- Centered card, max-width 420px, on `--parchment` background.
- Role selector at top of register flow: two large tappable cards — "I'm a Candidate" / "I'm an Employer" — each with a one-line description (matches PRD F1 role split).
- Candidate path: email/password fields + "Continue with GitHub" button (primary — this is the verification entry point per F2).
- Consent checkbox required before submit, per PRD Section 4 (PDPA) — link to a plain-language explanation, not legal text.
- Employer path: email/password + company name, industry (select), size (select).

### 3.2 Candidate Dashboard (`/dashboard`)

Layout: left sidebar nav (Dashboard, Verify, Portfolio, SimuHire, Namecard) + main content area.

Main content, top to bottom:
1. **Status banner**: "Your CREDO profile" — current trust score (stamp component) + count of verified artifacts.
2. **Verification status grid**: cards for GitHub, Documents, Credentials — each shows connect/upload CTA if empty, or pending/verified state if in progress (per F2 agent states).
3. **SimuHire card**: "Run a simulation" CTA if not yet done; otherwise shows last report summary + retake-cooldown countdown if applicable (per F6 retake policy).
4. **Namecard preview**: small embedded preview of the candidate's namecard as it currently looks, with "View full namecard" link.

Empty state (no artifacts yet): dashboard shows only step 1 banner (trust score "—") and the verification grid with all three cards in "not started" state — no namecard preview yet, since namecard only generates after the first verified artifact (F5).

### 3.3 Connect Artifacts (`/dashboard/verify`)

Three sections, one per F2 agent. Each section is a card with:
- Icon + artifact type name + one-line description of what it verifies.
- Action button (Connect GitHub / Upload Document / Add Credential).
- State display:
  - **Empty**: muted, CTA visible.
  - **Pending**: animated "Analysing..." text matching the agent's exact copy from PRD F2 (e.g. "Analysing commits and code structure...").
  - **Verified**: stamp component + result summary line (e.g. "47 commits · High complexity · No flags · 88/100 Verified ✓").
  - **Failed/Unverified**: `--alert` or `--pending` colored summary, no stamp, with a short explanation of why (per F2 confidence rules).

GitHub section additionally shows a repo picker (checklist) after OAuth, per F2 trigger flow.

### 3.4 Living Portfolio — Private (`/dashboard/portfolio`)

Per PRD F3:
1. **Header**: name, university, graduation year, trust score stamp.
2. **"Share Portfolio" button** — copies public URL.
3. **Verified Artifacts grid**: cards, newest first. Each card: icon (by artifact_type), name, confidence bar (colored by band), status badge, date. Click expands to raw metadata + scores (accordion or modal).
4. **Career Timeline**: vertical timeline, oldest → newest, each node = artifact name + type icon + confidence chip.
5. **Ledger Integrity panel**: truncated Merkle root hash (mono font), total entry count, "View full audit trail" expands a table of `block_index | leaf_hash | prev_hash | timestamp`.

### 3.5 Living Portfolio — Public (`/portfolio/[userId]`)

Same structure as 3.4, with these differences (per F3):
- No edit controls anywhere.
- Pending/failed artifacts hidden — verified only.
- Footer: "Verified by CREDO · Integrity Hash: [hash]" in mono font.
- "Contact" button reveals candidate's contact email (modal or inline reveal).
- No sidebar nav — this is a standalone page for external visitors.

### 3.6 SimuHire Session (`/simuhire/[sessionId]`)

Three-panel layout per PRD F6 — this is the most structurally specific page in the prototype.

```
┌─────────────────────────────────────────────────────────────┐
│ CREDO SimuHire · [Type] Simulation · Stage [n] of 4          │
│ [progress bar] ───────────────────  [Timer: mm:ss]            │
├───────────────────┬─────────────────────┬─────────────────────┤
│ LEFT               │ CENTER              │ RIGHT               │
│ Conversation       │ Your Response       │ Live Indicators     │
│ (read-only,        │ (text area +        │ (5 bars, update     │
│ color-coded by     │ optional code       │ per stage, labeled  │
│ speaker)           │ block toggle,       │ "Indicative only")  │
│                    │ Submit button)      │                     │
└───────────────────┴─────────────────────┴─────────────────────┘
```

- **Left panel**: chat-style bubbles. Interviewer = `--ink` text on `--parchment-shade` bubble (blue accent border per PRD spec — use `--verified`-adjacent blue sparingly only here, or substitute a blue from a constrained secondary palette if needed — confirm before introducing a new color). Stakeholder = `--pending` border. System messages (stage transitions) = centered, `--slate`, smaller text, no bubble.
- **Center panel**: textarea, code-block toggle (visible only for Technical type), "Submit Response" button (primary, disabled while waiting for agent response — show a subtle loading state in the left panel instead, e.g. typing indicator).
- **Right panel**: 5 horizontal bars (Adaptability, Communication, Problem-Solving, Stress Response, Systems Thinking), each 0–100, updating only on stage transition (not per message). Persistent caption: "Indicative only — final report shown at end."
- **Header**: stage progress bar (4 segments — Setup / Challenge / Escalation / Resolution), each segment labeled; timer counts down from 30:00 but is explicitly non-blocking (no "time's up" modal).
- Stage transitions render as a system message: "We're now moving to the [stage] phase..."

Mobile note: stack panels vertically (Left → Center → Right) with Right panel collapsed into an expandable drawer, since the three-column layout won't fit narrow viewports.

### 3.7 SimuHire Report (`/simuhire/[sessionId]/report`)

Per PRD F6 "Behavioral Traits Report — output format":

1. **Header**: candidate name, simulation type, duration, completion date.
2. **Overall Score**: large stamp component (0–100).
3. **Dimension breakdown**: for each of the 5 dimensions —
   - Score bar (0–100, colored by band).
   - Strength comment (≤25 words) — prefixed with a small "+" or checkmark icon in `--verified`.
   - Growth area comment (≤25 words) — prefixed with a small arrow/upward icon in `--pending` (not `--alert` — growth areas are constructive, not failures).
4. **Key Observations**: 3 bullet points, ≤25 words each, visually distinct (e.g. a bordered callout block).
5. **Share decision**: two large buttons — "Share to Namecard" (primary, `--verified`) and "Keep Private" (secondary, outline). This decision should feel weighty but not alarming — no warning icons.
6. **Retake info**: if applicable, "You can retake this simulation in [n] days. Your best score is kept." in `--slate`, small text.

### 3.8 Smart Namecard (`/dashboard/namecard` and `/card/[userId]`)

This is the **signature page** — the "10-second read" per PRD F5. Most design attention should go here.

Layout (single card, centered, max-width ~480px on desktop, full-width on mobile):

```
┌──────────────────────────────────────────┐
│ [Avatar]  Name (Fraunces, Display L)      │
│           Field · University · Year       │
│           📍 Location · Open to Work       │
│                                            │
│  [Trust Score Stamp]   Label (e.g.        │
│   87/100 (mono)         "Highly Authentic")│
│                                            │
│  VERIFIED SKILLS                          │
│  Python        [bar 94] Verified ✓        │
│  ML            [bar 79] Verified ✓        │
│  SQL           [bar 71] Verified ✓        │
│  React         [bar --] Claimed           │
│                                            │
│  SIMUHIRE  (only if shared)               │
│  ✓ [Type] Completed · Score: 82/100       │
│  Adaptability 88 · Problem-Solving 82 ...  │
│                                            │
│  [View Full Portfolio] [Contact] [QR]     │
└──────────────────────────────────────────┘
```

Field-level rules (must be enforced in component logic, not just visually, per F5 locked/editable table):
- **Locked** (rendered, never editable in candidate's own view): verified skill scores, trust score, SimuHire badge/scores, credential badges, audit trail hash, verified date stamps.
- **Editable** (candidate's own view shows an edit affordance — pencil icon or inline-edit on click): photo, bio, LinkedIn, GitHub URL, preferred roles, location, contact email, "Open to Work" toggle.
- Unverified self-reported skills render with a distinct visual treatment — empty/greyed bar + "Claimed (unverified)" label, never styled like a verified skill (no stamp, no `--verified` color).

Public view (`/card/[userId]`): identical layout, no edit affordances, "View Full Portfolio" links to `/portfolio/[userId]`, QR code renders and links to the public portfolio.

### 3.9 Employer Dashboard (`/employer`)

- Top: "Post a Job" CTA + list of the employer's active job listings (title, required skills as tags, applicant count if tracked).
- Below: shortcut to candidate browse.

### 3.10 Employer Candidate Browse (`/employer/candidates`)

Per PRD F1:
- Filter bar: skills (multi-select tags), trust score (range or band selector), university (select), "Verified Only" toggle, SimuHire completed (toggle).
- **Namecard grid**: each candidate renders as a compact namecard preview (smaller version of 3.8 — name, trust score stamp, top 2-3 verified skills, SimuHire badge if present).
- Sort/rank: SimuHire-completed candidates float above non-completed; verified-skill matches rank above unverified matches, per F1 matching logic.
- Click a card → navigates to that candidate's full namecard (`/card/[userId]`) and/or opens `/portfolio/[userId]` via "View Full Portfolio".

For the June 15 demo: implement the "Verified Only" toggle prominently — per PRD Section 10, toggling this with the 3 seed profiles (Ahmad/Priya/Wei) is the single clearest value-prop demonstration.

---

## 4. Component Inventory

Build these as shared components first — nearly every page depends on them.

| Component | Used on | Notes |
|---|---|---|
| `VerificationStamp` | Namecard, Portfolio, Verify page, Ledger | Circular seal, rotated, color by band (`--verified` / `--pending` / `--alert`), shows score or "VERIFIED" label |
| `TrustScoreBadge` | Namecard, candidate browse cards | Stamp + numeric score + band label ("Highly Authentic" etc.) |
| `SkillBar` | Namecard, Portfolio | Horizontal bar, score 0-100, "Verified ✓" or "Claimed (unverified)" suffix, two visual states |
| `ArtifactCard` | Verify page, Portfolio | Icon by type, name, confidence bar, status badge, date, expandable details |
| `ConfidenceBand` (utility, not visual) | Everywhere a score appears | Maps 0-100 → color token + label, per F5 trust score labels table — single source of truth, do not hardcode thresholds per-component |
| `LedgerEntry` | Portfolio audit trail | Mono-font row: block_index, hash (truncated), timestamp |
| `SimuHirePanelLayout` | SimuHire session | Three-column responsive shell |
| `BehavioralBar` | SimuHire right panel, report | 5 labeled bars, animated transitions |
| `ReportDimensionRow` | SimuHire report | Score + strength comment + growth comment, per F6 output format |
| `NamecardCard` | Namecard pages, candidate browse | The signature component — full and compact variants |
| `RoleSelector` | Register | Two large tappable role cards |
| `EmptyState` | Dashboard, Portfolio | Per skill guidance — invitation to act, plain interface voice |

---

## 5. Copy Guidelines

Following the writing principles in the frontend-design skill — write from the candidate/employer's side of the screen, active voice, no filler:

- Buttons describe the action and result consistently: "Run SimuHire" → session starts; report screen button says "Share to Namecard" → namecard updates immediately, confirmation toast says "Shared to your namecard."
- Verification states use CREDO's defined copy from the PRD where given (e.g. "Analysing commits and code structure...", "47 commits · High complexity · No flags · 88/100 Verified ✓") — don't paraphrase these, they're part of the product's voice.
- Empty states are invitations: "Connect GitHub to verify your first project" rather than "No artifacts found."
- Avoid words like "powerful," "seamless," "AI-driven" in UI copy (fine in marketing/landing page only). Inside the product, describe what happens, not how impressive it is.
- "Claimed (unverified)" is intentionally blunt — per F5, this honesty is a product feature, not a weakness to soften.

---

## 6. Build Order (aligned to PRD Section 9)

1. **Tokens + shared components first**: `ConfidenceBand` util, `VerificationStamp`, `SkillBar`, `TrustScoreBadge` — everything else depends on these.
2. **Auth + dashboards** (Week 1): Register/Login with role selector, Candidate Dashboard empty state, Employer Dashboard shell.
3. **Verify page + Portfolio** (Week 2): `ArtifactCard`, ledger display, public/private portfolio views.
4. **Namecard** (Week 3, early): build this as soon as portfolio data exists — it's the signature page and benefits from extra iteration time.
5. **SimuHire session + report** (Week 3): three-panel layout, `BehavioralBar`, `ReportDimensionRow`.
6. **Employer candidate browse** (Week 3-4): namecard grid, filters, "Verified Only" toggle — critical for the June 15 demo.
7. **Polish pass** (Week 4): responsive/mobile check on SimuHire (the trickiest layout), motion pass on stamps and verification transitions, empty-state copy review.

For the **June 15 intent form prototype**, prioritize in this order: Namecard (own + shared) → Candidate Browse with "Verified Only" toggle → Verify page (GitHub real) → Portfolio public view → SimuHire (pre-scripted, can reuse the report layout with seeded data).

 ┌───────────────────────────────┬─────────────────────────────┐
  │              URL              │            Page             │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /                             │ Landing                     │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /login                        │ Login                       │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /register                     │ Register                    │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /dashboard                    │ Candidate Dashboard         │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /dashboard/verify             │ Verify Artifacts            │
  │ /dashboard                    │ Candidate Dashboard         │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /dashboard/verify             │ Verify Artifacts            │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /dashboard/portfolio          │ Portfolio (private)         │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /dashboard/namecard           │ Namecard (own + edit)       │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /portfolio/ahmad-farid        │ Portfolio (public)          │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /card/ahmad-farid             │ Namecard (public/shareable) │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /simuhire/session-demo        │ SimuHire Session            │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /simuhire/session-demo/report │ SimuHire Report             │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /employer                     │ Employer Dashboard          │
  ├───────────────────────────────┼─────────────────────────────┤
  │ /employer/candidates          │ Employer Candidate Browse   │
  └───────────────────────────────┴─────────────────────────────┘
# Design

## Color

### Palette

| Name | Value | Usage |
|---|---|---|
| ink | #10192B | Primary text, dark surfaces, headers, primary buttons |
| parchment | #F5EDE0 | Page background — warm, aged-paper tone |
| parchment-shade | #EBE0CC | Secondary surfaces, hover states, chat bubbles |
| verified | #1F7A5C | Trust ≥80, verified badges, success states, share CTA |
| authentic-blue | #2563EB | Trust 60–79 ("Authentic" band) |
| pending | #D9A441 | Trust 40–59, pending verification, growth area comments |
| alert | #C4503A | Trust <40, failed verification, errors |
| slate | #6B7785 | Secondary text, icons, borders, muted UI |
| line | #DCD2BC | Hairline rules, card borders, dividers |

### Usage rules

- Status colors map 1:1 to trust score bands (PRD F5). Never introduce new status colors.
- `parchment` is deliberately warm — do not lighten toward cool off-white.
- `line` is tinted from the same warm family so dividers feel like paper creases, not generic UI hairlines.
- Primary buttons: `bg-ink text-parchment`. Danger/destructive: `bg-alert text-white`. Success CTA: `bg-verified text-white`.

## Typography

| Role | Family | Weight | Usage |
|---|---|---|---|
| Display | Fraunces (serif) | 600–900 | Page headings, namecard candidate name, hero text |
| Body / UI | Inter | 400, 500, 600 | All interface text: labels, buttons, body copy, nav |
| Data / Mono | IBM Plex Mono | 400, 500 | Trust scores, confidence percentages, hashes, ledger entries, timestamps |

### Scale

| Name | Size | Line height | Notes |
|---|---|---|---|
| display-xl | 3rem | 1.1 | Page heroes |
| display-l | 2rem | 1.15 | Section headers, namecard name |
| body-l | 1.125rem | 1.6 | — |
| body | 1rem | 1.5 | — |
| caption | 0.875rem | 1.4 | Letter-spacing 0.02em — for mono data labels |

## Spacing & Layout

- Base unit: 8px grid.
- Page max-widths: 420px (auth cards), 480px (namecard), 672px (portfolio/report), unconstrained with sidebar (dashboard).
- Section padding: `p-8` (desktop), `p-6` (mobile/compact).

## Components

### Cards

`border border-line rounded-card bg-parchment` — 1px hairline border, 6px radius, no shadow by default. Shadow (`shadow-md`) only for modals and the SimuHire live-indicator panel.

### VerificationStamp

Circular seal, 2px border, score + checkmark inside, band label below. **Rotated -4deg** — this is non-negotiable; it mimics an ink stamp. Color follows the confidence band. On first appearance: scale-in animation (0.9 → 1.0) + rotation settle. Sizes: sm (48px), md (72px), lg (96px), xl (128px).

### SkillBar

Horizontal progress bar (h-1.5), full width, rounded-full. Two visual states:
- Verified: colored bar at `confidence%` width, `✓ Verified` suffix in `text-verified`
- Claimed: empty grey bar, `Claimed (unverified)` suffix in `text-slate`

### TrustScoreBadge

VerificationStamp + numeric score + band label. Used on namecard and candidate browse cards.

### ArtifactCard

Border card with icon (by type), name, confidence mini-bar, status badge. Expandable accordion reveals raw metadata. Pending → verified transition: fade + 4px slide-up.

### BehavioralBar

Labeled horizontal bar 0–100. Updates smoothly between stage transitions (not per keystroke). Used in SimuHire right panel and report page.

### NamecardCard

Two variants:
- **Full** (max-width 480px): avatar initials, name (Fraunces 2xl), field/university/year, location + open-to-work, trust score stamp, verified skills list, SimuHire section if shared, action buttons.
- **Compact**: used in employer browse grid — name, stamp, top 3 skills, SimuHire badge.

### Sidebar (candidate nav)

Fixed left sidebar, 224px wide, `border-r border-line`. Active item: `bg-ink text-parchment`. Inactive: `text-slate hover:text-ink hover:bg-parchment-shade`.

## Motion

- Verification cards: fade + 4px slide-up when pending → verified.
- VerificationStamp first appearance: scale 0.9 → 1.0 + rotation settle (150ms ease-out).
- BehavioralBar updates: smooth transition-all duration-1000.
- No hover-tilt, no parallax, no gradient animations.
- Respect `prefers-reduced-motion`: disable scale-in and slide-up, keep instant state changes.

## Forms & Inputs

`border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate` — no ring, border darkens on focus. All inputs on parchment background.

## Iconography

lucide-react. Icon sizes: 11–13px in badges/labels, 14–16px in cards, 18px in nav/section headers. Color: `text-slate` default, context-specific color for status icons.

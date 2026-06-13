# Product

## Register

product

## Users

**Candidates** — Malaysian graduates and early-career professionals building a career identity. They're frustrated that their skills are self-reported and untrusted. Primary task: connect their work (GitHub, documents, credentials), run a SimuHire simulation, and share a verified namecard with employers.

**Employers** — HR and talent acquisition teams at Malaysian companies. Primary task: browse verified candidates, filter by trust score and skills, and evaluate behavioral fit before shortlisting. They need to make evidence-based hiring decisions in seconds, not hours.

## Product Purpose

CREDO gives candidates a cryptographically verified career identity and gives employers a trustworthy signal to evaluate them — addressing resume fraud (USD 600B/year), graduate readiness stagnation (stuck at 6/10 since 2022), and the lack of a unified proof-presentation-simulation platform in the Malaysian graduate market.

Success: a candidate shares their Smart Namecard link and an employer can verify their skills, trust score, and behavioral fit in under 10 seconds — without a meeting.

## Brand Personality

Trustworthy · Precise · Official

CREDO feels like an official, notarized document crossed with a modern fintech dashboard. The signature visual motif is a verification stamp/seal — ink pressed onto parchment. The aesthetic is deliberately warmer and more document-like than a generic SaaS product. Copy is direct and evidence-based; no filler adjectives.

## Anti-references

- **Typical AI startup aesthetics**: no gradient glow, no purple-on-dark, no "futuristic" animations or particle effects. CREDO's AI is a backend implementation detail, not a personality.
- **Generic SaaS admin panels**: avoid flat blue-and-white enterprise UI (Jira, Monday, generic HR tools).
- The parchment background is intentional and load-bearing — do not replace with neutral off-white or cool grey.

## Design Principles

1. **Proof over promise** — every UI element that claims something should show the evidence behind it. Scores have sources. Badges have audit trails. Nothing is decorative trust.
2. **The stamp is the signature** — the VerificationStamp component (rotated circular seal) is CREDO's primary trust signal. It appears wherever verification status matters and must never be flattened or genericised.
3. **10-second scanability** — the Smart Namecard must be readable and trustworthy in one glance. Design for the employer skimming 20 candidates, not the candidate editing their profile.
4. **Locked vs editable is a product feature** — the visual distinction between auto-generated verified data (locked) and self-declared data (editable) is not a UI constraint, it is the core value proposition. Never soften or blur this boundary.
5. **Honest copy** — "Claimed (unverified)" is intentionally blunt. Empty states are invitations, not apologies. No words like "powerful", "seamless", or "AI-driven" inside the product UI.

## Accessibility & Inclusion

WCAG 2.1 AA. Sufficient color contrast on parchment background (ink text passes AA). Keyboard navigable. Screen reader support for verification status (not communicated by color alone — stamps include text labels). Reduced motion: stamp scale-in animation should respect `prefers-reduced-motion`.

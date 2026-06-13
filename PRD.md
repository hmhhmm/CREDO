# CREDO — Product Requirements Document

**The Verified Career Identity Platform**
Talentbank Tech Hackathon 2026 — First Cohort
Tagline: *Prove. Present. Perform.*

---

## 1. Overview

CREDO is a two-sided platform that gives candidates a verified career identity and gives employers a trustworthy way to evaluate them. It addresses graduate career readiness stagnation, resume fraud, and the lack of an end-to-end signal that ties verified credentials, a presentable profile, and behavioral simulation together.

### Problem Statement
- Graduate career readiness has been stuck at 6/10 since 2022 (Talentbank GCA 2025).
- Resume fraud costs businesses USD 600B/year; 1 in 4 candidate profiles projected fraudulent by 2028 (Gartner).
- Existing tools (LinkedIn, HackerRank, ATS systems, career fairs) solve only fragments of the problem — none combine verification, presentation, and behavioral proof.

### Platform Thesis
Three pillars, one flow, every feature serves exactly one pillar:

| Pillar | Description | Core Feature |
|---|---|---|
| **Prove** | Verification Engine + tamper-proof ledger | F2, F4 |
| **Present** | Smart Namecard, auto-built from proof | F5 |
| **Perform** | SimuHire — behavioral results feed back into the namecard | F6 |

The Smart Namecard is the always-present output, enriched by both verification and simulation.

---

## 2. User Roles & Journeys

### Candidate Journey
1. Register, select role: Candidate.
2. Complete editable profile (photo, bio, LinkedIn, preferred roles).
3. Connect GitHub / upload documents / add credentials — verification agents run automatically (F2).
4. Candidate self-initiates SimuHire (no employer invite required at this stage).
5. Candidate completes 20–30 min simulation (F6).
6. Behavioral Traits Report generated; candidate sees it first; decides to share or keep private.
7. Verified artifacts written to tamper-proof ledger (F4).
8. Smart Namecard auto-generates from verified data (including SimuHire badge if shared); verified fields locked, editable fields stay flexible (F5).
9. Candidate shares namecard link with any employer.

### Employer Journey
1. Register, select role: Employer.
2. Post job listings with required skills (F1).
3. Browse candidates; filter by verified skills, trust score, university, SimuHire status (F1).
4. View Smart Namecard for a 10-second read (F5).
5. View Full Portfolio for complete artifact history (F3).
6. Review Behavioral Traits Report (visible if candidate has completed SimuHire and chosen to share it) (F6).
7. Shortlist with evidence, not gut feel.

---

## 3. Feature Requirements

### F1 — Career OS Marketplace (Compulsory base layer)
The two-sided platform all other features sit on; fulfils Talentbank's compulsory Career OS module requirement.

**Candidate side**
- Register via email or GitHub OAuth.
- Editable profile: photo, bio, LinkedIn, GitHub, preferred roles, location.
- Self-reported skill tags (unverified until processed by F2).
- Dashboard: verification status, namecard preview, simulation history.

**Employer side**
- Register with company name, industry, size.
- Post job listings: title, required skills, verified-only toggle.
- Browse candidates via namecard grid.
- Filter by skills, trust score, university, SimuHire completion.

**Matching logic (prototype, no ML)**
- Employer-specified required skills are matched against candidates' verified skills first.
- Unverified matching skills shown with a grey "claimed" badge below.
- SimuHire-completed candidates rank above those without.

**Acceptance criteria**
- Candidate can register, log in, and see an empty dashboard.
- Employer can log in, browse candidates, and filter by verified skills.
- Verified candidates rank above unverified in search results.

---

### F2 — Autonomous Verification Engine (the "Prove" layer)
Three independent AI agents, one per artifact class, each producing a confidence score (0–100) and writing to the credential ledger only when confidence ≥ 60. Foundational — build first.

#### Agent A — GitHub Agent
- Artifact class: code repositories. Serves CS/Data Science/Engineering students.
- Trigger: "Connect GitHub" → OAuth → repo list → candidate selects repos → job queued.
- Checks:
  - **Commit Authenticity** — author email consistency, ≥5 commits, commit span >1 day.
  - **Code Complexity (AST)** — fetch up to 5 JS/TS files, parse with Acorn, score on AST node-type diversity.
  - **Originality Flag** — detects boilerplate READMEs, generic variable naming, tutorial structure; ≥2 triggers = penalty.
- Score: `confidence = commitScore×0.4 + astScore×0.4 + origBonus×0.2` (origBonus = 100 if no flags, else 0).
- UI: pending state ("Analysing commits and code structure..."), result state (e.g. "47 commits · High complexity · No flags · 88/100 Verified ✓").

#### Agent B — Document Agent
- Artifact class: reports, essays, case studies, research papers. Serves Business/Humanities/non-code fields.
- Trigger: "Upload Document" — PDF or DOCX, max 10MB.
- Checks:
  - **AI Text Detection** — text sent to OpenAI gpt-4o-mini, returns `ai_probability` and verdict.
  - **Writing Complexity** — vocabulary diversity, sentence variance.
  - **Authorship Consistency** — from 2nd submission onward, compares style metrics against prior verified docs; skipped on first document.
- Score: `confidence = (100 - ai_probability)×0.5 + writing_complexity×0.3 + vocabulary_diversity×0.2`.
- Raw document content is NOT stored — only hash, scores, metadata (PDPA compliant).

#### Agent C — Credential Agent
- Artifact class: certificates, awards, competition results, transcripts. Serves all fields.
- Trigger: "Add Credential" — certificate image (JPG/PNG) or PDF.
- Checks:
  - **OCR Extraction** — Tesseract.js extracts institution, candidate name, date, title.
  - **Issuer Registry Match** — fuzzy match (Levenshtein, ≥80% similarity) against a hardcoded registry of Malaysian universities, certification bodies, and hackathon organisers.
  - **Name Match** — certificate name vs registered user name, with allowance for partial matches (Chinese names, initials, aliases).
- Confidence rules: issuer match + name match → 90 (Verified); issuer match + name mismatch → 50 (manual review); no issuer match → 30 (Unverified).

**Acceptance criteria**
- GitHub repo verified end-to-end in under 60 seconds.
- Document upload returns AI probability score and verdict.
- Certificate upload triggers OCR and issuer match attempt.
- All three agents write to `credential_ledger` when confidence ≥ 60.
- Raw document content discarded after processing.

---

### F3 — Living Portfolio
The candidate's full detailed career record, distinct from the Smart Namecard (compact summary).

**Private view** (`/dashboard/portfolio`)
- Header: name, university, graduation year, overall trust score.
- "Share Portfolio" copies public URL.
- Verified artifacts grid (newest first), each expandable to raw metadata + scores.
- Career timeline (oldest → newest), each node showing artifact name, type icon, confidence chip.
- Ledger integrity panel: current Merkle root hash (truncated), total entries, expandable audit trail.

**Public view** (`/portfolio/[userId]`)
- Same layout, but pending/failed artifacts hidden — only verified shown.
- No edit controls.
- Footer shows integrity hash.
- "Contact" button reveals candidate's contact email.

**Acceptance criteria**
- Candidate can share a public portfolio URL.
- Public URL loads without login and shows only verified artifacts.
- Audit trail displays hash chain with block index and timestamps.
- Trust score updates within 5 seconds of a new verification.

---

### F4 — Immutable Credential Ledger
Tamper-proof Merkle hash chain — the technical backbone of trust.

- Every verified artifact is a leaf in a Merkle tree:
  1. Hashed (SHA-256) with its metadata.
  2. Added to the list of previous hashes.
  3. New root hash computed.
  4. Stored: leaf hash, root hash, previous root hash.
- Verification: rebuild root from all stored leaves → compare to stored root. Match = intact; mismatch = tampering detected.
- Hashed payload per artifact: `user_id, artifact_name, artifact_type, confidence, verified_at, status`.

**Critical transaction rule**: every write to `verified_artifacts` with `status='verified'` MUST be wrapped in a single DB transaction with the corresponding `credential_ledger` write — never let these get out of sync.

- Candidate sees: root hash, entry count, expandable audit trail.
- Employer sees: same audit trail + "Verify Integrity" button (recalculates root hash client-side; green tick = intact, red warning = mismatch).

**Acceptance criteria**
- Every verified artifact creates a ledger row atomically.
- Candidate audit trail renders with block index and hashes.
- Employer "Verify Integrity" button recalculates and confirms.

---

### F5 — Smart Namecard ("Present" layer)
A compact, auto-generated, employer-first card built entirely from verified data — scannable in under 10 seconds.

**Contents**
- Avatar, name, field of study, university, graduation year, location, "Open to Work" status.
- Trust score (0–100) with label.
- Verified skills with confidence bars; unverified self-reported skills shown as "Claimed (unverified)".
- SimuHire assessment summary (if shared): completion status, overall score, key dimension scores.
- Action buttons: View Full Portfolio, Contact, QR Code.

**Locked vs editable fields**

| Locked (auto-generated) | Editable (candidate-controlled) |
|---|---|
| Verified skill scores | Profile photo |
| Trust score | Bio / headline |
| SimuHire badge + scores | LinkedIn URL |
| Credential badges | GitHub URL |
| Audit trail hash | Preferred roles |
| Verified date stamps | Location, contact email, "Open to Work" status |

Rule: anything derived from F2, F4, or F6 is locked; anything self-declared is editable.

**Trust score**
- Labels: ≥80 Highly Authentic (green); 60–79 Authentic (blue); 40–59 Inconclusive (yellow); <40 Low Confidence (red).
- Calculation: weighted average of all `verified` artifact confidence scores — GitHub ×1.5, Documents ×1.0, Credentials ×1.0, SimuHire ×1.2.

**Sharing**
- Direct link (`credo.app/card/[userId]`), QR code, email-signature embed, one-click Talentbank export.

**Acceptance criteria**
- Namecard auto-generates after the first verified artifact.
- Locked fields cannot be edited by the candidate.
- Editable fields update immediately.
- Unverified claimed skills clearly labelled.
- SimuHire badge appears after simulation completion (if shared).
- Shareable URL renders without login.

---

### F6 — SimuHire ("Perform" layer)
A 20–30 minute AI-driven interview simulation using four specialised agents, producing a Behavioral Traits Report that enriches the Smart Namecard.

**Trigger**: Self-initiated by the candidate (no employer invite required). Candidate selects a simulation type from their dashboard and starts the session directly.

**Simulation types**
- **Technical** (CS/Engineering/Data Science): broken-system scenario → diagnosis → spec shift → adaptation → resolution.
- **Business Case** (Business/Finance/Management): crisis memo → response strategy → client pushback → hold/adapt → resolution.
- **General Behavioral** (any field): escalating situational questions, testing composure and self-awareness.

**Four-agent architecture** (all powered by `claude-sonnet-4-6`)

| Agent | Role | Visibility | Timing |
|---|---|---|---|
| 1. Scenario Master | Presents the challenge; manages stage progression (Setup → Challenge → Escalation → Resolution); ≤120 words/response | Visible | During session |
| 2. Stakeholder | Simulates a difficult colleague/client persona ("Scope Creeper", "Sceptic", "Escalator"); ≤80 words/response | Visible | During session, 1–2 per session |
| 3. Evaluator | Scores adaptability, communication, problem-solving, stress response, systems thinking (0–100 each); for each dimension provides one evidence quote supporting the score; returns JSON | Silent | Once, on full transcript at session end |
| 4. Feedback | Generates a narrative Behavioral Traits Report: overall score, 3 key observations, and a "Strengths" / "Growth Areas" breakdown explaining what drove scores up or down per dimension (≤25 words each, evidence-based) | N/A | Immediately after Evaluator |

**SimuHire UI (three-panel layout)**
- Header: simulation type, current stage (of 4), progress bar, 30-minute timer (soft, not a hard stop).
- **Left panel**: read-only conversation history, color-coded by speaker (Interviewer = blue, Stakeholder = amber, System = grey).
- **Center panel**: text input for candidate responses; optional code-block toggle for technical simulations; "Submit Response" triggers next turn.
- **Right panel**: live behavioral indicators, updated per stage (not per exchange), labelled "Indicative only — final report shown at end."
- Stage transitions explicitly announced by the Scenario Master.

**Post-simulation flow**
1. Candidate sees their full Behavioral Traits Report immediately.
2. Candidate chooses: Share (badge added to namecard, employer can request full report) or Keep Private (no badge, report visible only to candidate).
3. Retake policy: 7-day cooldown per simulation type; best score is kept on the namecard.

**Behavioral Traits Report — output format**

For each of the five behavioral dimensions, the Feedback Agent generates a paired strengths/growth-area comment grounded in transcript evidence — not generic praise or criticism. Both sides of each comment must be traceable to a specific moment in the conversation.

| Element | Description |
|---|---|
| Overall Score | Weighted average of the 5 dimension scores (0–100) |
| Per-dimension score | 0–100 for Adaptability, Communication, Problem-Solving, Stress Response, Systems Thinking |
| Strength comment (per dimension) | 1 sentence (≤25 words) citing a specific transcript moment that drove the score up — e.g. the candidate adjusted their plan quickly after the spec changed |
| Growth area comment (per dimension) | 1 sentence (≤25 words) citing a specific transcript moment that capped the score — e.g. the candidate didn't address the stakeholder's follow-up question directly |
| Key Observations | 3 cross-cutting insights (≤25 words each) synthesising patterns across dimensions |

**Reasoning requirements (validity & soundness)**
- Every strength and growth-area comment must reference an identifiable event in the transcript (a specific exchange, decision, or response) — never a vague trait ("good communicator").
- Comments must be causally linked to the score: a high score's strength comment should explain *why* it's high; a lower score's growth comment should explain *what specifically* would raise it.
- The Feedback Agent receives the Evaluator's per-dimension evidence quotes as input and must build its comments directly from those quotes — it does not re-read the raw transcript or invent new evidence.
- Comments are constructive in tone even when score is low — framed as "what would improve this" rather than purely critical.
- If a dimension score is high (≥75) with no clear weakness identified by the Evaluator, the growth-area comment may note "no significant friction observed in this session" rather than fabricate a flaw.

**Example (Technical Simulation, Adaptability = 82)**
- Strength: "Revised the caching strategy within two exchanges after the stakeholder changed the latency requirement, without restating the original plan."
- Growth area: "Initial diagnosis assumed a database issue before checking the load balancer logs provided in the brief."

**Updated Feedback Agent prompt**
> "Based on the evaluator scores and evidence quotes, write a professional behavioral assessment report. For each dimension, include: (1) the score, (2) a strength comment (≤25 words) explaining what specifically drove the score, grounded in the provided evidence quote, and (3) a growth-area comment (≤25 words) explaining what specifically would raise the score, grounded in the provided evidence quote. Then include an overall score (0–100 weighted average) and three cross-cutting key observations (≤25 words each). Do not invent evidence not present in the supplied quotes. Be specific, evidence-based, and fair."

**Session flow (technical)**
1. Candidate selects simulation type and starts session → stored in `simuhire_sessions` (status `active`, `employer_id` null).
2. Each candidate message → Scenario Master (+ Stakeholder at appropriate stages) respond → appended to conversation history.
3. On "End Simulation": Evaluator scores full transcript → Feedback Agent generates report → atomic write to `verified_artifacts` + `credential_ledger` → candidate routed to report view.
4. Candidate decides to share or keep private → if shared, namecard badge included when namecard is generated.

**Acceptance criteria**
- Candidate can self-initiate a SimuHire session and select a simulation type without an employer invite.
- Candidate sees the three-panel simulation UI.
- All four agents respond correctly during and after the simulation.
- Evaluator runs once, on the full transcript, at session end.
- Candidate sees their own report before the share decision.
- Namecard badge appears only if candidate chooses to share.
- 7-day retake cooldown is enforced.

---

## 4. Privacy & Data Handling (PDPA 2010 Compliance)

Governed by Malaysia's Personal Data Protection Act 2010. Non-negotiable rules:

**Data stored**
- Credential hashes, scores, metadata, session history.

**Data NOT stored**
- Raw document content (processed then discarded).
- GitHub source code (analysed in memory only).
- Certificate images (OCR-extracted then discarded).

**Candidate controls**
- SimuHire transcript visible only to the candidate by default.
- SimuHire report sharing is candidate's decision.
- Portfolio visibility (public/private) controlled by candidate.
- Full account deletion within 30 days of request.

**Employer controls**
- See scores and reports only — never raw artifacts (documents, code, certificate images).
- SimuHire report accessible only if the candidate chose to share it.

**Consent**
- Explicit consent checkbox at registration.
- Separate consent per artifact type before upload.
- Separate consent before each SimuHire session.
- All consent timestamps logged and auditable.

**Storage**
- Data stored within/accessible to Malaysian data protection jurisdiction.
- Passwords hashed with bcrypt; tokens encrypted at rest.
- HTTPS enforced on all endpoints.

---

## 5. Talentbank Data Feedback Loop

Verified credentials and SimuHire sessions generate anonymised aggregate signals feeding Talentbank's research and benchmarking programmes:

| Signal | Description | Feeds Into |
|---|---|---|
| Skills Demand Map | Most common verified skills vs frequently claimed/rarely verified skills | Annual Graduate Skills Report |
| Institutional Readiness Score | Anonymised average trust scores per university cohort | Graduate Employability Award (GEA) |
| Behavioral Benchmark | Average SimuHire dimension scores per field of study | Employer benchmarking data |
| Curriculum Gap Detector | Skills consistently claimed but failing verification, per institution | University partnership conversations |

**Implementation**
- Nightly aggregation job; all outputs strictly anonymised (no individual IDs).
- Stored in a separate analytics schema, accessible only to the Talentbank admin dashboard.
- No individual candidate data exposed via this pipeline.

---

## 6. System Architecture

| Layer | Component | Technology |
|---|---|---|
| Frontend | Candidate + Employer portal | Next.js 14 + Tailwind |
| UI Components | Shared design system | shadcn/ui + Lucide |
| Authentication | GitHub OAuth + email auth | NextAuth.js v5 |
| Backend API | REST + agent coordination | Next.js API Routes |
| Verification Agents | GitHub / Document / Credential | Octokit + OpenAI API |
| SimuHire Agents | Scenario / Stakeholder / Evaluator / Feedback | Anthropic Claude API (claude-sonnet-4-6) |
| Matching Engine | Skill similarity + ranking | pgvector (PostgreSQL) |
| Credential Ledger | Merkle hash chain | Custom implementation + PostgreSQL |
| Task Queue | Async agent job processing | Redis + Upstash |
| File Processing | Temporary, in-memory only | Multer (no disk storage) |
| Database | Primary data store | Neon PostgreSQL |
| Analytics | Aggregate signal pipeline | PostgreSQL + cron job |
| Deployment | Full stack | Vercel |

### Data Flow Summary
- **Verification**: Candidate action → API route → correct agent → returns score + metadata → if confidence ≥ 60, atomic transaction writes `verified_artifacts` + `credential_ledger` → namecard score recalculated → frontend SWR polling updates UI.
- **SimuHire**: Candidate self-initiates session → each message routed through Scenario + Stakeholder agents → on end, Evaluator scores transcript → Feedback generates report → atomic write to `verified_artifacts` + `credential_ledger` → candidate reviews report → share decision → namecard generated/updated with badge if shared.

---

## 7. Database Schema

**users**
`id, name, email, github_username, github_token (encrypted), role ('candidate'|'employer'), avatar_url, bio, linkedin_url, preferred_roles (text[]), location, open_to_work (bool), avg_sentence_variance (float), created_at`

**verified_artifacts**
`id, user_id, artifact_type, artifact_name, artifact_url, confidence, status ('pending'|'verified'|'failed'), ai_generated (bool), metadata (jsonb), hash, verified_at, created_at`

**credential_ledger**
`id, user_id, artifact_id, leaf_hash, root_hash, block_index, prev_hash, created_at`

**simuhire_sessions**
`id, candidate_id, employer_id (nullable — null for self-initiated sessions), simulation_type ('technical'|'business'|'general'), status ('active'|'completed'), stakeholder_persona, conversation (jsonb), evaluator_scores (jsonb), overall_score (int), report (jsonb), candidate_shared (bool), started_at, completed_at, retake_available_at`

**job_listings**
`id, employer_id, title, company, required_skills (text[]), require_verified (bool), require_simuhire (bool), description, created_at`

**consent_log**
`id, user_id, consent_type, granted_at, ip_hash`

---

## 8. Tech Stack / Dependencies

```
npm install next-auth@5 @auth/drizzle-adapter
npm install drizzle-orm @neondatabase/serverless drizzle-kit
npm install @octokit/rest acorn
npm install openai                  # document agent
npm install @anthropic-ai/sdk       # SimuHire agents
npm install pdf-parse mammoth       # document extraction
npm install tesseract.js            # OCR for credentials
npm install fastest-levenshtein     # issuer fuzzy match
npm install zustand swr             # state + data fetching
npm install recharts lucide-react   # charts + icons
npm install bcryptjs                # password hashing
npm install crypto                  # Merkle tree (built-in)
npx shadcn@latest init              # UI components
```

---

## 9. Build Plan (28 Days)

### Week 1 — Foundation (Days 1–7)
- F1: Auth (GitHub OAuth + email), role selection, basic profiles.
- F1: Candidate + employer dashboard scaffolds.
- F1: Job listings, candidate browse, verified-skills filter.
- DB: Full schema on Neon, Drizzle setup, seed scripts.
- Consent log implemented at registration.
- **Done when**: both sides can register, log in, and navigate.

### Week 2 — Verification Core (Days 8–14)
- F2: GitHub Agent (Octokit + AST + commit analysis).
- F2: Document Agent (OpenAI + text extraction).
- F2: Credential Agent (Tesseract OCR + registry match).
- F4: Merkle ledger implementation + atomic transactions.
- F3: Living Portfolio (private + public views).
- **Done when**: GitHub repo verified end-to-end, ledger writes correctly.

### Week 3 — Identity + Simulation (Days 15–21)
- F5: Smart Namecard (auto-generated, locked/editable fields).
- F5: Sharing options (link, QR, Talentbank export).
- F6: SimuHire three-panel UI.
- F6: All four agents (Scenario, Stakeholder, Evaluator, Feedback).
- F6: Session flow + report generation.
- F6: Candidate report view + share/keep-private decision.
- **Done when**: full simulation session completable, report generates, badge appears on namecard after candidate shares.

### Week 4 — Ship (Days 22–28)
- Integration testing across all six features.
- Privacy: consent flows, data discard after processing.
- Analytics: aggregate pipeline cron job.
- Demo data seeded (3 candidates, varied trust scores).
- SimuHire demo scenarios pre-written.
- Documentation + README + env var template.
- Live deployment on Vercel.
- 3-minute demo rehearsed and polished.
- **Done when**: live URL accessible, full demo runs clean in 3 minutes.

---

## 10. Prototype Scope for Intent Form (June 15, 2026)

Honest scoping — build what demonstrates the concept clearly.

| Build for June 15 | Defer to 28-day build |
|---|---|
| GitHub verification (real) | Document agent (mock) |
| Verified Namecard (seeded data) | Full Merkle ledger |
| Employer browse + filter | Full SimuHire (pre-scripted) |
| Basic candidate dashboard | Credential agent OCR |
| SimuHire mock demo flow | Analytics pipeline |
| Living Portfolio public URL | PDPA consent flows |

**Demo specifics**
- Use the team's own GitHub account for live verification.
- Pre-seed 3 candidate profiles (varied trust scores; one with SimuHire completed).
- SimuHire can use pre-scripted but dynamic-feeling responses.
- Namecard must render real GitHub data.
- Employer side must demonstrate the "Verified Only" filter.

**Demo seed profiles**

| Candidate | Trust Score | Verified Skills | SimuHire |
|---|---|---|---|
| Ahmad Farid | 87 | Python, ML, SQL | Done |
| Priya Nair | 71 | React, Node.js | Not done |
| Wei Chen | 38 | None | Not done |

Toggling "Verified Only" leaves only Ahmad and Priya visible — demonstrating the value proposition in one click.

---

## 11. Judging Criteria Alignment

| Criterion | Weight | Target | How CREDO Addresses It |
|---|---|---|---|
| Product & UX Thinking | 30% | 28–30 | Legible 3-pillar thesis, complete user journeys both sides, 10-second namecard, clear SimuHire UI spec, locked/editable namecard rules, privacy/consent flows, Talentbank data loop |
| System Design & Integration | 25% | 23–25 | Clean PROVE→PRESENT←PERFORM architecture, defined agent roles/timing/data contracts, end-of-transcript evaluator design, atomic ledger transactions, separated analytics schema, Career OS integration |
| Completeness | 20% | 18–20 | Five demo-ready flows (GitHub verify→namecard, employer filter, SimuHire→report→badge, full profile + audit trail, integrity check), live Vercel deployment |
| AI Craft | 15% | 14–15 | AST parsing, OpenAI authorship detection, OCR + fuzzy matching, four distinct Claude agents, evaluator/feedback prompt engineering, weighted trust scoring |
| Code Quality | 10% | 9–10 | TypeScript throughout, typed Drizzle ORM (no raw SQL), isolated agent functions with typed I/O, atomic transactions, unit tests (Merkle tree, trust score, agent outputs), README, auditable consent log |

---

## 12. Competitive Position

| Platform | Credentials | Simulation | Trusted Profile | Malaysia-focused |
|---|---|---|---|---|
| LinkedIn | Self-reported | None | Self-built | No |
| HackerRank | None | Static tests | None | No |
| HireVue | None | Video only | None | No |
| Karat | None | Human-led | None | No |
| Glassdoor | None | None | Self-reported | No |
| **CREDO** | **Verified ✓** | **AI multi-agent ✓** | **Auto-generated ✓** | **Yes ✓** |

No equivalent platform currently exists in Malaysia or the broader SEA graduate market.

---

## 13. Pain Points Solved

| Pain Point | CREDO Solution |
|---|---|
| Graduate readiness stuck at 6/10 since 2022 | Namecard shows verified proof, not claims — shifts employer perception via mathematical evidence |
| One-time career fair relationships | Portfolio + Namecard grow with every commit and simulation — stays relevant across the career arc |
| 597K votes/data points unused individually | Verified profiles + SimuHire convert population data into individual career intelligence |
| Skills mismatch (32.4%, DOSM 2023) | Verification shows precisely which skills are present vs claimed, feeding curriculum signal back to universities |
| Post-graduation "black hole" | Ledger follows the candidate from first commit at 20 to senior pivot at 45 |
| Employer ROI invisible pre-hire | SimuHire gives behavioral fit evidence before hiring, reducing bad-hire cost |
| Trust deficit on both sides | Cryptographic proof + behavioral simulation = trust without meetings |
| No Talentbank data loop | Anonymised aggregate signals feed GCA benchmarking, GEA, and curriculum gap detection |

---

## 14. Research Backing

1. Talentbank GCA 2025 — graduate readiness rated 6/10 since 2022 (3 years stagnant).
2. DOSM Malaysia 2024 — skills mismatch worsened from 22.9% to 32.4% (2016–2023).
3. CrossChq 2025 — resume fraud costs USD 600B/year; 70% of workers have lied on resumes.
4. Gartner 2024 — 25% of all candidate profiles projected fraudulent by 2028.
5. ZKBAR-V (MDPI Sensors 2025) — ZKP-enabled blockchain credential verification with zkEVM.
6. CodEX (AICS) — AST-based plagiarism detection, 95% accuracy including evasion.
7. NLP Authorship Framework (arXiv 2026) — stylometric analysis for human vs. AI text classification.
8. Cognitive Flexibility + Interview (Educ. Sci. 2025) — task-switching under pressure predicts interview success more reliably than static knowledge recall.
9. AI Mock Interview (CSCW 2025) — AI virtual interviewers capture behavioral signals beyond static text.
10. AI Talent Assessment (SuperAGI 2025) — AI assessment tools reduce time-to-hire by 50%; market projected at USD 15.24B by 2030 (24.8% CAGR).
11. Digital Credentials + Hiring (UpSkill America 2024) — employers view digital credentials positively but need uniformity and validation.
12. Malaysia e-Scroll (MoHE 2026) — blockchain credential verification cut processing time from 5 days to minutes at Malaysian institutions.

---

## 15. Key Dates

| Milestone | Date |
|---|---|
| Intent Form | 15 June 2026, 23:59 MYT |
| Full Build Complete | 26 July 2026 |
| Grand Finale | 29 August 2026 |
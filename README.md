# CREDO — Verified Career Identity Platform

> **Prove. Present. Perform.**
> Talentbank Tech Hackathon 2026 — First Cohort

CREDO is a two-sided platform that gives candidates a verified career identity and gives employers a trustworthy way to evaluate them — addressing graduate career readiness stagnation, resume fraud, and the absence of any tool that combines verification, presentation, and behavioral proof in one flow.

---

## Why CREDO Exists

- Graduate career readiness has been stuck at **6/10 since 2022** (Talentbank GCA 2025).
- Resume fraud costs businesses **USD 600B/year**; 1 in 4 candidate profiles projected fraudulent by 2028 (Gartner).
- Skills mismatch worsened from 22.9% to **32.4%** between 2016 and 2023 (DOSM Malaysia).
- No existing platform — LinkedIn, HackerRank, HireVue, or Karat — combines credential verification, a presentable profile, and behavioral simulation. None are Malaysia-focused.

---

## Three Pillars, One Flow

Every feature in CREDO serves exactly one pillar:

| Pillar | What it does | Features |
|---|---|---|
| **Prove** | AI verification agents analyse artefacts and write results to a tamper-proof Merkle ledger | F2 Verification Engine, F4 Credential Ledger |
| **Present** | A Smart Namecard auto-generates from verified data — scannable by an employer in 10 seconds | F5 Smart Namecard, F3 Living Portfolio |
| **Perform** | A 30-minute AI behavioral simulation produces a Behavioral Traits Report that enriches the namecard | F6 SimuHire |

The Smart Namecard is the always-present output, enriched by both verification and simulation.

---

## Monorepo Structure

```
CREDO/
├── frontend/          React + Vite + Tailwind — candidate & employer UI
├── backend/           FastAPI + async SQLAlchemy — agents, ledger, SimuHire API
├── PRD.md             Full product requirements document (source of truth)
├── FRONTEND.md        Design spec: tokens, page layouts, component inventory
└── CLAUDE.md          Claude Code guidance (never commit to git)
```

---

## Quick Start

### Frontend (runs entirely on mock data — no backend required)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # fill in all secrets before running
alembic upgrade head           # apply all migrations to the database
uvicorn app.main:app --reload  # http://localhost:8000
```

API docs: `http://localhost:8000/docs`
Health check: `GET /health`

---

## Key Dates

| Milestone | Date |
|---|---|
| Intent Form submission | 15 June 2026, 23:59 MYT |
| Full Build submission | 26 July 2026 |
| Grand Finale | 29 August 2026 |

---

## User Journeys

### Candidate

1. Register and select role: Candidate.
2. Complete editable profile — photo, bio, LinkedIn, preferred roles, location.
3. Connect GitHub / upload documents / add credentials — verification agents run automatically.
4. Self-initiate a SimuHire session (no employer invite required).
5. Complete a 30-minute four-stage simulation.
6. Receive a Behavioral Traits Report — decide to share it or keep it private.
7. All verified artefacts are written to the tamper-proof ledger.
8. Smart Namecard auto-generates from verified data; SimuHire badge added if shared.
9. Share the namecard link with any employer.

### Employer

1. Register and select role: Employer.
2. Post job listings with required skills and verified-only toggle.
3. Browse candidates filtered by verified skills, trust score, university, or SimuHire status.
4. View the Smart Namecard for a 10-second read.
5. View the Full Portfolio for complete artefact history and audit trail.
6. Review the Behavioral Traits Report (only if the candidate chose to share it).
7. Shortlist with evidence, not gut feel.

---

## Features

### F1 — Career OS Marketplace

The two-sided platform foundation fulfilling Talentbank's compulsory Career OS module requirement.

**Candidate side**: email or GitHub OAuth registration; editable profile; self-reported skill tags; dashboard with verification status, namecard preview, and simulation history.

**Employer side**: company profile; job listing CRUD with required skills and verified-only toggle; candidate browse via namecard grid; filters for skills, trust score, university, and SimuHire status.

**Matching logic**: verified skills matched first; unverified claimed skills shown as grey "Claimed" badges; SimuHire-completed candidates rank above those without.

---

### F2 — Autonomous Verification Engine (the Prove layer)

Three independent AI agents — one per artefact class — each producing a confidence score (0–100). Artefacts are written to the credential ledger only when confidence ≥ 60.

#### Agent A — GitHub Agent
For CS, Data Science, and Engineering students.

- **Trigger**: "Connect GitHub" → OAuth → repo list → candidate selects repos → job queued.
- **Checks**: commit authenticity (author email consistency, ≥5 commits, span >1 day); code complexity via Acorn AST (node-type diversity across up to 5 JS/TS files); originality flags (boilerplate README, generic naming, tutorial structure — ≥2 flags = penalty).
- **Scoring**: `confidence = commitScore×0.4 + astScore×0.4 + origBonus×0.2`
- **Privacy**: GitHub source code analysed in memory only — never stored.

#### Agent B — Document Agent
For Business, Humanities, and non-code fields.

- **Trigger**: upload PDF or DOCX, max 10 MB.
- **Checks**: AI text detection (Groq `llama-3.1-8b-instant` returns `ai_probability`); writing complexity (vocabulary diversity, sentence variance); authorship consistency (from 2nd submission — compared against stored `avg_sentence_variance` baseline).
- **Scoring**: `confidence = (100 - ai_probability)×0.5 + writing_complexity×0.3 + vocabulary_diversity×0.2`
- **Privacy**: raw document content never stored — only hash, scores, and metadata.

#### Agent C — Credential Agent
For all fields.

- **Trigger**: upload certificate image (JPG/PNG) or PDF.
- **Checks**: Tesseract OCR extracts institution, candidate name, date, and title; Levenshtein fuzzy match against the issuer registry (Malaysian universities, certification bodies, hackathon organisers); name match against the registered user profile.
- **Confidence rules**: issuer match + name match → 90 (Verified); issuer match + name mismatch → 50 (manual review); no issuer match → 30 (Unverified).
- **Privacy**: certificate images discarded after OCR extraction.

---

### F3 — Living Portfolio

The candidate's full detailed career record — more detailed than the namecard.

**Private view** (`/dashboard/portfolio`): verified artefacts grid (newest first, each expandable to raw metadata and scores); career timeline (oldest to newest, each node showing type icon and confidence chip); ledger integrity panel (Merkle root hash, total entries, expandable audit trail).

**Public view** (`/portfolio/:userId`): same layout but pending/failed artefacts hidden; no edit controls; integrity hash in footer; "Contact" button reveals the candidate's contact email. Loads without login.

---

### F4 — Immutable Credential Ledger

Tamper-proof Merkle hash chain — the technical backbone of trust.

**How it works**: each verified artefact is hashed (SHA-256) with its metadata payload (`user_id, artifact_name, artifact_type, confidence, verified_at, status`), appended to the leaf list, and a new Merkle root computed. The ledger stores: leaf hash, root hash, previous root hash, and block index.

**Verification**: rebuild root from all stored leaf hashes and compare to stored root — match means intact; mismatch means tampering detected.

**Critical transaction rule**: every write to `verified_artifacts` with `status='verified'` must be wrapped in a single database transaction with the corresponding `credential_ledger` write. These two rows must never be split across separate transactions.

Both the candidate and employer can see the audit trail. The employer's "Verify Integrity" button recalculates the Merkle root client-side and returns a green tick or red warning.

---

### F5 — Smart Namecard (the Present layer)

A compact, auto-generated, employer-first card built entirely from verified data — designed to be scanned in under 10 seconds.

**Contents**: avatar, name, field of study, university, graduation year, location, open-to-work status; trust score (0–100) with label; verified skills with confidence bars; unverified self-reported skills labelled "Claimed (unverified)"; SimuHire assessment summary (if shared); View Portfolio, Contact, and QR Code buttons.

**Locked vs editable fields**

| Locked (auto-generated from verified data) | Editable (candidate-controlled) |
|---|---|
| Verified skill scores | Profile photo |
| Trust score | Bio / headline |
| SimuHire badge and scores | LinkedIn URL, GitHub URL |
| Credential badges | Preferred roles |
| Audit trail hash and verified dates | Location, contact email, Open to Work status |

Rule: anything derived from F2, F4, or F6 is locked. Anything self-declared is editable.

**Trust score formula**: weighted average of all verified artefact confidence scores:
- GitHub ×1.5 · Documents ×1.0 · Credentials ×1.0 · SimuHire ×1.2

**Trust score bands**: ≥80 Highly Authentic (green) · 60–79 Authentic (blue) · 40–59 Inconclusive (yellow) · <40 Low Confidence (red).

**Sharing**: direct link (`credo.app/card/:userId`), QR code, email-signature embed, one-click Talentbank export. Renders without login.

---

### F6 — SimuHire (the Perform layer)

A 30-minute AI-driven behavioral simulation using four specialised agents, producing a Behavioral Traits Report that enriches the Smart Namecard.

**Self-initiated**: the candidate starts directly from their dashboard. No employer invite required.

**Simulation types**
- **Technical** (CS/Engineering/Data Science) — broken-system scenario → diagnosis → spec shift → adaptation → resolution.
- **Business Case** (Business/Finance/Management) — crisis memo → response strategy → client pushback → hold/adapt → resolution.
- **General Behavioral** (any field) — escalating situational questions testing composure and self-awareness.

**Four-agent architecture** (all `claude-sonnet-4-6`)

| Agent | Role | Word limit | Timing |
|---|---|---|---|
| Scenario Master | Presents the challenge; drives stage progression (Setup → Challenge → Escalation → Resolution); ends each message with a clear decision point | ≤ 120 words/response | Throughout session |
| Stakeholder | Plays a difficult persona — Scope Creeper, Sceptic, or Escalator — to create realistic pressure | ≤ 80 words/response | 1–2 times per session, at stage transitions |
| Evaluator | Scores the full transcript on 5 dimensions (0–100 each) with one evidence quote per dimension; returns JSON | Silent | Once, at session end — never per message |
| Feedback Agent | Generates the Behavioral Traits Report from Evaluator scores and quotes only — does not re-read the raw transcript | N/A | Immediately after Evaluator |

**Session UI — three-panel layout**

```
┌────────────────────────────────┬─────────────────────┐
│  Conversation history          │  Camera feed         │
│  (Scenario Master = green,     │  Integrity           │
│   Stakeholder = amber,         │  monitoring on       │
│   System = grey)               │  ─────────────────── │
│                                │  Live behavioral     │
│  [Textarea — type response]    │  radar chart         │
│  [Submit — triggers next turn] │  Score bars          │
│                                │  (per stage, not     │
│                                │   per message)       │
└────────────────────────────────┴─────────────────────┘
```

**Integrity monitoring**: camera feed requested on session start (never on setup screen); tab-switch events logged to the conversation as system messages; permission denial handled gracefully.

**Post-simulation flow**
1. Candidate sees their full Behavioral Traits Report immediately after the session ends.
2. Candidate chooses: **Share** (badge added to namecard; employers can see score and 3 key observations — not the full transcript) or **Keep Private** (no badge; report visible only to the candidate).
3. Retake policy: 7-day cooldown per simulation type; best score is always kept on the namecard.

**Behavioral Traits Report — five dimensions**

Adaptability · Communication · Problem-Solving · Stress Response · Systems Thinking

Each dimension gets:
- A score (0–100)
- A **strength comment** (≤ 25 words) citing a specific transcript moment that drove the score up
- A **weakness comment** (≤ 25 words) citing a specific transcript moment that capped the score

Plus three cross-cutting **key observations** (≤ 25 words each) synthesising patterns across dimensions.

Every comment must be traceable to an identifiable event in the transcript — never a vague trait claim like "good communicator." The Feedback Agent only receives the Evaluator's per-dimension evidence quotes — it does not re-read the raw transcript.

---

## System Architecture

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router v6 |
| Animation | Framer Motion v12 |
| Demo state | React Context (`DemoContext`) |
| Backend | FastAPI (async) |
| ORM | SQLAlchemy 2.x (async) + Alembic migrations |
| Database | Neon PostgreSQL (asyncpg driver) |
| Task queue | ARQ (Redis-backed) |
| Auth | JWT (python-jose) + bcrypt + Fernet (GitHub token encryption) |
| GitHub Agent | Octokit + Acorn AST |
| Document Agent | Groq `llama-3.1-8b-instant` (AI detection) + Groq `whisper-large-v3-turbo` (audio) |
| Credential Agent | Tesseract OCR + Levenshtein issuer registry |
| SimuHire Agents | Anthropic `claude-sonnet-4-6` (all four) |

**Verification data flow**: Candidate action → API route → agent → confidence score + metadata → if confidence ≥ 60, `atomic_ledger_write()` commits `verified_artifacts` and `credential_ledger` in one transaction → trust score recalculated → frontend updates.

**SimuHire data flow**: Candidate starts session → each message routed through Scenario Master (+ Stakeholder at stage transitions) → on end, Evaluator scores full transcript → Feedback Agent generates report → atomic write to `verified_artifacts` + `credential_ledger` → candidate reviews report → share decision → namecard badge updated.

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Candidates and employers. Stores profile fields, GitHub OAuth token (Fernet-encrypted), claimed skills, academic info. `role` is `'candidate'` or `'employer'`. |
| `verified_artifacts` | One row per artefact (github/document/credential/simuhire). Stores confidence, status (`pending`/`verified`/`failed`), SHA-256 payload hash, and JSONB metadata. Raw content never stored. |
| `credential_ledger` | Immutable audit chain. One row per verified artefact. Stores `leaf_hash`, `root_hash` (Merkle), `block_index`, `prev_hash`. |
| `simuhire_sessions` | One row per session. Stores scenario type, conversation JSONB, evaluator scores JSONB, overall score, report JSONB, `candidate_shared` flag, timestamps, and `retake_available_at`. |
| `job_listings` | Employer job postings with `required_skills` (text[]), `require_verified` toggle, and `require_simuhire` toggle. |
| `consent_log` | Immutable consent audit. One row per consent event. IP address SHA-256 hashed before storage. Types: `registration`, `github`, `document`, `credential`, `simuhire`. |

---

## Privacy & PDPA 2010 Compliance

| Rule | How it's enforced |
|---|---|
| Consent before any processing | `log_consent()` is called and committed before any agent runs; `has_consent()` guards all verification endpoints |
| Raw document content not stored | Document Agent analyses in memory; only confidence score and metadata written to `verified_artifacts.metadata_` |
| GitHub source code not stored | GitHub Agent analyses via API in memory; no code persisted to the database |
| Certificate images discarded after OCR | Tesseract extracts text; image is not stored anywhere |
| GitHub OAuth tokens encrypted at rest | Fernet symmetric encryption (`FERNET_KEY` in `.env`) |
| IP addresses hashed | SHA-256 hashed before writing to `consent_log.ip_hash` — raw IPs never stored |
| SimuHire transcript private by default | Visible only to the candidate unless they actively choose to share |
| Portfolio visibility | Candidate-controlled (public/private toggle) |
| Full account deletion | Within 30 days of request |
| Employers see scores only | Never raw artefacts — no documents, code, or certificate images |

---

## Talentbank Data Feedback Loop

Verified credentials and SimuHire sessions generate anonymised aggregate signals feeding Talentbank's research programmes. All outputs are strictly anonymised (no individual IDs) and stored in a separate analytics schema.

| Signal | Feeds Into |
|---|---|
| Skills Demand Map — most common verified vs frequently claimed/rarely verified skills | Annual Graduate Skills Report |
| Institutional Readiness Score — anonymised average trust scores per university cohort | Graduate Employability Award (GEA) |
| Behavioral Benchmark — average SimuHire dimension scores per field of study | Employer benchmarking data |
| Curriculum Gap Detector — skills consistently claimed but failing verification, per institution | University partnership conversations |

---

## Demo Seed Profiles

| Candidate | Trust Score | Verified Skills | SimuHire |
|---|---|---|---|
| Ahmad Rahim | 87 — Highly Authentic | Python 94, ML 88, SQL 79, Docker 71 | Technical, 82/100, shared |
| Priya Nair | 71 — Authentic | React 85, Node.js 74, TypeScript 68 | Not done |
| Wei Chen | 38 — Low Confidence | None | Not done |

Toggling "Verified Only" on the employer browse view leaves only Ahmad and Priya — this is the core demo moment. One click communicates the entire value proposition.

---

## Competitive Position

| Platform | Verified Credentials | Behavioral Simulation | Auto-generated Profile | Malaysia-focused |
|---|---|---|---|---|
| LinkedIn | Self-reported only | None | Self-built | No |
| HackerRank | None | Static tests | None | No |
| HireVue | None | Video only | None | No |
| Karat | None | Human-led | None | No |
| **CREDO** | **AI-verified ✓** | **Multi-agent AI ✓** | **Auto-generated ✓** | **Yes ✓** |

No equivalent platform currently exists in Malaysia or the broader SEA graduate market.

---

## Judging Criteria Alignment (Talentbank Hackathon)

| Criterion | Weight | How CREDO Addresses It |
|---|---|---|
| Product & UX Thinking | 30% | Clear 3-pillar thesis; complete candidate and employer journeys; 10-second namecard design; locked/editable field rules; SimuHire share/privacy decision; PDPA consent flows; Talentbank data feedback loop |
| System Design & Integration | 25% | PROVE→PRESENT←PERFORM architecture; defined agent roles, timing, and data contracts; end-of-transcript Evaluator design (never per-message); atomic ledger transactions; separated analytics schema; Career OS integration |
| Completeness | 20% | Five demo-ready flows: GitHub verify→namecard, employer filter, SimuHire→report→badge, full portfolio + audit trail, integrity check |
| AI Craft | 15% | Acorn AST parsing; Groq AI authorship detection; Tesseract OCR + Levenshtein fuzzy match; four distinct Claude agents with separate roles and word limits; Evaluator/Feedback prompt engineering; weighted trust scoring formula |
| Code Quality | 10% | Async SQLAlchemy with typed ORM; atomic transactions; isolated agent functions with typed I/O; unit + integration + live test suites; PDPA consent log; all environment variables documented |

---

## Research Backing

1. Talentbank GCA 2025 — graduate readiness rated 6/10 since 2022 (3 years stagnant).
2. DOSM Malaysia 2024 — skills mismatch worsened from 22.9% to 32.4% (2016–2023).
3. CrossChq 2025 — resume fraud costs USD 600B/year; 70% of workers have lied on resumes.
4. Gartner 2024 — 25% of all candidate profiles projected fraudulent by 2028.
5. ZKBAR-V (MDPI Sensors 2025) — ZKP-enabled blockchain credential verification.
6. CodEX (AICS) — AST-based plagiarism detection at 95% accuracy.
7. NLP Authorship Framework (arXiv 2026) — stylometric analysis for human vs AI text classification.
8. Cognitive Flexibility + Interview (Educ. Sci. 2025) — task-switching under pressure predicts interview success more reliably than static knowledge recall.
9. AI Mock Interview (CSCW 2025) — AI virtual interviewers capture behavioral signals beyond static text.
10. AI Talent Assessment (SuperAGI 2025) — AI assessment tools reduce time-to-hire by 50%; market projected USD 15.24B by 2030.
11. Malaysia e-Scroll (MoHE 2026) — blockchain credential verification cut processing from 5 days to minutes.

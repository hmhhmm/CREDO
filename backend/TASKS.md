# CREDO Backend — Implementation Task List

**Stack**: Python · FastAPI · SQLAlchemy (async) · PostgreSQL (Neon) · ARQ (Redis task queue)  
**Scope**: Standalone Python backend in `backend/`. No frontend code. No frontend integration until the Verification Gate (final table) is cleared.  
**Week mapping**: follows Section 9 build plan — Week 1 (Days 1–7), Week 2 (Days 8–14), Week 3 (Days 15–21), Week 4 (Days 22–28).

> **Prototype vs final scope** (Sections 10 & 16.3): The June 15 prototype may use mocked Document and Credential agent outputs and seeded namecard data. The 29 August final build requires every F2 pipeline to produce real, live scores from real input — no mocked outputs, no hardcoded confidence values. Tasks marked **[FINAL ONLY]** are deferred past June 15; tasks marked **[PROTOTYPE OK: MOCK]** may use mocked logic for June 15 but must be replaced with real implementations before the Grand Finale.

---

## Cross-Cutting Concerns

### Database Schema & Infrastructure

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Initialise FastAPI project structure (`backend/app/`, `routers/`, `models/`, `agents/`, `utils/`) | 1 | done | — |
| Configure `pyproject.toml` / `requirements.txt` with all dependencies | 1 | done | — |
| Set up SQLAlchemy async engine + session factory targeting Neon PostgreSQL via `asyncpg` | 1 | done | — |
| Define `users` model: id, name, email, github_username, github_token (encrypted), role, avatar_url, bio, linkedin_url, preferred_roles, location, open_to_work, avg_sentence_variance, created_at | 1 | done | — |
| Define `verified_artifacts` model: id, user_id, artifact_type, artifact_name, artifact_url, confidence, status, ai_generated, metadata (JSON), hash, verified_at, created_at | 1 | done | — |
| Define `credential_ledger` model: id, user_id, artifact_id, leaf_hash, root_hash, block_index, prev_hash, created_at | 1 | done | — |
| Define `simuhire_sessions` model: id, candidate_id, employer_id (nullable), simulation_type, status, stakeholder_persona, conversation (JSON), evaluator_scores (JSON), overall_score, report (JSON), candidate_shared, started_at, completed_at, retake_available_at | 1 | done | — |
| Define `job_listings` model: id, employer_id, title, company, required_skills, require_verified, require_simuhire, description, created_at | 1 | done | — |
| Define `consent_log` model: id, user_id, consent_type, granted_at, ip_hash | 1 | done | — |
| Set up Alembic for database migrations and generate initial migration from models | 1 | done | — |
| Write database seed script for 3 demo candidates (Ahmad Farid 87, Priya Nair 71, Wei Chen 38) with pre-seeded verified_artifacts and ledger entries | 1 | done | — |
| Configure Redis connection for ARQ task queue (Python equivalent of Upstash/Redis + BullMQ) | 1 | done | — |
| Set up ARQ worker entrypoint with job registry for all async agent jobs | 1 | done | — |
| Add CORS, HTTPS-enforcement, and request-size middleware to FastAPI app | 1 | done | — |
| Configure `.env` template with all required secrets (DB URL, Redis URL, GitHub OAuth, OpenAI key, Anthropic key) | 1 | done | — |

### Database Schema & Infrastructure — Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: SQLAlchemy models round-trip (insert → fetch → assert field values) | 1 | done | — |
| Integration test: Alembic migration applies cleanly to a fresh test database | 1 | done | — |
| Integration test: seed script populates all tables with expected row counts | 1 | done | — |

---

### Privacy & PDPA Compliance (Section 4)

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement consent_log write helper: records consent_type + ip_hash on every consent event | 1 | done | — |
| Add per-artifact consent checkpoint middleware: blocks F2 upload endpoints if consent not logged for that artifact_type | 2 | done | — |
| Add per-session consent checkpoint: blocks SimuHire session creation if session consent not logged | 3 | done | — |
| Enforce in-memory-only file handling for all uploads: FastAPI `UploadFile` read into bytes, never written to disk (Python equivalent of Multer `memoryStorage`) | 2 | done | — |
| Implement raw content discard: document text and certificate image bytes zeroed/deleted from memory immediately after agent processing | 2 | done | — |
| Implement GitHub source code discard: code bytes analysed in memory per file, never persisted to DB or disk | 2 | done | — |
| Add portfolio visibility toggle: `users.portfolio_public` field + endpoint to update it | 3 | done | — |
| Implement account deletion endpoint: cascade-delete all user data within 30-day SLA, log deletion event | 4 | todo | — |
| Encrypt GitHub OAuth tokens at rest using Fernet symmetric encryption (`cryptography` library) | 1 | done | — |

### PDPA Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: confirm no document text bytes survive in memory after Document Agent pipeline completes | 2 | todo | — |
| Unit test: confirm no certificate image bytes survive after Credential Agent pipeline completes | 2 | todo | — |
| Integration test: account deletion removes all rows across all tables for that user_id | 4 | todo | — |
| Regression test: consent_log has an entry for every verified_artifact row (no artifact without consent record) | 4 | todo | — |

---

### Analytics Pipeline (Section 5)

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Create separate `analytics` schema in PostgreSQL (isolated from main schema) | 4 | todo | — |
| Implement nightly aggregation job: Skills Demand Map (most common verified skills vs claimed-but-unverified) | 4 | todo | — |
| Implement nightly aggregation job: Institutional Readiness Score (anonymised avg trust score per university cohort) | 4 | todo | — |
| Implement nightly aggregation job: Behavioral Benchmark (avg SimuHire dimension scores per field of study) | 4 | todo | — |
| Implement nightly aggregation job: Curriculum Gap Detector (skills consistently claimed but failing verification, per institution) | 4 | todo | — |
| Schedule all four aggregation jobs using APScheduler (Python equivalent of a Node cron job) | 4 | todo | — |
| Add read-only analytics endpoints accessible only to Talentbank admin role | 4 | todo | — |
| Verify aggregation outputs contain zero individual user IDs or raw PII | 4 | todo | — |

### Analytics Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: each aggregation query returns only anonymised aggregate rows (no user_id columns in output) | 4 | todo | — |
| Integration test: nightly job runs end-to-end against seeded data and populates analytics schema | 4 | todo | — |

---

## F1 — Career OS Marketplace (Section 3: F1)

### F1 — Authentication & Profiles

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement email/password registration endpoint: validate input, hash password with `passlib[bcrypt]`, write user row, write consent_log entry | 1 | done | — |
| Implement login endpoint: verify bcrypt hash, issue JWT access + refresh tokens with `python-jose` | 1 | done | — |
| Implement JWT auth middleware: validate Bearer token on all protected routes | 1 | done | — |
| Implement GitHub OAuth flow: redirect to GitHub, exchange code for token, upsert user row, store encrypted token | 1 | done | — |
| Implement candidate profile GET/PATCH endpoints: photo URL, bio, LinkedIn, GitHub username, preferred roles, location, open_to_work | 1 | done | — |
| Implement employer registration endpoint: company name, industry, size, role='employer' | 1 | done | — |
| Implement employer profile GET/PATCH endpoints | 1 | done | — |

### F1 — Job Listings & Candidate Browse

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement job listings CRUD endpoints (employer-only: POST, PATCH, DELETE; public: GET list + GET single) | 1 | done | — |
| Implement candidate browse endpoint (`GET /candidates`): returns paginated namecard summaries | 1 | done | — |
| Add filter params to candidate browse: `verified_only` (bool), `min_trust_score` (int), `skill_tags` (list), `simuhire_completed` (bool), `university` (str) | 2 | done | — |
| Implement candidate ranking logic: verified candidates above unverified; SimuHire-completed above those without, within same verification tier | 2 | done | — |
| Implement verified-skills match: for a given job listing, mark each candidate skill as `verified` or `claimed` against required skills | 2 | done | — |

### F1 Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: bcrypt password hashing and verification | 1 | done | — |
| Unit test: JWT issue → decode → extract claims round-trip | 1 | done | — |
| Unit test: candidate ranking comparator (verified > unverified, SimuHire > no SimuHire) | 2 | done | — |
| Integration test: register → login → fetch profile → update profile full flow | 1 | done | — |
| Integration test: GitHub OAuth token exchange and user upsert | 1 | done | — |
| Integration test: employer posts job listing → candidate browse returns it with correct skill match labels | 2 | done | — |
| Integration test: `verified_only=true` filter excludes candidates with zero verified artifacts | 2 | done | — |
| Regression test: JWT middleware rejects expired and malformed tokens with 401 | 1 | done | — |

---

## F2 — Autonomous Verification Engine (Section 3: F2)

### F2 — Agent A: GitHub Agent

> **Python substitution**: Octokit → `PyGithub` (or direct `httpx` calls to GitHub REST API). Acorn (JS AST parser) → `tree-sitter` with `tree-sitter-javascript` grammar for JS/TS files; `ast` (stdlib) for Python files. Fastest-levenshtein → `rapidfuzz`.

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement GitHub OAuth token exchange endpoint: receive code, exchange for access token via `httpx`, store encrypted in users table | 1 | done | — |
| Implement repo listing endpoint: fetch candidate's repos via PyGithub, return name/description/language list | 2 | done | — |
| Implement commit authenticity check: verify author email consistency, assert ≥5 commits, assert commit span >1 day; return `commit_score` (0–100) | 2 | done | — |
| Implement AST complexity scorer: fetch up to 5 JS/TS files per repo via GitHub API, parse with `tree-sitter-javascript`, score on AST node-type diversity; return `ast_score` (0–100) | 2 | done | — |
| Implement originality flag detector: check boilerplate README phrases, generic variable names, tutorial file structure; count flags; ≥2 flags sets `orig_bonus=0`, else 100 | 2 | done | — |
| Implement GitHub Agent confidence calculation: `confidence = commit_score×0.4 + ast_score×0.4 + orig_bonus×0.2` | 2 | done | — |
| Wrap GitHub analysis in an ARQ async job: enqueue on repo selection, return job_id for polling | 2 | done | — |
| Implement GitHub verification trigger endpoint: accepts selected repo list, enqueues ARQ job, writes `verified_artifacts` row with `status='pending'` | 2 | done | — |
| Implement verification status poll endpoint: returns current status + result data for a given artifact_id | 2 | done | — |
| On confidence ≥ 60: call F4 atomic ledger write transaction; update artifact status to `'verified'` | 2 | done | F4 atomic transaction helper |
| On confidence < 60: update artifact status to `'failed'`; do NOT write ledger entry | 2 | done | — |
| Format API response to match UI states: `pending` (job queued/running) and `result` (commit count, complexity label, flag count, score, status) | 2 | done | — |

> **Prototype note**: GitHub Agent must be real for June 15 (Section 10). No mock permitted.

### F2 — Agent B: Document Agent

> **Python substitution**: pdf-parse → `pdfplumber`. mammoth (DOCX) → `python-docx`. OpenAI API → `openai` Python SDK (gpt-4o-mini). No npm equivalent needed — all Python native.  
> **[PROTOTYPE OK: MOCK]** — Document Agent may return hardcoded scores for June 15; must be replaced with real OpenAI calls for 29 August final build.

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement document upload endpoint: accept PDF or DOCX ≤10MB via `UploadFile`, reject other types | 2 | done | — |
| Implement PDF text extraction: read `UploadFile` bytes with `pdfplumber`, extract all text in memory | 2 | done | — |
| Implement DOCX text extraction: read bytes with `python-docx`, extract full text in memory | 2 | done | — |
| Implement AI text detection: send extracted text to OpenAI gpt-4o-mini, parse `ai_probability` (0–100) and verdict from response | 2 | done | — |
| Implement writing complexity scorer: compute vocabulary diversity (type-token ratio) and sentence length variance on extracted text; return `writing_complexity` (0–100) | 2 | done | — |
| Implement vocabulary diversity scorer: unique word count / total word count, normalised to 0–100 | 2 | done | — |
| Implement authorship consistency check: on 2nd+ submission, fetch user's prior `avg_sentence_variance`, compare against current doc; skip on first document | 2 | done | — |
| Implement Document Agent confidence calculation: `confidence = (100 - ai_probability)×0.5 + writing_complexity×0.3 + vocabulary_diversity×0.2` | 2 | done | — |
| Discard all extracted text bytes immediately after scoring (never persist raw content) | 2 | done | — |
| Wrap Document analysis in ARQ async job; write `verified_artifacts` row with `status='pending'` on enqueue | 2 | done | — |
| On confidence ≥ 60: call F4 atomic ledger write; update artifact to `'verified'` | 2 | done | F4 atomic transaction helper |
| On confidence < 60: update artifact to `'failed'`; no ledger write | 2 | done | — |
| Store only: artifact hash, scores, metadata (ai_probability, writing_complexity, vocabulary_diversity) — no raw text | 2 | done | — |

### F2 — Agent C: Credential Agent

> **Python substitution**: tesseract.js → `pytesseract` (Python wrapper for system Tesseract). fastest-levenshtein → `rapidfuzz` (Levenshtein + fuzzy match, Python-native).  
> **[PROTOTYPE OK: MOCK]** — Credential Agent may return hardcoded OCR results for June 15; must use real pytesseract + rapidfuzz for 29 August final build.

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement credential upload endpoint: accept JPG/PNG/PDF ≤10MB via `UploadFile` | 2 | done | — |
| Implement OCR extraction: pass image/PDF bytes to `pytesseract`, extract institution name, candidate name, date, and credential title | 2 | done | — |
| Build hardcoded Malaysian issuer registry: Malaysian public/private universities, MQA, professional bodies (e.g. MIA, ACCA), major hackathon organisers | 2 | done | — |
| Implement fuzzy issuer match: compare OCR-extracted institution against registry using `rapidfuzz.fuzz.ratio`; threshold ≥80 = match | 2 | done | — |
| Implement name match: compare OCR-extracted candidate name vs `users.name`; allow partial match (Chinese names, initials, aliases) using `rapidfuzz.partial_ratio` | 2 | done | — |
| Implement confidence rule: issuer_match + name_match → 90; issuer_match + name_mismatch → 50; no issuer_match → 30 | 2 | done | — |
| Discard certificate image/PDF bytes immediately after OCR extraction (never persist raw image) | 2 | done | — |
| Wrap Credential analysis in ARQ async job; write `verified_artifacts` row with `status='pending'` | 2 | done | — |
| On confidence ≥ 60: call F4 atomic ledger write; update artifact to `'verified'` | 2 | done | F4 atomic transaction helper |
| On confidence < 60: update artifact to `'failed'`; no ledger write | 2 | done | — |
| Store only: extracted metadata (institution, name, date, title), scores, artifact hash — no raw image | 2 | done | — |

### F2 Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: commit authenticity check returns correct score for ≥5 commits, consistent email, span >1 day | 2 | done | — |
| Unit test: commit authenticity check penalises <5 commits and same-day commit span | 2 | done | — |
| Unit test: AST node-type diversity scorer returns higher score for complex AST vs trivial AST | 2 | done | — |
| Unit test: originality flag detector triggers ≥2 flags on a boilerplate README repo fixture | 2 | done | — |
| Unit test: GitHub Agent confidence formula produces correct weighted output for known inputs | 2 | done | — |
| Unit test: vocabulary diversity (type-token ratio) scorer on known text samples | 2 | done | — |
| Unit test: sentence variance scorer on known text samples | 2 | done | — |
| Unit test: Document Agent confidence formula for known ai_probability, complexity, diversity values | 2 | done | — |
| Unit test: fuzzy issuer match returns True for close university name variants (≥80 similarity) | 2 | done | — |
| Unit test: fuzzy issuer match returns False for unrelated strings | 2 | done | — |
| Unit test: credential confidence rule — all three branches (90/50/30) | 2 | done | — |
| Unit test: name partial match handles initials and Chinese name reordering | 2 | done | — |
| Integration test: GitHub OAuth → repo selection → ARQ job → commit/AST/originality analysis → verified_artifacts row created | 2 | done | — |
| Integration test: PDF upload → pdfplumber extraction → OpenAI gpt-4o-mini call → score returned → raw text not in DB | 2 | done | — |
| Integration test: certificate image upload → pytesseract OCR → rapidfuzz issuer match → confidence rule applied → artifact row created | 2 | done | — |
| Integration test: confidence ≥ 60 triggers ledger write; confidence < 60 does not | 2 | done | F4 atomic transaction helper |
| Regression test: raw document text is never present in verified_artifacts.metadata or any DB column after Document Agent completes | 2 | done | — |
| Regression test: certificate image bytes are absent from all DB tables after Credential Agent completes | 2 | done | — |
| Regression test: GitHub source code is absent from all DB tables after GitHub Agent completes | 2 | done | — |
| Regression test: GitHub verification endpoint-to-result roundtrip completes in <60 seconds on a real repo | 2 | done | — |

---

## F4 — Immutable Credential Ledger (Section 3: F4)

> **Python substitution**: Node.js `crypto` (SHA-256) → Python `hashlib` (stdlib). Custom Merkle implementation in Python.

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement SHA-256 leaf hash function: `hash(user_id + artifact_name + artifact_type + confidence + verified_at + status)` using `hashlib` | 2 | done | — |
| Implement Merkle root computation: given a list of leaf hashes, build pairwise tree and return root hash | 2 | done | — |
| Implement atomic ledger write transaction: within a single SQLAlchemy transaction, INSERT verified_artifacts (status='verified') + INSERT credential_ledger (leaf_hash, root_hash, block_index, prev_hash); rollback both on any error | 2 | done | — |
| Expose atomic write as an internal helper (not a public endpoint) callable by F2 agents and F6 SimuHire | 2 | done | — |
| Implement Merkle integrity verification function: re-fetch all leaf hashes for a user from credential_ledger, recompute root, compare to stored root_hash | 2 | done | — |
| Implement audit trail endpoint (`GET /ledger/:userId`): return all ledger rows for user (block_index, leaf_hash, root_hash, prev_hash, created_at) | 2 | done | — |
| Implement integrity check endpoint (`GET /ledger/:userId/verify`): run Merkle integrity verification, return `{intact: bool, computed_root, stored_root}` | 2 | done | — |
| Handle block_index auto-increment: each new ledger entry is the next sequential index for that user | 2 | done | — |

### F4 Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: SHA-256 leaf hash is deterministic for the same input fields | 2 | done | — |
| Unit test: Merkle root changes when any leaf hash is altered | 2 | done | — |
| Unit test: Merkle root is stable when no leaves change | 2 | done | — |
| Unit test: Merkle root rebuild matches stored root for a known set of leaf hashes | 2 | done | — |
| Integration test: atomic write inserts exactly one row in verified_artifacts and one in credential_ledger | 2 | done | — |
| Integration test: if verified_artifacts INSERT succeeds but credential_ledger INSERT fails (simulated), neither row is committed | 2 | done | — |
| Regression test: verified_artifacts and credential_ledger row counts are always equal for a given user (never desync) | 2 | done | — |
| Regression test: integrity check returns `intact=True` for unmodified seeded ledger | 2 | done | — |
| Regression test: integrity check returns `intact=False` after directly updating a stored leaf_hash in the DB (simulated tampering) | 2 | done | — |
| Regression test: confidence < 60 produces zero credential_ledger rows (no ledger write on failed verification) | 2 | done | — |

---

## F3 — Living Portfolio (Section 3: F3)

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement private portfolio endpoint (`GET /portfolio/me`): return all verified_artifacts (newest first), career timeline nodes, ledger summary | 2 | done | F2 verified_artifacts |
| Implement artifact expand endpoint (`GET /artifacts/:artifactId`): return full metadata + scores for one artifact | 2 | done | — |
| Implement career timeline builder: query verified_artifacts ordered oldest→newest, map to timeline nodes (name, type, confidence) | 2 | done | — |
| Implement ledger summary for portfolio: current Merkle root hash, total entry count | 2 | done | F4 audit trail endpoint |
| Implement public portfolio endpoint (`GET /portfolio/:userId`): return only `status='verified'` artifacts; no edit controls; footer integrity hash | 2 | done | — |
| Implement trust score calculation: weighted average of all verified artifact confidences (GitHub×1.5, Docs×1.0, Creds×1.0, SimuHire×1.2), normalised to 0–100 | 2 | done | — |
| Expose trust score as a computed field on the portfolio and namecard responses | 2 | done | — |
| Implement "Share Portfolio" endpoint: return the canonical public URL (`/portfolio/:userId`) for the authenticated user | 2 | done | — |
| Add "Contact" email reveal: public portfolio response includes candidate contact email only if portfolio_public=true | 3 | done | — |

### F3 Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: trust score weighted average formula for known artifact mixes | 2 | done | — |
| Unit test: trust score updates correctly when a new verified artifact is added | 2 | done | — |
| Integration test: public portfolio endpoint returns only `status='verified'` artifacts, no pending/failed rows | 2 | done | — |
| Integration test: public portfolio endpoint loads without authentication header | 2 | done | — |
| Regression test: trust score recomputed within 5 seconds of a new artifact being verified (via poll endpoint) | 2 | done | — |

---

## F5 — Smart Namecard (Section 3: F5)

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement namecard data assembly endpoint (`GET /namecard/:userId`): compute and return all locked fields (verified skills + confidence, trust score, SimuHire badge if shared) and editable fields | 3 | done | F2 verified_artifacts, F3 trust score |
| Implement locked field enforcement: verified skill scores, trust score, SimuHire badge, credential badges, audit hash — none writable via API | 3 | done | — |
| Implement editable fields update endpoint (`PATCH /namecard/me/profile`): photo URL, bio/headline, LinkedIn URL, GitHub URL, preferred roles, location, contact email, open_to_work | 3 | done | — |
| Verify namecard auto-generates after first verified artifact: `GET /namecard/:userId` returns non-empty locked section once ≥1 verified artifact exists | 3 | done | — |
| Add SimuHire badge logic: include SimuHire summary in namecard response only if `simuhire_sessions.candidate_shared=true` | 3 | done | — |
| Implement trust score band label: ≥80 → "Highly Authentic", 60–79 → "Authentic", 40–59 → "Inconclusive", <40 → "Low Confidence" (single source of truth in Python util) | 3 | done | — |
| Implement unverified skills label: self-reported skills not present in verified_artifacts returned with `verified=false` flag | 3 | done | — |
| Implement QR code generation endpoint (`GET /namecard/:userId/qr`): generate QR for public namecard URL using `qrcode[pil]` library | 3 | done | — |
| Implement public namecard endpoint (`GET /card/:userId`): same as namecard assembly but no auth required | 3 | done | — |
| Implement Talentbank export endpoint: return namecard data in Talentbank-compatible JSON shape | 4 | todo | — |

### F5 Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: trust score band label function for all four boundary values (80, 60, 40, 0) | 3 | done | — |
| Unit test: namecard assembly correctly marks unverified self-reported skills | 3 | done | — |
| Integration test: PATCH to locked field (e.g. confidence) returns 403 | 3 | done | — |
| Integration test: PATCH to editable field (e.g. bio) updates and is immediately returned in GET | 3 | done | — |
| Integration test: namecard returns empty verified section when user has zero verified artifacts | 3 | done | — |
| Integration test: SimuHire badge absent when `candidate_shared=false`; present when `candidate_shared=true` | 3 | done | — |
| Integration test: public namecard endpoint loads without auth header | 3 | done | — |
| Regression test: trust score on namecard matches trust score from F3 portfolio endpoint for same user | 3 | done | — |

---

## F6 — SimuHire (Section 3: F6)

### F6 — Core Session Flow

> **Model**: all four agents use `claude-sonnet-4-6` via the `anthropic` Python SDK.

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Implement session creation endpoint (`POST /simuhire/sessions`): validate candidate role, write consent_log, insert simuhire_sessions row (status='active', employer_id=null), return session_id | 3 | done | — |
| Implement 7-day retake cooldown check: before creating session, verify `retake_available_at` is null or in the past for this simulation_type | 3 | done | — |
| Implement Scenario Master agent: Claude claude-sonnet-4-6 call with stage-aware system prompt (Setup→Challenge→Escalation→Resolution); enforces ≤120 words/response | 3 | done | — |
| Implement stage progression logic: track current stage in session; Scenario Master advances stage based on conversation length/content | 3 | done | — |
| Implement Stakeholder agent: Claude claude-sonnet-4-6 call with persona system prompt (Scope Creeper / Sceptic / Escalator); triggered 1–2 times per session at appropriate stages; ≤80 words/response | 3 | done | — |
| Implement message routing endpoint (`POST /simuhire/sessions/:id/message`): append candidate message to conversation history, call Scenario Master, conditionally call Stakeholder, return both responses | 3 | done | — |
| Append all responses to `simuhire_sessions.conversation` (JSONB) with speaker label (interviewer/stakeholder/candidate) | 3 | done | — |
| Implement session end endpoint (`POST /simuhire/sessions/:id/end`): set status='completed', trigger Evaluator → Feedback pipeline | 3 | done | — |
| Implement Evaluator agent: Claude claude-sonnet-4-6 call on full transcript at session end only; returns JSON with per-dimension scores (Adaptability, Communication, Problem-Solving, Stress Response, Systems Thinking, 0–100 each) + one evidence quote per dimension | 3 | done | — |
| Implement Feedback agent: Claude claude-sonnet-4-6 call with Evaluator's JSON (scores + quotes) as input; returns Behavioral Traits Report (overall score, 5×{score, strength ≤25w, growth ≤25w}, 3 key observations ≤25w) | 3 | done | — |
| Verify Feedback Agent does not re-read raw transcript: system prompt explicitly prohibits using anything outside the Evaluator's supplied quotes | 3 | done | — |
| Store Evaluator scores in `simuhire_sessions.evaluator_scores` and Feedback report in `simuhire_sessions.report` | 3 | done | — |
| Compute overall score: weighted average of 5 dimension scores (equal weights per PRD); store in `simuhire_sessions.overall_score` | 3 | done | — |
| On session complete: atomically write SimuHire result to verified_artifacts + credential_ledger via F4 helper | 3 | done | F4 atomic transaction helper |
| Implement share decision endpoint (`POST /simuhire/sessions/:id/share`): set `candidate_shared=true/false`; if true, namecard badge becomes visible | 3 | done | — |
| Implement report retrieval endpoint (`GET /simuhire/sessions/:id/report`): return full Behavioral Traits Report; candidate-only until shared | 3 | done | — |
| Set `retake_available_at = completed_at + 7 days` on session completion | 3 | done | — |
| Implement best-score retention: if candidate retakes and new overall_score < previous, namecard badge shows the prior higher score | 4 | todo | — |

### F6 — Audio Input & Transcription (Section 16.1.1)

> **Python substitution**: Groq Whisper API (`whisper-large-v3-turbo`) for speech-to-text (replaces OpenAI Whisper).

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Design conversation history schema to record input_mode per message: `{speaker, text, input_mode: 'text'|'audio', timestamp}` | 3 | done | — |
| Implement audio upload endpoint (`POST /simuhire/sessions/:id/audio`): accept audio blob (webm/mp4/wav), read into memory | 3 | done | — |
| Implement transcription step: send audio bytes to Groq Whisper (`whisper-large-v3-turbo`), receive transcript text | 3 | done | — |
| Pipe transcribed text into the same message routing logic as a typed response (Scenario Master + Stakeholder pipeline) | 3 | done | — |
| Record both the transcript text and input_mode='audio' in conversation history | 3 | done | — |
| Implement mixed-mode session state: candidate can switch between text and audio within the same session without resetting stage or corrupting history | 3 | done | — |
| Implement transcription error handling: if Whisper returns empty or confidence-too-low result, return 422 with user-facing message | 3 | done | — |
| Verify Evaluator and Feedback agents receive identical transcript text regardless of input_mode (audio vs text path must produce same downstream format) | 3 | done | — |
| Discard raw audio bytes after transcription (never persist to disk or DB) | 3 | done | — |

### F6 Tests

| Task | Week | Status | Blocked by |
|---|---|---|---|
| Unit test: Evaluator output JSON schema validation (all 5 dimensions present, each has score 0–100 and evidence quote) | 3 | done | — |
| Unit test: Feedback Agent report schema validation (5 dimensions × {score, strength, growth}, overall_score, 3 key_observations) | 3 | done | — |
| Unit test: overall score calculation (equal-weighted average of 5 dimension scores) | 3 | done | — |
| Unit test: retake cooldown check blocks new session when retake_available_at is in the future | 3 | done | — |
| Unit test: best-score retention — second session with lower score does not overwrite namecard badge score | 4 | todo | — |
| Integration test: full text-mode session — session create → 4+ message exchanges → end → Evaluator scores → Feedback report → ledger write | 3 | done | F4 atomic transaction helper |
| Integration test: full audio-mode session — audio upload → Whisper transcription → agent pipeline → report equivalent to text path | 3 | done | — |
| Integration test: mixed-mode session — alternate text and audio messages within one session without stage reset | 3 | done | — |
| Integration test: share=true → namecard badge visible in GET /namecard/:userId; share=false → badge absent | 3 | done | F5 namecard endpoint |
| Integration test: retake blocked within 7 days of last completed session | 3 | done | — |
| Regression test: Evaluator called exactly once per session (not per message) | 3 | done | — |
| Regression test: Feedback Agent report contains zero phrases traceable to transcript content not present in Evaluator's evidence quotes (spot-check against fixture transcript) | 3 | done | — |
| Regression test: SimuHire session completion atomically writes verified_artifacts + credential_ledger (roll back both on failure) | 3 | done | F4 atomic transaction helper |
| Regression test: transcription errors (empty Whisper response) return 422 and do not corrupt conversation history | 3 | done | — |
| Regression test: audio bytes are absent from all DB tables and disk after transcription completes | 3 | done | — |
| Regression test: score accuracy spot-check — for a fixture transcript where candidate addresses stakeholder follow-up directly, Communication score must not be lower than for a fixture where candidate ignores it | 4 | todo | — |

---

## Backend Verification Gate

> **All items in this table must be checked off before any frontend integration work begins.**  
> This gate is the boundary between standalone backend and integration phase. No frontend API wiring, no CORS adjustments for the frontend app, and no combined end-to-end tests should start until every row below shows `done`.

| Gate Condition | Week Target | Status | Blocked by |
|---|---|---|---|
| All unit test suites pass with zero failures (F1–F6, DB schema, Merkle, PDPA) | 4 | todo | — |
| All integration test suites pass with zero failures end-to-end on a live test database | 4 | todo | — |
| All regression tests pass, including atomic desync invariant and Merkle tampering detection | 4 | todo | — |
| GitHub Agent returns real, live confidence score from a real connected repo (non-seeded, non-mocked) within 60 seconds | 4 | todo | — |
| Document Agent returns real ai_probability + writing_complexity score from a live OpenAI gpt-4o-mini call on a real uploaded PDF | 4 | todo | — |
| Credential Agent returns real OCR-extracted fields + issuer registry match result from a real certificate image via pytesseract + rapidfuzz | 4 | todo | — |
| All three F2 pipelines produce zero hardcoded, mocked, or pre-scripted confidence values under any code path | 4 | todo | — |
| Full SimuHire text-mode session completes end-to-end with live Claude claude-sonnet-4-6 responses at every stage (no pre-scripted dialogue) | 4 | todo | — |
| Full SimuHire audio-mode session completes end-to-end with Whisper transcription feeding the same agent pipeline as text mode | 4 | todo | — |
| Mixed-mode SimuHire session (text + audio within one session) completes without stage corruption or history gaps | 4 | todo | — |
| Evaluator confirmed to run exactly once per session, never per message, across 3 separate test sessions | 4 | todo | — |
| Feedback Agent report spot-checked: every strength/growth comment traceable to an Evaluator evidence quote (no fabricated evidence) | 4 | todo | — |
| Merkle integrity check returns `intact=True` on unmodified seeded ledger data | 4 | todo | — |
| Merkle integrity check returns `intact=False` after a leaf_hash is directly mutated in the DB (tamper simulation) | 4 | todo | — |
| verified_artifacts and credential_ledger row counts are equal for every user in the test DB (desync regression confirmed clean) | 4 | todo | — |
| Confidence ≥ 60 always writes a ledger row; confidence < 60 never writes one — confirmed across all three F2 agents | 4 | todo | — |
| Raw document text, certificate images, audio bytes, and GitHub source code are absent from all DB tables and disk after their respective pipelines complete | 4 | todo | — |
| consent_log has an entry for every verified_artifacts row in the test DB | 4 | todo | — |
| All API endpoints return appropriate HTTP status codes for auth failures (401), permission errors (403), and validation errors (422) | 4 | todo | — |
| `GET /portfolio/:userId` and `GET /card/:userId` return 200 with no auth header (public endpoints confirmed unauthenticated) | 4 | todo | — |
| Nightly analytics aggregation job runs against seeded data and produces zero rows containing individual user_ids | 4 | todo | — |
| All environment variables documented in `.env.example`; backend starts cleanly from a fresh clone with only `.env` populated | 4 | todo | — |
| README documents: how to run the dev server, how to run tests, how to run the ARQ worker, and how to apply migrations | 4 | todo | — |

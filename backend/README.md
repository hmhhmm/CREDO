# CREDO Backend

FastAPI async backend — verification agents, Merkle ledger, SimuHire session pipeline, and REST API for the CREDO platform.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | FastAPI (async) |
| ORM | SQLAlchemy 2.x (async) |
| Database | PostgreSQL via Neon (asyncpg driver) |
| Migrations | Alembic |
| Task queue | ARQ (Redis-backed async worker) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Encryption | Fernet (cryptography) — GitHub tokens at rest |
| AI — SimuHire | Anthropic SDK (`claude-sonnet-4-6`) |
| AI — Document Agent | Groq (`llama-3.1-8b-instant` for AI detection, `whisper-large-v3-turbo` for audio) |
| OCR — Credential Agent | Tesseract.js (via subprocess) |
| GitHub Agent | Octokit / GitHub REST API |
| Validation | Pydantic v2 |
| Testing | pytest-asyncio, httpx |

---

## Getting Started

```bash
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in secrets
alembic upgrade head          # apply all migrations
uvicorn app.main:app --reload # http://localhost:8000
```

Interactive API docs: `http://localhost:8000/docs`

Health check: `GET /health` — returns `{"status": "ok", "version": "0.4.0"}`

AI smoke test: `GET /health/ai` — makes a real Groq call; returns 503 if `GROQ_API_KEY` is unset.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in every value before running.

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host/credo
TEST_DATABASE_URL=postgresql+asyncpg://user:password@host/credo_test

# Redis (ARQ task queue)
REDIS_URL=redis://localhost:6379

# Auth
SECRET_KEY=<random 32-byte hex>       # python -c "import secrets; print(secrets.token_hex(32))"
FERNET_KEY=<Fernet base64 key>        # python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback

# AI APIs
GROQ_API_KEY=       # Document Agent (AI detection) + audio transcription
ANTHROPIC_API_KEY=  # SimuHire agents (all four use claude-sonnet-4-6)

# App
FRONTEND_URL=http://localhost:5173
MAX_UPLOAD_SIZE_MB=10
```

---

## Project Structure

```
backend/
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial_schema.py   Hand-written initial migration (all 6 tables)
├── app/
│   ├── main.py                     FastAPI app, CORS, upload size guard, all routers
│   ├── config.py                   Pydantic-settings — reads from .env
│   ├── database.py                 Async SQLAlchemy engine + get_db dependency
│   ├── logging_config.py           Structured logging setup
│   ├── worker.py                   ARQ WorkerSettings (async task queue)
│   ├── agents/
│   │   ├── github_agent.py         F2 Agent A — GitHub repo analysis
│   │   ├── document_agent.py       F2 Agent B — AI detection + writing complexity
│   │   ├── credential_agent.py     F2 Agent C — OCR + issuer registry match
│   │   └── simuhire_agents.py      F6 — all four SimuHire agents
│   ├── data/
│   │   └── issuer_registry.py      Known credential issuers for Levenshtein matching
│   ├── models/
│   │   ├── user.py                 users table
│   │   ├── verified_artifact.py    verified_artifacts table
│   │   ├── credential_ledger.py    credential_ledger table
│   │   ├── simuhire_session.py     simuhire_sessions table
│   │   ├── job_listing.py          job_listings table
│   │   └── consent_log.py          consent_log table
│   ├── routers/
│   │   ├── auth.py                 Register, login, refresh, GitHub OAuth, /auth/me
│   │   ├── candidates.py           Candidate browse (paginated + filters), profile PATCH
│   │   ├── employers.py            Employer profile GET/PATCH
│   │   ├── jobs.py                 Job listing CRUD
│   │   ├── verify.py               F2 — verification queue + consent
│   │   ├── ledger.py               F4 — audit trail + integrity check
│   │   ├── portfolio.py            F3 — private + public portfolio
│   │   ├── namecard.py             F5 — smart namecard
│   │   ├── simuhire.py             F6 — session flow + audio transcription
│   │   └── deps.py                 get_current_user, require_candidate, require_employer
│   ├── schemas/                    Pydantic request/response models
│   │   ├── auth.py
│   │   ├── artifact.py
│   │   ├── job.py
│   │   ├── namecard.py
│   │   ├── simuhire.py
│   │   └── user.py
│   ├── services/
│   │   └── ledger_service.py       F4 — atomic_ledger_write + verify_integrity
│   └── utils/
│       ├── auth.py                 bcrypt hash/verify + JWT issue/decode
│       ├── crypto.py               Fernet encrypt/decrypt for GitHub tokens
│       ├── consent.py              log_consent() + has_consent() PDPA helpers
│       ├── confidence_band.py      Trust score weighted calc + band label
│       └── ledger.py               SHA-256 leaf hash + Merkle root computation
├── scripts/
│   └── seed.py                     Seeds Ahmad (87), Priya (71), Wei (0) with real Merkle hashes
├── tests/
│   ├── conftest.py
│   ├── test_auth.py                Auth, JWT, bcrypt, confidence band
│   ├── test_db_schema.py           Model unit tests + integration round-trips
│   ├── test_ledger.py              Merkle hash + atomic write tests
│   ├── test_agents.py              Agent unit tests (mocked API calls)
│   ├── test_namecard.py
│   ├── test_portfolio.py
│   ├── test_simuhire.py
│   └── test_live_ping.py           Real Groq API smoke test (requires key)
├── alembic.ini
├── pyproject.toml                  pytest config + ruff lint settings
└── requirements.txt
```

---

## The Six Agents

### F2 — Verification Agents (three agents)

**Agent A — GitHub Agent** (`app/agents/github_agent.py`)
Connects via GitHub OAuth token. Fetches commit history, performs Acorn AST-level code analysis, checks for commit authorship consistency, and produces a confidence score (0–100). GitHub source code is analysed in memory only — never stored.

**Agent B — Document Agent** (`app/agents/document_agent.py`)
Submits uploaded documents to Groq (`llama-3.1-8b-instant`) for AI-generation probability scoring. Also measures writing complexity and cross-references against the user's baseline `avg_sentence_variance` stored on their profile. Raw document content is not stored after analysis.

**Agent C — Credential Agent** (`app/agents/credential_agent.py`)
Runs Tesseract OCR on uploaded certificate images to extract text. Matches the extracted issuer name against `app/data/issuer_registry.py` using Levenshtein distance. Checks for name match between certificate and user profile. Certificate images are discarded after OCR extraction.

### F6 — SimuHire Agents (four agents, all `claude-sonnet-4-6`)

**1. Scenario Master** (`call_scenario_master`)
Drives the four-stage session (Setup → Challenge → Escalation → Resolution). Stays fully in character. Responds in ≤ 120 words. Ends every message with a clear question or decision point. Supports three scenario types: `technical`, `business`, `general`.

**2. Stakeholder** (`call_stakeholder`)
Plays a difficult persona (Scope Creeper, Sceptic, or Escalator) at stage transitions. Responds in ≤ 80 words. Creates realistic pressure without resolving the conflict itself.

**3. Evaluator** (`call_evaluator`)
Scores the **full transcript** on five dimensions: Adaptability, Communication, Problem-Solving, Stress Response, Systems Thinking. Called **once at session end** — never per message. Returns JSON with `{score, evidence}` per dimension.

**4. Feedback Agent** (`call_feedback`)
Writes the Behavioral Traits Report from Evaluator scores and evidence quotes **only**. Must not re-read the raw transcript — enforced by system prompt. Returns `overall_score`, per-dimension `strength`/`growth` comments, and three `key_observations`.

---

## Database Tables

| Table | Purpose |
|---|---|
| `users` | Candidates and employers. Stores profile fields, GitHub OAuth token (Fernet-encrypted), claimed skills, and academic info. `role` is `'candidate'` or `'employer'`. |
| `verified_artifacts` | One row per verified item (github/document/credential/simuhire). Stores confidence score, status (`pending`/`verified`/`failed`), SHA-256 hash of payload, and JSONB metadata. Raw content is never stored. |
| `credential_ledger` | Immutable audit trail. One row per verified artefact. Stores `leaf_hash`, `root_hash` (Merkle), `block_index`, and `prev_hash` — forming an append-only chain. |
| `simuhire_sessions` | One row per SimuHire session. Stores scenario type, conversation JSONB, Evaluator scores JSONB, overall score, and share status. |
| `job_listings` | Employer-created job postings with required skills, verified-only toggle, and SimuHire requirement toggle. |
| `consent_log` | Immutable consent audit. One row per consent event (`registration`, `github`, `document`, `credential`, `simuhire`). IP address is SHA-256 hashed before storage. |

---

## Merkle Ledger — Atomic Transaction Rule

Every write to `verified_artifacts` with `status='verified'` **must** be performed through `ledger_service.atomic_ledger_write()`, which atomically:

1. Updates the artefact (`status='verified'`, confidence, `verified_at`, SHA-256 hash)
2. Fetches all prior ledger entries for the user
3. Computes a new Merkle root over all leaf hashes including the new one
4. Inserts a `credential_ledger` row

The caller must wrap this call in a single `async with db.begin()` transaction. The two writes (`verified_artifacts` and `credential_ledger`) must never be split across separate transactions.

```python
async with db.begin():
    entry = await atomic_ledger_write(db, artifact, confidence=score)
# both rows committed or neither
```

Integrity can be verified at any time via `ledger_service.verify_integrity(db, user_id)`, which recomputes the Merkle root from stored leaf hashes and compares against the stored root.

---

## PDPA 2010 — Data Handling Rules

CREDO processes Malaysian students' personal and academic data. The following rules are enforced in code:

| Rule | Implementation |
|---|---|
| Consent before processing | `log_consent()` must be called and committed before any agent runs. `has_consent()` guards all verification endpoints. |
| Raw document content not stored | Document Agent analyses in memory; only the confidence score and metadata are written to `verified_artifacts.metadata_`. |
| GitHub source code not stored | GitHub Agent analyses commits in memory via API; no code is persisted to the database. |
| Certificate images discarded after OCR | Credential Agent extracts text via Tesseract, then the image is discarded. Only the match result is stored. |
| GitHub OAuth tokens encrypted at rest | Stored using Fernet symmetric encryption (`app/utils/crypto.py`). `FERNET_KEY` must be set in `.env`. |
| IP addresses hashed | `consent.py` SHA-256 hashes the IP before writing to `consent_log.ip_hash`. Raw IPs are never stored. |
| Consent types | `registration`, `github`, `document`, `credential`, `simuhire` — each requires its own logged consent event. |

---

## Running Tests

```bash
# Unit tests only (no DB, no API keys required)
pytest -m unit -v

# Integration tests (requires TEST_DATABASE_URL in .env)
pytest -m integration -v

# Live AI smoke test (requires GROQ_API_KEY in .env)
pytest -m live -v
```

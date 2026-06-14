# CREDO — Verified Career Identity Platform

> **Prove. Present. Perform.**

CREDO replaces unverifiable CVs with a tamper-evident verified profile that graduates own and employers can trust. Three AI-powered pillars work together in a single candidate journey:

| Pillar | What it does |
|---|---|
| **Prove** | Three verification agents (GitHub, Document, Credential) analyse submitted artefacts and produce a confidence score per item. Each verified artefact is written to a SHA-256 Merkle ledger — creating a tamper-evident audit trail. |
| **Present** | A Smart Namecard auto-generates from verified data. Trust score, verified skills, artefact badges, and an optional SimuHire badge are surfaced to employers via a shareable public URL. |
| **Perform** | SimuHire: a 30-minute, four-stage AI behavioral simulation driven by four specialised Claude agents. The session ends with a Behavioral Traits Report that can be optionally shared to the namecard. |

---

## Monorepo Structure

```
CREDO/
├── frontend/          React + Vite + Tailwind — candidate & employer UI
├── backend/           FastAPI + SQLAlchemy — verification agents, ledger, SimuHire
├── PRD.md             Full product requirements (source of truth)
├── FRONTEND.md        Design spec: tokens, page layouts, component inventory
└── CLAUDE.md          Claude Code guidance (never commit)
```

---

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

No environment variables required — the frontend runs entirely on mock data for the June 15 prototype.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # fill in secrets (see backend/README.md)
alembic upgrade head           # apply migrations
uvicorn app.main:app --reload  # http://localhost:8000
```

API docs available at `http://localhost:8000/docs` once running.

---

## Key Dates — Talentbank Tech Hackathon 2026

| Milestone | Date |
|---|---|
| Intent Form submission | 15 June 2026 |
| Full Build submission | 26 July 2026 |
| Grand Finale | 29 August 2026 |

---

## June 15 Prototype — Mocked vs Real

### Frontend

All pages are built and interactive. A shared `DemoContext` drives a live demo pipeline: clicking through verification agents updates the trust score and namecard in real time. SimuHire runs with scripted responses that follow the same conversation structure as the real agents.

| Feature | Status |
|---|---|
| Candidate dashboard, verify page, portfolio, namecard | UI complete — mock data |
| Demo pipeline (`DemoContext`) with live trust score updates | Wired — no backend required |
| SimuHire 30-min session — 4 stages, sequential questions | UI complete — scripted responses |
| SimuHire integrity monitoring (camera + tab-switch detection) | Real browser APIs |
| SimuHire Behavioral Traits Report with actual session duration | UI complete — mock scores |
| Employer dashboard + candidate browse with filters | UI complete — mock data |
| GitHub OAuth two-step flow with throbber | Simulated only |

### Backend

| Feature | Status |
|---|---|
| FastAPI routes for all features | Implemented |
| PostgreSQL schema + Alembic migrations | Complete |
| GitHub, Document, and Credential verification agents | Implemented — requires API keys |
| SimuHire 4-agent pipeline (`claude-sonnet-4-6`) | Implemented — requires `ANTHROPIC_API_KEY` |
| Merkle ledger atomic writes + integrity verification | Implemented |
| PDPA consent logging | Implemented |
| JWT auth + bcrypt | Implemented — GitHub OAuth requires credentials |

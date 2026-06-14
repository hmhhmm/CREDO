
  ┌──────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────┐
  │             File             │                                      Purpose                                      │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ requirements.txt             │ All deps for Week 1–4 (annotated by week)                                         │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/config.py                │ Pydantic-settings reading from .env                                               │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/database.py              │ Async SQLAlchemy engine + get_db dependency                                       │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/models/                  │ All 6 ORM models (users, verified_artifacts, credential_ledger,                   │
  │                              │ simuhire_sessions, job_listings, consent_log)                                     │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/utils/auth.py            │ bcrypt hash/verify + JWT issue/decode                                             │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/utils/crypto.py          │ Fernet encrypt/decrypt for GitHub tokens at rest                                  │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/utils/consent.py         │ log_consent() + has_consent() PDPA helpers                                        │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/utils/confidence_band.py │ Trust score weighted calc + band label (single source of truth, mirrors frontend  │
  │                              │ util)                                                                             │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/routers/auth.py          │ Register, login, refresh, GitHub OAuth callback, /auth/me                         │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/routers/candidates.py    │ Candidate browse (paginated + all Week 2 filters already wired), profile PATCH    │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/routers/employers.py     │ Employer profile GET/PATCH                                                        │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/routers/jobs.py          │ Full job listing CRUD                                                             │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/routers/deps.py          │ get_current_user, require_candidate, require_employer                             │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/main.py                  │ FastAPI app, CORS, upload size guard, all routers                                 │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ app/worker.py                │ ARQ WorkerSettings skeleton (jobs registered in Week 2)                           │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ alembic/                     │ Full Alembic async config + hand-written initial migration                        │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ scripts/seed.py              │ Real Merkle hashes seeded for Ahmad (trust 87), Priya (71), Wei (0 — failed       │
  │                              │ artifact)                                                                         │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ tests/test_auth.py           │ 17 unit + integration + regression tests for auth, JWT, bcrypt, confidence band   │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
  │ tests/test_db_schema.py      │ Model unit tests + integration round-trip + seed row count assertion              │
  └──────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────┘
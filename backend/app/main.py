import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.logging_config import setup_logging
from app.routers import auth, candidates, employers, jobs, ledger, namecard, portfolio, simuhire, verify

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CREDO backend starting up (v0.4.0)")
    yield
    logger.info("CREDO backend shutting down")


app = FastAPI(
    title="CREDO Backend API",
    description="Verified Career Identity Platform — Prove. Present. Perform.",
    version="0.4.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Upload size guard ─────────────────────────────────────────────────────────
@app.middleware("http")
async def enforce_upload_limit(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.max_upload_bytes:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"detail": f"Upload exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit"},
        )
    return await call_next(request)


# ── Global exception handler — logs full traceback for any unhandled 500 ──────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled exception on %s %s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc) or "Internal server error"},
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(employers.router)
app.include_router(jobs.router)
app.include_router(verify.router)       # F2 verification + consent
app.include_router(ledger.router)       # F4 audit trail + integrity check
app.include_router(portfolio.router)    # F3 portfolio (private + public)
app.include_router(namecard.router)     # F5 smart namecard
app.include_router(simuhire.router)    # F6 SimuHire session flow + audio
# Week 4+: analytics


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "0.4.0"}


@app.get("/health/ai")
async def health_ai() -> dict:
    """Live smoke-test: makes a real Groq API call with a minimal prompt.
    Used by pytest -m live to confirm the API key is valid and the model responds.
    """
    if not settings.GROQ_API_KEY:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "GROQ_API_KEY is not configured"},
        )
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    completion = await client.chat.completions.create(
        model="llama-3.1-8b-instant",
        max_tokens=16,
        messages=[{"role": "user", "content": "ping"}],
    )
    response_text = completion.choices[0].message.content
    return {"response": response_text}

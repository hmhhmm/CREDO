"""
ARQ async task worker.
Run with: arq app.worker.WorkerSettings

Each job function is imported here so ARQ can deserialise job names.
"""
import logging

from arq.connections import RedisSettings

from app.agents.credential_agent import run_credential_analysis
from app.agents.document_agent import run_document_analysis
from app.agents.github_agent import run_github_analysis
from app.config import settings
from app.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


async def startup(ctx: dict) -> None:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    logger.info("ARQ worker starting up")
    engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
    ctx["engine"] = engine
    ctx["session_factory"] = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def shutdown(ctx: dict) -> None:
    logger.info("ARQ worker shutting down")
    await ctx["engine"].dispose()


class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    on_startup = startup
    on_shutdown = shutdown
    functions = [
        run_github_analysis,
        run_document_analysis,
        run_credential_analysis,
    ]
    max_tries = 3
    job_timeout = 120  # GitHub agent target: <60s; doc/credential: <30s

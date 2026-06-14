"""
Test fixtures.

Unit tests (@pytest.mark.unit) run without any DB and test pure logic.
Integration tests (@pytest.mark.integration) require TEST_DATABASE_URL in .env.
Integration tests are skipped automatically when TEST_DATABASE_URL is not set.
"""
import os
from collections.abc import AsyncGenerator
from typing import Optional

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import Base, get_db
from app.main import app as main_app


# ── DB fixtures (integration only) ───────────────────────────────────────────

def _test_db_url() -> Optional[str]:
    return settings.TEST_DATABASE_URL or os.getenv("TEST_DATABASE_URL") or None


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    url = _test_db_url()
    if not url:
        pytest.skip("TEST_DATABASE_URL not set — skipping integration test")
    engine = create_async_engine(url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Yields a session wrapped in a rolled-back transaction for test isolation."""
    async with test_engine.connect() as conn:
        await conn.begin()
        session = AsyncSession(bind=conn, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await conn.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test client with DB overridden to use the rolled-back test session."""

    async def override_get_db():
        yield db_session

    main_app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=main_app), base_url="http://test") as c:
        yield c
    main_app.dependency_overrides.clear()

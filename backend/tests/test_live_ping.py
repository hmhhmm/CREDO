"""
Live ping test — makes a real Anthropic API call. No mocking.

Run with:
    pytest -m live -v

Skipped automatically when ANTHROPIC_API_KEY is not set in .env.
"""
import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.main import app


@pytest.mark.live
async def test_anthropic_live_ping():
    if not settings.GROQ_API_KEY:
        pytest.skip("GROQ_API_KEY not set — skipping live AI ping test")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health/ai")

    assert response.status_code == 200
    assert len(response.json()["response"]) > 0

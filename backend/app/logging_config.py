"""
Centralised logging configuration.
Called once at server startup and once at worker startup.
All modules obtain loggers via logging.getLogger(__name__).
"""
import logging
import sys


def setup_logging(level: str = "INFO") -> None:
    """Configure root logger with timestamp + level + module name."""
    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format=fmt,
        datefmt=datefmt,
        stream=sys.stdout,
        force=True,  # override any prior basicConfig calls (e.g. from uvicorn)
    )

    # Silence noisy third-party loggers
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("arq").setLevel(logging.INFO)

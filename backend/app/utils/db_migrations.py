import logging
from app.database import engine, Base

logger = logging.getLogger(__name__)


async def run_startup_migrations() -> None:
    """Create any missing tables on startup."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database migrations completed")
    except Exception as exc:
        logger.error(f"Database migration failed: {str(exc)}")
        raise RuntimeError("Database migration failed. Check logs for details.") from exc

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import get_settings

settings = get_settings()

# Shared Base for ALL models
Base = declarative_base()

def normalize_database_url(url: str) -> str:
    return url.strip().strip('"').strip("'")

# Create async engine
db_url = normalize_database_url(settings.DATABASE_URL)
engine = create_async_engine(
    db_url.split("?")[0],
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={"ssl": True} if "neon.tech" in db_url else {}
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db():
    """Dependency for getting database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

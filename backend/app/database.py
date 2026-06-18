from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import get_settings

settings = get_settings()

# Shared Base for ALL models
Base = declarative_base()

import urllib.parse
from sqlalchemy.engine.url import make_url

def normalize_database_url(url: str) -> str:
    url = url.strip().strip('"').strip("'")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        
    try:
        url_obj = make_url(url)
        if url_obj.database and '%' in url_obj.database:
            url_obj = url_obj.set(database=urllib.parse.unquote(url_obj.database))
            url = url_obj.render_as_string(hide_password=False)
    except Exception:
        pass
        
    return url

# Create async engine
db_url = normalize_database_url(settings.DATABASE_URL)
engine = create_async_engine(
    db_url.split("?")[0],
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=30,
    max_overflow=50,
    connect_args={
        "ssl": True if "neon.tech" in db_url else False,
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    }
)

# Create read replica async engine
read_db_url = normalize_database_url(settings.READ_DATABASE_URL) if settings.READ_DATABASE_URL else db_url
read_engine = create_async_engine(
    read_db_url.split("?")[0],
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=40,
    max_overflow=60,
    connect_args={
        "ssl": True if "neon.tech" in read_db_url else False,
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    }
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

read_async_session = async_sessionmaker(
    read_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db():
    """Dependency for getting database session (Primary/Write)."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def get_read_db():
    """Dependency for getting database session (Replica/Read)."""
    async with read_async_session() as session:
        try:
            yield session
        finally:
            await session.close()

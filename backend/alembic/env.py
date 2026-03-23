import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# --- Model Imports ---
from app.database import Base
from app.config import get_settings

# Import all model classes from their respective files to ensure Alembic sees them
from app.models.account import Account
from app.models.asset import Asset
from app.models.document import Document
from app.models.finance import Deposit, Withdrawal, Transaction, ColdStorageVault, SubscriptionPlan, UserSubscription
from app.models.deposit_addresses import DepositAddress
from app.models.investment import InvestmentProduct, InvestmentPosition, CopyTrader, CopySession
from app.models.real_estate import RealEstateProperty, RealEstateInvestment
from app.models.mining import MiningPlan, MiningSubscription
from app.models.mining_stats import MiningStats
from app.models.settings import SystemSettings
from app.models.notification import Notification
from app.models.referral import Referral
from app.models.security import LoginHistory
from app.models.signal import Signal
from app.models.signals import SignalSource, TradingSignal
from app.models.staking import StakingPosition
from app.models.support import SupportTicket, TicketMessage
from app.models.trade import Trade
from app.models.trading import TradingPair, Order, UserAsset, PriceAlert, ExecutionTrade
from app.models.user import User
from app.models.wallet import Wallet

# --- Alembic Config ---
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
# Strip query parameters that asyncpg doesn't support (like sslmode)
db_url = settings.DATABASE_URL.split("?")[0]
config.set_main_option("sqlalchemy.url", db_url)

target_metadata = Base.metadata

# --- Migration Functions ---
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={"ssl": True} if "neon.tech" in db_url else {}
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
    
else:
    run_migrations_online()

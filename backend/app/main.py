from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import asyncio

from app.config import get_settings
from app.database import engine, Base
from app.utils.db_migrations import run_startup_migrations

# Import all models to ensure they're registered with Base.metadata FIRST
from app.models.admin import Admin
from app.models.user import User
from app.models.document import Document
from app.models.wallet import Wallet
from app.models.account import Account
from app.models.trading import TradingPair, Order, UserAsset, PriceAlert, ExecutionTrade
from app.models.trade import Trade
from app.models.staking import StakingProduct, StakingPosition
from app.models.finance import Deposit, Withdrawal, Transaction, ColdStorageVault, SubscriptionPlan, UserSubscription
from app.models.deposit_addresses import DepositAddress
from app.models.investment import (
    InvestmentProduct, InvestmentPosition, 
    CopyTrader, CopySession
)
from app.models.real_estate import RealEstateProperty, RealEstateInvestment, RealEstateTransaction, RealEstateCache
from app.models.mining import MiningPlan, MiningSubscription
from app.models.signals import Signal, SignalHistory, CopiedSignal, SignalAccuracy, SignalCache
from app.models.notification import Notification
from app.models.security import LoginHistory
from app.models.referral import Referral
from app.models.support import SupportTicket, TicketMessage
from app.models.copy_trading import CopyTrading, CopyTradeHistory
from app.models.settings import SystemSettings
from app.models.mining_stats import MiningStats

from app.routes import (
    auth, users, trading, markets, deposits, funds,
    withdrawals, investments, mining, staking,
    signals, subscriptions, admin, copy_trading, ably, transactions,
    real_estate
)

settings = get_settings()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for app startup and shutdown"""
    await run_startup_migrations()
    
    # Start Background Tasks
    from app.tasks.mining_updater import start_mining_background_tasks
    start_mining_background_tasks()
    
    # Start Price Broadcast Service
    from app.services.price_broadcast import price_broadcast_service
    await price_broadcast_service.start()
    logger.info("Price broadcast service started")
    
    # Start KuCoin Order Book Service
    from app.services.kucoin_orderbook import kucoin_orderbook_service
    await kucoin_orderbook_service.start()
    logger.info("KuCoin order book service started")

    # Start Synthetic Order Book Service (forex & stocks)
    from app.services.synthetic_orderbook import synthetic_orderbook_service
    await synthetic_orderbook_service.start()
    logger.info("Synthetic order book service started")
    
    yield
    
    # On shutdown
    from app.tasks.mining_updater import scheduler
    if scheduler.running:
        scheduler.shutdown(wait=True)
    
    # Stop Price Broadcast Service
    from app.services.price_broadcast import price_broadcast_service
    await price_broadcast_service.stop()
    logger.info("Price broadcast service stopped")
    
    # Stop KuCoin Order Book Service
    from app.services.kucoin_orderbook import kucoin_orderbook_service
    await kucoin_orderbook_service.stop()
    logger.info("KuCoin order book service stopped")

    # Stop Synthetic Order Book Service
    from app.services.synthetic_orderbook import synthetic_orderbook_service
    await synthetic_orderbook_service.stop()
    logger.info("Synthetic order book service stopped")
    
    await engine.dispose()


app = FastAPI(
    title="Legacy FX Cryptocurrency Broker API",
    description="Professional cryptocurrency trading and investment platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in _cors_origins:
    _cors_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - Note: Prefixes are already defined in the router files
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(trading.router)
app.include_router(markets.router)
app.include_router(deposits.router)
app.include_router(funds.router)
app.include_router(transactions.router)
app.include_router(withdrawals.router)
app.include_router(investments.router)
app.include_router(mining.router)
app.include_router(staking.router)
app.include_router(signals.router)
app.include_router(subscriptions.router)
app.include_router(copy_trading.router)
app.include_router(admin.router)
app.include_router(ably.router)
app.include_router(real_estate.router)

from fastapi.staticfiles import StaticFiles
import os

uploads_dir = os.path.join(os.getcwd(), "app", "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.get("/")
async def root():
    """API health check"""
    return {
        "message": "Legacy FX Cryptocurrency Broker API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )

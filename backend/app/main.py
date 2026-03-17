from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import asyncio

from app.config import get_settings
from app.database import engine, Base

# Import all models to ensure they're registered with Base.metadata FIRST
from app.models.user import User
from app.models.document import Document
from app.models.wallet import Wallet
from app.models.account import Account
from app.models.trading import TradingPair, Order, UserAsset, PriceAlert, ExecutionTrade
from app.models.trade import Trade
from app.models.staking import StakingProduct, StakingPosition
from app.models.finance import Deposit, Withdrawal, Transaction, ColdStorageVault, SubscriptionPlan, UserSubscription
from app.models.investment import (
    InvestmentProduct, InvestmentPosition, 
    CopyTrader, CopySession
)
from app.models.real_estate import RealEstateProperty, RealEstateInvestment
from app.models.mining import MiningPlan, MiningSubscription
from app.models.signals import SignalSource, TradingSignal
from app.models.signal import Signal
from app.models.notification import Notification
from app.models.security import LoginHistory
from app.models.referral import Referral
from app.models.support import SupportTicket, TicketMessage

from app.routes import (
    auth, users, trading, markets, deposits, 
    withdrawals, investments, mining, staking, 
    signals, subscriptions, admin
)

settings = get_settings()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for app startup and shutdown"""
    # On startup, you could run migrations here, but it's better to do it manually.
    # print("Running database migrations...")
    # from alembic.config import Config
    # from alembic import command
    # alembic_cfg = Config("alembic.ini")
    # command.upgrade(alembic_cfg, "head")
    
    yield
    
    # On shutdown
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
app.include_router(withdrawals.router)
app.include_router(investments.router)
app.include_router(mining.router)
app.include_router(staking.router)
app.include_router(signals.router)
app.include_router(subscriptions.router)
app.include_router(admin.router)

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

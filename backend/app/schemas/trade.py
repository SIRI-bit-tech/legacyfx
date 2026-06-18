from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TradeCreateRequest(BaseModel):
    symbol: str
    quantity: float
    trade_type: str
    order_type: str = "MARKET"
    price: Optional[float] = None
    leverage: Optional[float] = None
    take_profit: Optional[float] = None
    stop_loss: Optional[float] = None
    two_fa_code: Optional[str] = None

class TradeResponse(BaseModel):
    id: str
    symbol: str
    trade_type: str
    quantity: float
    entry_price: float
    status: str
    pnl: Optional[float] = None
    pnl_percentage: Optional[float] = None
    created_at: datetime
    closed_at: Optional[datetime] = None

class PortfolioHolding(BaseModel):
    symbol: str
    quantity: float
    entry_price: float
    current_price: float
    value: float
    pnl: float
    pnl_percentage: float

class PortfolioResponse(BaseModel):
    total_value: float
    total_pnl: float
    total_pnl_percentage: float
    holdings: List[PortfolioHolding]

class CopyTradeRequest(BaseModel):
    trader_id: str
    allocation_amount: float

class TopTraderResponse(BaseModel):
    user_id: str
    username: str
    win_rate: float
    total_trades: int
    avg_roi: float
    followers: int

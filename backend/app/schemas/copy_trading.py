from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CopyModeType(str, Enum):
    PROPORTIONAL = "proportional"  # Scale to your account size
    FIXED_AMOUNT = "fixed_amount"  # Copy fixed USD value
    PERCENTAGE = "percentage"  # Copy X% of trader's position


class MasterTraderResponse(BaseModel):
    trader_id: str
    username: str
    avatar_url: Optional[str] = None
    roi: float  # Return on investment %
    win_rate: float  # Win rate %
    followers: int
    total_trades: int
    aum: float  # Assets under management
    monthly_return: float  # Monthly return %
    trading_pair: str  # Primary trading pair


class StartCopyTradingRequest(BaseModel):
    trader_id: str
    copy_mode: CopyModeType
    
    # For PROPORTIONAL mode
    leverage: Optional[float] = 1.0  # 1x leverage (no leverage)
    
    # For FIXED_AMOUNT mode
    fixed_amount: Optional[float] = None  # USD amount per trade
    
    # For PERCENTAGE mode
    percentage: Optional[float] = None  # 10, 25, 50, 100 (% of trader's position)
    
    # Risk Management
    max_position_size: float = 5000.0  # Max USD per position
    enable_stop_loss: bool = True
    stop_loss_percentage: float = 5.0  # 5% stop loss
    enable_take_profit: bool = True
    take_profit_percentage: float = 10.0  # 10% take profit
    max_daily_copy_trades: int = 20  # Max trades per day
    
    # Safety
    auto_stop_on_loss: bool = True
    auto_stop_loss_threshold: float = 1000.0  # Stop if lost $1000


class CopyTradeStatusResponse(BaseModel):
    copy_id: str
    trader_id: str
    trader_username: str
    copy_mode: CopyModeType
    status: str  # ACTIVE, PAUSED, STOPPED
    started_at: datetime
    total_copied_trades: int
    total_pnl: float  # Total P&L in USD
    total_pnl_percentage: float  # Total P&L %
    win_count: int
    loss_count: int
    daily_trades_today: int
    cumulative_loss: float  # Cumulative loss tracking


class SearchTraderRequest(BaseModel):
    query: str  # Username or trader ID
    limit: int = 10


class CopyTradeHistoryResponse(BaseModel):
    trade_id: str
    trader_id: str
    symbol: str
    side: str  # BUY or SELL
    quantity: float
    entry_price: float
    exit_price: Optional[float] = None
    status: str  # OPEN or CLOSED
    pnl: float
    pnl_percentage: float
    opened_at: datetime
    closed_at: Optional[datetime] = None


class StopCopyTradingRequest(BaseModel):
    copy_id: str
    close_all_positions: bool = False  # Close all open positions immediately

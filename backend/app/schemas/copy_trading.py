from pydantic import BaseModel, Field, field_validator, model_validator
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
    leverage: Optional[float] = Field(1.0, gt=0, description="Leverage multiplier for proportional mode")  # 1x leverage (no leverage)
    
    # For FIXED_AMOUNT mode
    fixed_amount: Optional[float] = Field(None, gt=0, description="Fixed USD amount per trade for fixed amount mode")  # USD amount per trade
    
    # For PERCENTAGE mode
    percentage: Optional[float] = Field(None, gt=0, le=100, description="Percentage of trader's position to copy (0-100)")  # 10, 25, 50, 100 (% of trader's position)
    
    # Risk Management
    max_position_size: float = Field(5000.0, ge=0, description="Maximum USD per position")  # Max USD per position
    enable_stop_loss: bool = True
    stop_loss_percentage: float = Field(5.0, gt=0, le=100, description="Stop loss percentage (0-100)")  # 5% stop loss
    enable_take_profit: bool = True
    take_profit_percentage: float = Field(10.0, gt=0, le=100, description="Take profit percentage (0-100)")  # 10% take profit
    max_daily_copy_trades: int = Field(20, ge=0, description="Maximum number of trades per day")  # Max trades per day
    
    # Safety
    auto_stop_on_loss: bool = True
    auto_stop_loss_threshold: float = Field(1000.0, ge=0, description="Auto-stop loss threshold in USD")  # Stop if lost $1000

    @field_validator('leverage')
    @classmethod
    def validate_leverage(cls, v, info):
        if v is not None and v <= 0:
            raise ValueError('Leverage must be greater than 0')
        return v

    @field_validator('fixed_amount')
    @classmethod
    def validate_fixed_amount(cls, v, info):
        if v is not None and v <= 0:
            raise ValueError('Fixed amount must be greater than 0')
        return v

    @field_validator('percentage')
    @classmethod
    def validate_percentage(cls, v, info):
        if v is not None and (v <= 0 or v > 100):
            raise ValueError('Percentage must be between 0 and 100')
        return v

    @field_validator('stop_loss_percentage')
    @classmethod
    def validate_stop_loss_percentage(cls, v, info):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Stop loss percentage must be between 0 and 100')
        return v

    @field_validator('take_profit_percentage')
    @classmethod
    def validate_take_profit_percentage(cls, v, info):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Take profit percentage must be between 0 and 100')
        return v

    @model_validator(mode='after')
    def validate_copy_mode_requirements(self):
        """Validate that required fields are present for the selected copy mode"""
        copy_mode = self.copy_mode
        
        if copy_mode == CopyModeType.FIXED_AMOUNT:
            if not self.fixed_amount or self.fixed_amount <= 0:
                raise ValueError('Fixed amount mode requires fixed_amount > 0')
            # Clear other mode-specific fields
            self.leverage = 1.0
            self.percentage = None
            
        elif copy_mode == CopyModeType.PROPORTIONAL:
            if not self.leverage or self.leverage <= 0:
                raise ValueError('Proportional mode requires leverage > 0')
            # Clear other mode-specific fields
            self.fixed_amount = None
            self.percentage = None
            
        elif copy_mode == CopyModeType.PERCENTAGE:
            if not self.percentage or self.percentage <= 0 or self.percentage > 100:
                raise ValueError('Percentage mode requires percentage between 0 and 100')
            # Clear other mode-specific fields
            self.leverage = 1.0
            self.fixed_amount = None
        
        # Validate stop loss/take profit consistency
        if self.enable_stop_loss and (not self.stop_loss_percentage or self.stop_loss_percentage <= 0):
            raise ValueError('Stop loss enabled requires stop_loss_percentage > 0')
            
        if self.enable_take_profit and (not self.take_profit_percentage or self.take_profit_percentage <= 0):
            raise ValueError('Take profit enabled requires take_profit_percentage > 0')
        
        return self


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

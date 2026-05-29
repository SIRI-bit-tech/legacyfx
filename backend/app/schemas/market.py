from pydantic import BaseModel
from typing import Optional, List

class PriceResponse(BaseModel):
    symbol: str
    price: float
    currency: str
    timestamp: str

class AssetPriceResponse(BaseModel):
    symbol: str
    name: str
    current_price: float
    market_cap: Optional[float]
    market_cap_rank: Optional[int]
    total_volume: Optional[float]
    high_24h: Optional[float]
    low_24h: Optional[float]
    price_change_24h: Optional[float]
    price_change_percentage_24h: Optional[float]
    circulating_supply: Optional[float]
    image_url: Optional[str]

class TrendingCoinResponse(BaseModel):
    symbol: str
    name: str
    current_price: float
    price_change_percentage_24h: float
    market_cap_rank: int

class GainersLosersResponse(BaseModel):
    symbol: str
    name: str
    current_price: float
    price_change_percentage_24h: float

class GlobalStatsResponse(BaseModel):
    total_market_cap: float
    total_volume: float
    btc_dominance: float
    eth_dominance: float
    # Platform specific
    platform_tvl: Optional[float] = 0.0
    active_miners: Optional[int] = 0
    total_hashpower: Optional[str] = "0.0"

class TradingPairResponse(BaseModel):
    id: str
    base_symbol: str
    quote_symbol: str
    is_active: bool

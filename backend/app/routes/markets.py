from fastapi import APIRouter, Depends, HTTPException, status
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import httpx

from app.database import get_db
from app.models.trading import TradingPair
from app.config import get_settings
from app.schemas.market import PriceResponse, AssetPriceResponse, GlobalStatsResponse, TradingPairResponse
from app.models.investment import InvestmentProduct, InvestmentPosition, InvestmentStatus
from app.models.mining import MiningPlan, MiningSubscription
from sqlalchemy import func

router = APIRouter(prefix="/api/v1/markets", tags=["markets"])
logger = logging.getLogger(__name__)
settings = get_settings()

BINANCE_BASE = "https://api.binance.com/api/v3"

# Common coin names mapping
COIN_NAMES = {
    "BTC": "Bitcoin", "ETH": "Ethereum", "USDT": "Tether", "BNB": "BNB", "SOL": "Solana",
    "XRP": "XRP", "USDC": "USD Coin", "ADA": "Cardano", "AVAX": "Avalanche", "DOGE": "Dogecoin",
    "DOT": "Polkadot", "TRX": "TRON", "LINK": "Chainlink", "MATIC": "Polygon", "SHIB": "Shiba Inu",
    "LTC": "Litecoin", "BCH": "Bitcoin Cash", "UNI": "Uniswap", "ATOM": "Cosmos", "XLM": "Stellar",
    "NEAR": "NEAR Protocol", "APT": "Aptos", "FIL": "Filecoin", "INJ": "Injective", "OP": "Optimism"
}

@router.get("/prices", response_model=List[AssetPriceResponse])
async def get_market_prices():
    """Fetch live crypto prices from Binance."""
    url = f"{BINANCE_BASE}/ticker/24hr"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Filter USDT pairs
            usdt_pairs = [item for item in data if item.get("symbol", "").endswith("USDT")]
            
            # Sort by volume (proxy for market cap rank)
            usdt_pairs.sort(key=lambda x: float(x.get("quoteVolume", 0)), reverse=True)
            
            # Take top 50
            top_50 = usdt_pairs[:50]
            
            prices = []
            for idx, coin in enumerate(top_50):
                try:
                    symbol = coin.get("symbol", "").replace("USDT", "")
                    name = COIN_NAMES.get(symbol, symbol)
                    
                    prices.append(
                        AssetPriceResponse(
                            symbol=symbol,
                            name=name,
                            current_price=float(coin.get("lastPrice") or 0),
                            market_cap=None,  # Binance doesn't provide market cap
                            market_cap_rank=idx + 1,
                            total_volume=float(coin.get("quoteVolume") or 0),
                            high_24h=float(coin.get("highPrice") or 0),
                            low_24h=float(coin.get("lowPrice") or 0),
                            price_change_24h=float(coin.get("priceChange") or 0),
                            price_change_percentage_24h=float(coin.get("priceChangePercent") or 0),
                            circulating_supply=None,
                            image_url=f"https://assets.coincap.io/assets/icons/{symbol.lower()}@2x.png"
                        )
                    )
                except Exception as coin_error:
                    logger.warning(f"Failed to parse coin data: {coin}, error: {coin_error}")
                    continue
            
            return prices
    except Exception as e:
        logger.error(f"Error fetching market prices: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@router.get("/global-stats", response_model=GlobalStatsResponse)
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    """Get global market statistics and platform stats."""
    url = f"{BINANCE_BASE}/ticker/24hr"
    
    async with httpx.AsyncClient() as client:
        try:
            # 1. External Market Cap (Estimate from Binance)
            response = await client.get(url)
            response.raise_for_status()
            market_data = response.json()
            
            total_vol = sum(float(coin.get("quoteVolume", 0)) for coin in market_data if coin.get("symbol", "").endswith("USDT"))
            
            # Binance doesn't provide market cap, use highly realistic estimates
            total_mc = 2500000000000.0  # $2.5 Trillion estimate
            btc_dom = 53.5
            eth_dom = 16.2
            
            # 2. Platform Stats
            # Mining stats
            mining_subs_stmt = select(func.count(MiningSubscription.id)).where(MiningSubscription.status == "ACTIVE")
            total_miners = (await db.execute(mining_subs_stmt)).scalar() or 0
            
            # Calculate actual total hashpower from active subscriptions
            hash_stmt = select(MiningPlan.hashrate).join(
                MiningSubscription, MiningSubscription.plan_id == MiningPlan.id
            ).where(MiningSubscription.status == "ACTIVE")
            
            hash_results = (await db.execute(hash_stmt)).scalars().all()
            total_th = 0.0
            for h in hash_results:
                try:
                    parts = h.split()
                    if len(parts) >= 2:
                        val = float(parts[0])
                        unit = parts[1].upper()
                        if "PH" in unit: val *= 1000
                        elif "EH" in unit: val *= 1000000
                        elif "GH" in unit: val /= 1000
                        total_th += val
                except (ValueError, IndexError):
                    continue
            
            if total_th >= 1000000:
                total_hashrate_str = f"{total_th/1000000:.2f} EH/s"
            elif total_th >= 1000:
                total_hashrate_str = f"{total_th/1000:.2f} PH/s"
            else:
                total_hashrate_str = f"{total_th:.2f} TH/s"
            
            # Staking stats (TVL)
            staking_stmt = select(func.sum(InvestmentPosition.amount)).where(InvestmentPosition.status == InvestmentStatus.ACTIVE)
            tvl = (await db.execute(staking_stmt)).scalar() or 0.0
            
            return GlobalStatsResponse(
                total_market_cap=total_mc,
                total_volume=total_vol,
                btc_dominance=btc_dom,
                eth_dominance=eth_dom,
                # Platform dynamics
                platform_tvl=tvl,
                active_miners=total_miners,
                total_hashpower=total_hashrate_str
            )
        except Exception as e:
            logger.error(f"Global stats error: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch global stats")

@router.get("/pairs", response_model=List[TradingPairResponse])
async def get_trading_pairs(db: AsyncSession = Depends(get_db)):
    """Get supported trading pairs from DB."""
    stmt = select(TradingPair).where(TradingPair.is_active == True)
    result = await db.execute(stmt)
    pairs = result.scalars().all()
    
    # Map SQLAlchemy model to Pydantic schema
    return [
        TradingPairResponse(
            id=str(p.id),
            base_symbol=p.base_asset,
            quote_symbol=p.quote_asset,
            is_active=p.is_active
        ) for p in pairs
    ]

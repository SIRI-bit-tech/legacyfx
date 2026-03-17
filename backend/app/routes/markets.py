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

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

@router.get("/prices", response_model=List[AssetPriceResponse])
async def get_market_prices():
    """Fetch live crypto prices from CoinGecko."""
    # We'll fetch top 50 coins by default
    url = f"{COINGECKO_BASE}/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 50,
        "page": 1,
        "sparkline": False
    }
    if settings.COINGECKO_API_KEY:
        params["x_cg_demo_api_key"] = settings.COINGECKO_API_KEY

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if not isinstance(data, list):
                logger.error(f"Unexpected response format from CoinGecko: {type(data)}")
                raise HTTPException(status_code=500, detail="Invalid response from CoinGecko API")
            
            prices = []
            for coin in data:
                try:
                    prices.append(
                        AssetPriceResponse(
                            symbol=coin.get("symbol", "").upper(),
                            name=coin.get("name", ""),
                            current_price=coin.get("current_price") or 0,
                            market_cap=coin.get("market_cap"),
                            market_cap_rank=coin.get("market_cap_rank"),
                            total_volume=coin.get("total_volume"),
                            high_24h=coin.get("high_24h"),
                            low_24h=coin.get("low_24h"),
                            price_change_24h=coin.get("price_change_24h"),
                            price_change_percentage_24h=coin.get("price_change_percentage_24h"),
                            circulating_supply=coin.get("circulating_supply"),
                            image_url=coin.get("image")
                        )
                    )
                except Exception as coin_error:
                    logger.warning(f"Failed to parse coin data: {coin}, error: {coin_error}")
                    continue
            
            return prices
    except httpx.HTTPError as http_error:
        logger.error(f"HTTP error fetching CoinGecko data: {http_error}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(http_error)}")
    except Exception as e:
        logger.error(f"Error fetching market prices: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@router.get("/global-stats", response_model=GlobalStatsResponse)
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    """Get global market statistics and platform stats."""
    url = f"{COINGECKO_BASE}/global"
    
    async with httpx.AsyncClient() as client:
        try:
            # 1. External Market Cap
            response = await client.get(url)
            response.raise_for_status()
            market_data = response.json()["data"]
            
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
                total_market_cap=market_data["total_market_cap"]["usd"],
                total_volume=market_data["total_volume"]["usd"],
                btc_dominance=market_data["market_cap_percentage"]["btc"],
                eth_dominance=market_data["market_cap_percentage"]["eth"],
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
            base_symbol=p.base_symbol,
            quote_symbol=p.quote_symbol,
            is_active=p.is_active
        ) for p in pairs
    ]

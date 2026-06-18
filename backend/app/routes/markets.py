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
    """Fetch live crypto prices from CoinMarketCap."""
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    headers = {
        "X-CMC_PRO_API_KEY": settings.CMC_API_KEY,
        "Accept": "application/json"
    }
    params = {
        "start": "1",
        "limit": "50",
        "convert": "USD"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            prices = []
            for item in data.get("data", []):
                try:
                    symbol = item.get("symbol", "")
                    name = item.get("name", symbol)
                    quote = item.get("quote", {}).get("USD", {})
                    
                    price = float(quote.get("price") or 0)
                    change = float(quote.get("percent_change_24h") or 0)
                    
                    prices.append(
                        AssetPriceResponse(
                            symbol=symbol,
                            name=name,
                            current_price=price,
                            market_cap=float(quote.get("market_cap") or 0),
                            market_cap_rank=int(item.get("cmc_rank") or 0),
                            total_volume=float(quote.get("volume_24h") or 0),
                            high_24h=0.0,
                            low_24h=0.0,
                            price_change_24h=price * (change/100),
                            price_change_percentage_24h=change,
                            circulating_supply=float(item.get("circulating_supply") or 0),
                            image_url=f"https://assets.coincap.io/assets/icons/{symbol.lower()}@2x.png"
                        )
                    )
                except Exception as coin_error:
                    logger.warning(f"Failed to parse coin data: {item}, error: {coin_error}")
                    continue
            
            return prices
    except Exception as e:
        logger.error(f"Error fetching market prices: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@router.get("/global-stats", response_model=GlobalStatsResponse)
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    """Get global market statistics and platform stats."""
    url = "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest"
    headers = {
        "X-CMC_PRO_API_KEY": settings.CMC_API_KEY,
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # 1. External Market Cap from CMC
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            global_data = data.get("data", {})
            quote = global_data.get("quote", {}).get("USD", {})
            
            total_mc = float(quote.get("total_market_cap", 2500000000000.0))
            total_vol = float(quote.get("total_volume_24h", 100000000000.0))
            btc_dom = float(global_data.get("btc_dominance", 53.5))
            eth_dom = float(global_data.get("eth_dominance", 16.2))
            
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

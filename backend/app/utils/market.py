import httpx
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

import redis.asyncio as redis
from app.config import get_settings

settings = get_settings()
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def get_live_price(symbol: str) -> float:
    """Get live price for a symbol (e.g. BTC, ETH)"""
    symbol = symbol.upper()
    if symbol.endswith("USDT"):
        symbol = symbol[:-4]
    elif symbol.endswith("USD"):
        symbol = symbol[:-3]
        
    # Check cache first using Redis
    try:
        cached_price = await redis_client.get(f"price_{symbol}")
        if cached_price is not None:
            return float(cached_price)
    except Exception as e:
        logger.warning(f"Redis cache error for {symbol}: {e}")

    # Map symbol to Coingecko ID
    mapping = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "USDT": "tether",
        "SOL": "solana",
        "BNB": "binancecoin",
        "XRP": "ripple",
        "ADA": "cardano",
        "DOGE": "dogecoin",
        "DOT": "polkadot",
        "TRX": "tron"
    }
    
    id = mapping.get(symbol)
    if not id:
        return 1.0 # Default for stablecoins or unknowns
        
    url = f"{COINGECKO_BASE}/simple/price"
    params = {
        "ids": id,
        "vs_currencies": "usd"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            price = data.get(id, {}).get("usd", 1.0)
            try:
                await redis_client.set(f"price_{symbol}", price, ex=60) # 1 minute cache
            except Exception as e:
                logger.warning(f"Failed to set Redis cache for {symbol}: {e}")
            return price
    except Exception as e:
        logger.error(f"Failed to fetch price for {symbol}: {e}")
        try:
            cached_price = await redis_client.get(f"price_{symbol}")
            return float(cached_price) if cached_price is not None else 1.0
        except:
            return 1.0

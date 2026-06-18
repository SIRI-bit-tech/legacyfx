import httpx
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

BINANCE_BASE = "https://api.binance.com/api/v3"
COINCAP_BASE = "https://api.coincap.io/v2"

import redis.asyncio as redis
from app.config import get_settings

settings = get_settings()
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
async def get_live_price(symbol: str) -> float:
    """Get live price for a symbol using Binance (Primary) and CoinCap (Backup)"""
    original_symbol = symbol
    symbol = symbol.upper().replace("/", "").replace("-", "")
    if symbol.endswith("USDT"):
        symbol = symbol[:-4]
    elif symbol.endswith("USD"):
        symbol = symbol[:-3]
        
    stablecoins = {"USDT", "USDC", "BUSD", "DAI", "TUSD"}
    if symbol in stablecoins:
        return 1.0
        
    # Check cache first using Redis
    try:
        cached_price = await redis_client.get(f"price_{symbol}")
        if cached_price is not None:
            return float(cached_price)
    except Exception as e:
        logger.warning(f"Redis cache error for {symbol}: {e}")

    # 1. Try Binance API (Primary)
    binance_symbol = f"{symbol}USDT"
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{BINANCE_BASE}/ticker/price?symbol={binance_symbol}")
            if response.status_code == 200:
                data = response.json()
                price = float(data.get("price", 0))
                if price > 0:
                    await _cache_price(symbol, price)
                    return price
    except Exception as e:
        logger.warning(f"Binance API failed for {symbol}: {e}")

    # 2. Try CoinCap API (Backup)
    mapping = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "SOL": "solana",
        "BNB": "binance-coin",
        "XRP": "xrp",
        "ADA": "cardano",
        "DOGE": "dogecoin",
        "DOT": "polkadot",
        "TRX": "tron"
    }
    
    coincap_id = mapping.get(symbol, symbol.lower())
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{COINCAP_BASE}/assets/{coincap_id}")
            if response.status_code == 200:
                data = response.json()
                price = float(data.get("data", {}).get("priceUsd", 0))
                if price > 0:
                    await _cache_price(symbol, price)
                    return price
    except Exception as e:
        logger.warning(f"CoinCap API failed for {symbol}: {e}")

    # If both APIs fail, we must strictly reject the trade rather than guess $1.00
    raise ValueError(f"Live price for {original_symbol} is currently unavailable from all feeds.")

async def _cache_price(symbol: str, price: float):
    try:
        await redis_client.set(f"price_{symbol}", price, ex=60) # 1 minute cache
    except Exception as e:
        logger.warning(f"Failed to set Redis cache for {symbol}: {e}")

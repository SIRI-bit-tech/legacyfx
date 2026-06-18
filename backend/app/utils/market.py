import httpx
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

BINANCE_BASE = "https://api.binance.com/api/v3"
CMC_BASE = "https://pro-api.coinmarketcap.com/v1"
ALPHAVANTAGE_BASE = "https://www.alphavantage.co/query"

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

    # 1. Try CoinMarketCap API (Primary - Highly Reliable & Authenticated)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            headers = {"X-CMC_PRO_API_KEY": settings.CMC_API_KEY, "Accept": "application/json"}
            response = await client.get(f"{CMC_BASE}/cryptocurrency/quotes/latest?symbol={symbol}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "data" in data and symbol in data["data"]:
                    price = float(data["data"][symbol]["quote"]["USD"]["price"])
                    if price > 0:
                        await _cache_price(symbol, price)
                        return price
    except Exception as e:
        logger.warning(f"CoinMarketCap API failed for {symbol}: {e}")

    # 2. Try Binance API (Backup - Geofenced in US)
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

    # 3. Try AlphaVantage API (Final Fallback)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{ALPHAVANTAGE_BASE}?function=CURRENCY_EXCHANGE_RATE&from_currency={symbol}&to_currency=USD&apikey={settings.ALPHA_VANTAGE_API_KEY}")
            if response.status_code == 200:
                data = response.json()
                if "Realtime Currency Exchange Rate" in data:
                    price = float(data["Realtime Currency Exchange Rate"]["5. Exchange Rate"])
                    if price > 0:
                        await _cache_price(symbol, price)
                        return price
    except Exception as e:
        logger.warning(f"AlphaVantage API failed for {symbol}: {e}")

    # If ALL authenticated APIs fail, we must strictly reject the trade
    raise ValueError(f"Live price for {original_symbol} is currently unavailable from all feeds.")

async def _cache_price(symbol: str, price: float):
    try:
        await redis_client.set(f"price_{symbol}", price, ex=60) # 1 minute cache
    except Exception as e:
        logger.warning(f"Failed to set Redis cache for {symbol}: {e}")

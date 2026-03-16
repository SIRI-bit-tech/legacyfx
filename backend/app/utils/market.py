import httpx
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# Cache for prices to avoid rate limiting
_price_cache: Dict[str, float] = {}

async def get_live_price(symbol: str) -> float:
    """Get live price for a symbol (e.g. BTC, ETH)"""
    symbol = symbol.upper()
    
    # Check cache first (primitive cache)
    # In production, use Redis or similar
    if symbol in _price_cache:
        return _price_cache[symbol]

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
            _price_cache[symbol] = price
            return price
    except Exception as e:
        logger.error(f"Failed to fetch price for {symbol}: {e}")
        return _price_cache.get(symbol, 1.0)

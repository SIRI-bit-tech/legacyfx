"""
Price broadcast service for real-time price updates via Ably.
Fetches prices from Twelve Data API and broadcasts to connected clients.
"""
import asyncio
import logging
import httpx
from typing import Dict, Set, Optional, List
from datetime import datetime, timedelta
from ably import AblyRest

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class PriceBroadcastService:
    """Service for broadcasting live price updates to clients via Ably."""
    
    def __init__(self):
        self.ably_client: Optional[AblyRest] = None
        self.active_symbols: Set[str] = set()
        self.price_cache: Dict[str, dict] = {}
        self.running = False
        self.task: Optional[asyncio.Task] = None
        
        # Rate limiting
        self.api_calls_count = 0
        self.api_calls_reset = datetime.now()
        self.max_calls_per_minute = 8  # Twelve Data free tier limit
        
    async def start(self):
        """Start the price broadcast service."""
        if self.running:
            return
            
        api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        if not api_key:
            logger.error("Ably API key not configured")
            return
            
        try:
            self.ably_client = AblyRest(api_key)
            self.running = True
            self.task = asyncio.create_task(self._broadcast_loop())
            logger.info("Price broadcast service started")
        except Exception as e:
            logger.error(f"Failed to start price broadcast service: {e}")
            
    async def stop(self):
        """Stop the price broadcast service."""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Price broadcast service stopped")
        
    def add_symbol(self, symbol: str):
        """Add a symbol to the tracking list."""
        self.active_symbols.add(symbol)
        
    def remove_symbol(self, symbol: str):
        """Remove a symbol from tracking."""
        self.active_symbols.discard(symbol)
        
    async def _broadcast_loop(self):
        """Main loop with batch processing and adaptive throttling."""
        while self.running:
            try:
                # 1. Reset rate limit counter
                if datetime.now() - self.api_calls_reset > timedelta(minutes=1):
                    self.api_calls_count = 0
                    self.api_calls_reset = datetime.now()
                
                # 2. Fetch all active symbols in a single batch
                symbols = list(self.active_symbols)
                if symbols:
                    await self._fetch_batch_and_broadcast(symbols)
                
                # 3. Adaptive Sleep: Balance interval with remaining quota
                # If we have many symbols that count as multiple calls, we must sleep longer
                call_weight = len(symbols)
                remaining_calls = self.max_calls_per_minute - self.api_calls_count
                
                if remaining_calls <= 0:
                    # Wait for bucket reset
                    sleep_time = 61 - (datetime.now() - self.api_calls_reset).seconds
                    await asyncio.sleep(max(1, sleep_time))
                else:
                    # Target interval based on quota
                    await asyncio.sleep(max(3, settings.PRICE_UPDATE_INTERVAL / 1000.0))
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in price broadcast loop: {e}")
                await asyncio.sleep(5)
                
    async def _fetch_batch_and_broadcast(self, symbols: List[str]):
        """Fetch multiple symbols in one request and broadcast each."""
        try:
            if not settings.TWELVE_DATA_API_KEY:
                return

            td_symbols = [self._to_twelve_data_format(s) for s in symbols]
            symbol_batch = ",".join(td_symbols)
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{settings.TWELVE_DATA_BASE_URL}/quote"
                params = {
                    "symbol": symbol_batch,
                    "apikey": settings.TWELVE_DATA_API_KEY
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                json_data = response.json()
                
                # Twelve Data counts 1 call per symbol even in batch
                self.api_calls_count += len(symbols)
                
                # Response can be a single dict or multiple in a dict keyed by symbol
                if len(symbols) == 1:
                    await self._handle_single_response(symbols[0], json_data)
                else:
                    for symbol in symbols:
                        td_key = self._to_twelve_data_format(symbol)
                        if td_key in json_data:
                            await self._handle_single_response(symbol, json_data[td_key])
                            
        except Exception as e:
            logger.error(f"Error in batch fetch: {e}")
            for symbol in symbols:
                await self._broadcast_cached(symbol)

    async def _handle_single_response(self, symbol: str, data: dict):
        """Prepare and broadcast a single symbol update."""
        try:
            price_data = {
                "price": float(data.get("close") or data.get("price", 0)),
                "change24h": float(data.get("percent_change", 0)),
                "high24h": float(data.get("high", 0)),
                "low24h": float(data.get("low", 0)),
                "volume24h": float(data.get("volume", 0)),
                "timestamp": datetime.now().isoformat()
            }
            
            self.price_cache[symbol] = price_data
            await self._broadcast_to_ably(symbol, price_data)
        except Exception as e:
            logger.error(f"Error handling data for {symbol}: {e}")

    async def _broadcast_to_ably(self, symbol: str, data: dict):
        """Institutional Ably broadcast."""
        if not self.ably_client:
            return
        try:
            channel_name = f"prices:{symbol}"
            channel = self.ably_client.channels.get(channel_name)
            await channel.publish("update", data)
        except Exception as e:
            logger.error(f"Ably broadcast failed for {symbol}: {e}")
            
    async def _broadcast_cached(self, symbol: str):
        if symbol in self.price_cache:
            await self._broadcast_to_ably(symbol, self.price_cache[symbol])
            
    def _to_twelve_data_format(self, symbol: str) -> str:
        clean = symbol.replace('-', '/').upper()
        if '/' not in clean:
            # Add separator for common crypto pairs if missing
            for q in ['USDT', 'USDC', 'USD', 'BTC', 'ETH']:
                if clean.endswith(q):
                    clean = f"{clean[:-len(q)]}/{q}"
                    break
        return clean.replace('USDT', 'USD') # Twelve Data often uses /USD for crypto


# Global instance
price_broadcast_service = PriceBroadcastService()

"""
Synthetic order book service for forex & stocks.

This generates a visually plausible depth ladder around the latest mid price
using cached Twelve Data quote data (via price_broadcast_service).

It is NOT a real exchange Level 2 feed; it is generated for UI purposes only.
"""

import asyncio
import logging
from typing import Dict, Optional, Set, List
from ably import AblyRest
from datetime import datetime

from app.config import get_settings
from app.services.price_broadcast import price_broadcast_service

logger = logging.getLogger(__name__)
settings = get_settings()


class SyntheticOrderBookService:
    def __init__(self):
        self.ably_client: Optional[AblyRest] = None
        self.active_symbols: Set[str] = set()
        self.running = False
        self.task: Optional[asyncio.Task] = None

    async def start(self):
        if self.running:
            return

        api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        if not api_key:
            logger.error("Ably API key not configured (synthetic order book)")
            return

        self.ably_client = AblyRest(api_key)
        self.running = True
        self.task = asyncio.create_task(self._broadcast_loop())
        logger.info("Synthetic order book service started")

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        self.active_symbols.clear()
        logger.info("Synthetic order book service stopped")

    async def subscribe_symbol(self, symbol: str):
        if symbol in self.active_symbols:
            return
        self.active_symbols.add(symbol)

        # Publish immediately so the UI doesn't wait for the next tick.
        try:
            await self._publish_snapshot(symbol)
        except Exception as e:
            logger.error(f"Failed to publish synthetic snapshot for {symbol}: {e}")

    async def unsubscribe_symbol(self, symbol: str):
        self.active_symbols.discard(symbol)

    async def _broadcast_loop(self):
        while self.running:
            try:
                for symbol in list(self.active_symbols):
                    await self._publish_update(symbol)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in synthetic order book loop: {e}")
            await asyncio.sleep(settings.ORDER_BOOK_UPDATE_INTERVAL / 1000.0)

    def _to_twelve_data_format(self, symbol: str) -> str:
        clean = symbol.replace("-", "/").upper()
        if "/" not in clean:
            # Try to infer a crypto/FX separator if none is present.
            for q in ["USDT", "USDC", "USD", "BTC", "ETH"]:
                if clean.endswith(q):
                    clean = f"{clean[:-len(q)]}/{q}"
                    break
        return clean.replace("USDT", "USD")

    async def _get_price_data(self, symbol: str) -> Optional[Dict]:
        # 1) Prefer cache populated by price_broadcast_service
        cached = price_broadcast_service.price_cache.get(symbol)
        if cached:
            return cached

        # 2) Fallback: fetch once directly from Twelve Data
        if not settings.TWELVE_DATA_API_KEY:
            return None

        import httpx  # local import to keep service lightweight on startup

        try:
            url = f"{settings.TWELVE_DATA_BASE_URL}/quote"
            params = {"symbol": self._to_twelve_data_format(symbol), "apikey": settings.TWELVE_DATA_API_KEY}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()

            # Twelve Data may return keys directly or nested; keep it defensive.
            close = data.get("close") or data.get("price") or data.get("last") or 0
            high = data.get("high") or 0
            low = data.get("low") or 0
            change24h = data.get("percent_change") or data.get("change") or 0
            volume24h = data.get("volume") or 0

            return {
                "price": float(close),
                "high24h": float(high),
                "low24h": float(low),
                "change24h": float(change24h),
                "volume24h": float(volume24h),
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Synthetic order book: failed to fetch quote for {symbol}: {e}")
            return None

    def _generate_levels(self, price_data: Dict, levels: int = 10) -> Dict[str, List[Dict]]:
        mid = float(price_data.get("price") or 0)
        if mid <= 0:
            return {"bids": [], "asks": [], "sequence": 0}

        import random

        high = float(price_data.get("high24h") or 0)
        low = float(price_data.get("low24h") or 0)
        volume24h = float(price_data.get("volume24h") or 0)

        # Estimate a realistic-looking spread using the day range when available.
        if high > low > 0:
            range_pct = (high - low) / mid
        else:
            range_pct = 0.01

        # Half-spread: clamp to avoid absurdly tight/wide ladders.
        spread_pct = max(0.001, min(0.03, range_pct / 6.0))
        half_spread = spread_pct / 2.0

        # Distance between levels – wider step so each level is visually distinct.
        step_pct = spread_pct / levels

        # Volume: convert notional volume to a rough base quantity scale.
        # If volume is unknown, default to a small-ish scale so UI shows numbers.
        base_qty = max(volume24h / mid, 1.0) if mid > 0 else 1.0

        # Determine price decimal precision for rounding
        if mid < 0.01:
            decimals = 8
        elif mid < 1:
            decimals = 6
        elif mid < 10:
            decimals = 5
        elif mid < 100:
            decimals = 4
        elif mid < 1000:
            decimals = 3
        else:
            decimals = 2

        bids: List[Dict] = []
        asks: List[Dict] = []

        for i in range(levels):
            # Add small random jitter for realism (±20% of the step)
            jitter = random.uniform(-0.2, 0.2) * step_pct

            bid_price = mid * (1.0 - half_spread - i * step_pct + jitter)
            ask_price = mid * (1.0 + half_spread + i * step_pct + jitter)

            # Round to appropriate precision so levels look clean
            bid_price = round(bid_price, decimals)
            ask_price = round(ask_price, decimals)

            # Quantity decreases with distance from mid; keep it stable across updates.
            qty_jitter = random.uniform(0.8, 1.2)
            qty_scale = 1.0 / ((i + 1) ** 1.15)
            quantity = max(base_qty * qty_scale * qty_jitter, 0.0000001)

            bids.append({"price": bid_price, "quantity": round(quantity, 6)})
            asks.append({"price": ask_price, "quantity": round(quantity * 0.98, 6)})

        return {"bids": bids, "asks": asks, "sequence": int(datetime.utcnow().timestamp())}

    async def _publish_snapshot(self, symbol: str):
        if not self.ably_client:
            return

        price_data = await self._get_price_data(symbol)
        if not price_data:
            return

        payload = self._generate_levels(price_data, levels=10)
        channel_name = f"orderbook:{symbol}"
        channel = self.ably_client.channels.get(channel_name)
        await channel.publish("snapshot", payload)

    async def _publish_update(self, symbol: str):
        if not self.ably_client:
            return

        price_data = await self._get_price_data(symbol)
        if not price_data:
            return

        payload = self._generate_levels(price_data, levels=10)
        channel_name = f"orderbook:{symbol}"
        channel = self.ably_client.channels.get(channel_name)
        await channel.publish("update", payload)


# Global instance
synthetic_orderbook_service = SyntheticOrderBookService()


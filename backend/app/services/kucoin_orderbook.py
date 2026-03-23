"""
KuCoin WebSocket service for real-time order book data.
Connects to KuCoin WebSocket API and broadcasts order book updates via Ably.
"""
import asyncio
import logging
import json
import httpx
import websockets
from typing import Dict, Set, Optional
from datetime import datetime
from ably import AblyRest

from app.config import get_settings
from app.utils.orderbook_manager import orderbook_manager

logger = logging.getLogger(__name__)
settings = get_settings()


class KuCoinOrderBookService:
    """Service for managing KuCoin order book WebSocket connections."""
    
    def __init__(self):
        self.ably_client: Optional[AblyRest] = None
        self.active_symbols: Set[str] = set()
        self.ws_connections: Dict[str, any] = {}
        self.running = False
        self.tasks: Dict[str, asyncio.Task] = {}
        
    async def start(self):
        """Start the KuCoin order book service."""
        if self.running:
            logger.warning("KuCoin order book service already running")
            return
            
        # Initialize Ably client
        api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        if not api_key:
            logger.error("Ably API key not configured")
            return
            
        try:
            self.ably_client = AblyRest(api_key)
            self.running = True
            logger.info("KuCoin order book service started")
        except Exception as e:
            logger.error(f"Failed to start KuCoin order book service: {e}")
            
    async def stop(self):
        """Stop the KuCoin order book service."""
        self.running = False
        
        # Cancel all tasks
        for task in self.tasks.values():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
                
        self.tasks.clear()
        self.active_symbols.clear()
        logger.info("KuCoin order book service stopped")
        
    async def subscribe_symbol(self, symbol: str):
        """
        Subscribe to order book updates for a symbol.
        
        Args:
            symbol: Trading pair symbol (e.g., BTC-USDT)
        """
        if symbol in self.active_symbols:
            logger.debug(f"Already subscribed to {symbol}")
            return
            
        self.active_symbols.add(symbol)
        
        # Start WebSocket connection task for this symbol
        task = asyncio.create_task(self._handle_symbol(symbol))
        self.tasks[symbol] = task
        
        logger.info(f"Subscribed to order book for {symbol}")
        
    async def unsubscribe_symbol(self, symbol: str):
        """
        Unsubscribe from order book updates for a symbol.
        
        Args:
            symbol: Trading pair symbol
        """
        if symbol not in self.active_symbols:
            return
            
        self.active_symbols.discard(symbol)
        
        # Cancel the task for this symbol
        if symbol in self.tasks:
            self.tasks[symbol].cancel()
            try:
                await self.tasks[symbol]
            except asyncio.CancelledError:
                pass
            del self.tasks[symbol]
            
        # Remove order book from memory
        orderbook_manager.remove(symbol)
        
        logger.info(f"Unsubscribed from order book for {symbol}")
        
    async def _handle_symbol(self, symbol: str):
        """
        Handle WebSocket connection and updates for a symbol.
        
        CRITICAL: Fetches full snapshot first, then applies incremental updates.
        If a sequence gap is detected or snapshot fails, it restarts the process.
        """
        while symbol in self.active_symbols and self.running:
            try:
                # Step 1: Fetch full order book snapshot
                success = await self._fetch_snapshot(symbol)
                if not success:
                    logger.error(f"Snapshot fetch failed for {symbol}, retrying in 5s...")
                    await asyncio.sleep(5)
                    continue
                
                # Step 2: Get WebSocket details and stream
                ws_details = await self._get_ws_details()
                if not ws_details:
                    logger.error(f"Failed to get WS details for {symbol}, retrying...")
                    await asyncio.sleep(5)
                    continue
                    
                # Step 3: Connect and stream (returns only on error or cancellation)
                await self._connect_and_stream(symbol, ws_details)
                
            except asyncio.CancelledError:
                logger.info(f"Order book task cancelled for {symbol}")
                break
            except Exception as e:
                logger.error(f"Error handling order book for {symbol}: {e}")
                await asyncio.sleep(5)

    async def _fetch_snapshot(self, symbol: str) -> bool:
        """Fetch snapshot from KuCoin REST API. Returns True on success."""
        try:
            url = f"{settings.KUCOIN_REST_BASE_URL}/api/v1/market/orderbook/level2_100"
            params = {"symbol": symbol}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") == "200000" and "data" in data:
                    snapshot = data["data"]
                    order_book = orderbook_manager.get_or_create(symbol)
                    order_book.apply_snapshot(
                        bids=snapshot.get("bids", []),
                        asks=snapshot.get("asks", []),
                        sequence=int(snapshot.get("sequence", 0))
                    )
                    await self._broadcast_snapshot(symbol)
                    logger.info(f"Successfully fetched snapshot for {symbol}")
                    return True
            logger.error(f"Invalid snapshot response for {symbol}: {data}")
            return False
        except Exception as e:
            logger.error(f"Error fetching snapshot for {symbol}: {e}")
            return False

    async def _get_ws_details(self) -> Optional[Dict]:
        """Get WebSocket connection details from KuCoin."""
        try:
            url = f"{settings.KUCOIN_REST_BASE_URL}/api/v1/bullet-public"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url)
                response.raise_for_status()
                data = response.json()
                if data.get("code") == "200000" and "data" in data:
                    return data["data"]
            return None
        except Exception as e:
            logger.error(f"Error getting WS details: {e}")
            return None

    async def _connect_and_stream(self, symbol: str, ws_details: Dict):
        """Connect to KuCoin WebSocket and stream order book updates."""
        token = ws_details.get("token")
        endpoint = ws_details["instanceServers"][0]["endpoint"]
        ws_url = f"{endpoint}?token={token}"
        
        try:
            async with websockets.connect(ws_url) as websocket:
                subscribe_msg = {
                    "id": f"{symbol}-orderbook",
                    "type": "subscribe",
                    "topic": f"/market/level2:{symbol}",
                    "response": True
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                async for message in websocket:
                    if symbol not in self.active_symbols:
                        break
                        
                    data = json.loads(message)
                    if data.get("type") == "message":
                        # _process_update returns False on sequence gap to trigger resync
                        if not await self._process_update(symbol, data):
                            logger.warning(f"Sequence gap for {symbol}, breaking stream for resync")
                            return
        except Exception as e:
            logger.error(f"WebSocket error for {symbol}: {e}")

    async def _process_update(self, symbol: str, data: Dict) -> bool:
        """Process incremental update. Returns False if gap detected."""
        try:
            update_data = data.get("data", {})
            changes = update_data.get("changes", {})
            sequence_start = int(update_data.get("sequenceStart", 0))
            sequence_end = int(update_data.get("sequenceEnd", 0))
            
            order_book = orderbook_manager.get_or_create(symbol)
            success = order_book.apply_update(changes, sequence_start, sequence_end)
            
            if success:
                # Broadcasting only after sequence validation
                await self._broadcast_update(symbol)
                return True
            return False
        except Exception as e:
            logger.error(f"Error processing update for {symbol}: {e}")
            return False
                
    async def _broadcast_snapshot(self, symbol: str):
        """Broadcast full order book snapshot via Ably."""
        if not self.ably_client:
            return
            
        try:
            order_book = orderbook_manager.get_or_create(symbol)
            data = order_book.get_top_levels(10)
            
            channel_name = f"orderbook:{symbol}"
            # Defensive check for ably_client again for type safety
            client = self.ably_client
            if client:
                channel = client.channels.get(channel_name)
                await channel.publish("snapshot", data)
                logger.debug(f"Broadcasted snapshot for {symbol}")
        except Exception as e:
            logger.error(f"Error broadcasting snapshot for {symbol}: {e}")
            
    async def _broadcast_update(self, symbol: str):
        """Broadcast order book update via Ably."""
        if not self.ably_client:
            return
            
        try:
            order_book = orderbook_manager.get_or_create(symbol)
            data = order_book.get_top_levels(10)
            
            channel_name = f"orderbook:{symbol}"
            # Defensive check for ably_client again for type safety
            client = self.ably_client
            if client:
                channel = client.channels.get(channel_name)
                await channel.publish("update", data)
        except Exception as e:
            logger.error(f"Error broadcasting update for {symbol}: {e}")


# Global instance
kucoin_orderbook_service = KuCoinOrderBookService()

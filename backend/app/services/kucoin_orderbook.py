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
        """
        try:
            # Step 1: Fetch full order book snapshot from REST API
            await self._fetch_snapshot(symbol)
            
            # Step 2: Get WebSocket connection details
            ws_details = await self._get_ws_details()
            if not ws_details:
                logger.error(f"Failed to get WebSocket details for {symbol}")
                return
                
            # Step 3: Connect to WebSocket and subscribe
            await self._connect_and_stream(symbol, ws_details)
            
        except asyncio.CancelledError:
            logger.info(f"Order book task cancelled for {symbol}")
        except Exception as e:
            logger.error(f"Error handling order book for {symbol}: {e}")
            
    async def _fetch_snapshot(self, symbol: str):
        """
        CRITICAL: Fetch full order book snapshot from KuCoin REST API.
        This MUST be called before processing any WebSocket updates.
        """
        try:
            url = f"{settings.KUCOIN_REST_BASE_URL}/api/v1/market/orderbook/level2_100"
            params = {"symbol": symbol}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") == "200000" and "data" in data:
                    snapshot = data["data"]
                    
                    # Apply snapshot to order book manager
                    order_book = orderbook_manager.get_or_create(symbol)
                    order_book.apply_snapshot(
                        bids=snapshot.get("bids", []),
                        asks=snapshot.get("asks", []),
                        sequence=int(snapshot.get("sequence", 0))
                    )
                    
                    # Broadcast initial snapshot via Ably
                    await self._broadcast_snapshot(symbol)
                    
                    logger.info(f"Fetched and applied snapshot for {symbol}")
                else:
                    logger.error(f"Invalid snapshot response for {symbol}: {data}")
                    
        except Exception as e:
            logger.error(f"Error fetching snapshot for {symbol}: {e}")
            
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
                    
        except Exception as e:
            logger.error(f"Error getting WebSocket details: {e}")
            
        return None
        
    async def _connect_and_stream(self, symbol: str, ws_details: Dict):
        """Connect to KuCoin WebSocket and stream order book updates."""
        token = ws_details.get("token")
        endpoint = ws_details["instanceServers"][0]["endpoint"]
        ws_url = f"{endpoint}?token={token}"
        
        try:
            async with websockets.connect(ws_url) as websocket:
                # Subscribe to order book topic
                subscribe_msg = {
                    "id": f"{symbol}-orderbook",
                    "type": "subscribe",
                    "topic": f"/market/level2:{symbol}",
                    "response": True
                }
                
                await websocket.send(json.dumps(subscribe_msg))
                logger.info(f"Subscribed to KuCoin WebSocket for {symbol}")
                
                # Start broadcast loop
                broadcast_task = asyncio.create_task(self._broadcast_loop(symbol))
                
                # Process messages
                async for message in websocket:
                    if symbol not in self.active_symbols:
                        break
                        
                    data = json.loads(message)
                    
                    if data.get("type") == "message":
                        await self._process_update(symbol, data)
                        
                # Cancel broadcast task
                broadcast_task.cancel()
                try:
                    await broadcast_task
                except asyncio.CancelledError:
                    pass
                    
        except Exception as e:
            logger.error(f"WebSocket error for {symbol}: {e}")
            
    async def _process_update(self, symbol: str, data: Dict):
        """Process incremental order book update from WebSocket."""
        try:
            if "data" not in data:
                return
                
            changes = data["data"].get("changes", {})
            
            # Apply update to order book
            order_book = orderbook_manager.get_or_create(symbol)
            order_book.apply_update(changes)
            
        except Exception as e:
            logger.error(f"Error processing update for {symbol}: {e}")
            
    async def _broadcast_loop(self, symbol: str):
        """Broadcast order book updates at configured interval."""
        while symbol in self.active_symbols:
            try:
                await self._broadcast_update(symbol)
                await asyncio.sleep(settings.ORDER_BOOK_UPDATE_INTERVAL / 1000.0)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in broadcast loop for {symbol}: {e}")
                
    async def _broadcast_snapshot(self, symbol: str):
        """Broadcast full order book snapshot via Ably."""
        if not self.ably_client:
            return
            
        try:
            order_book = orderbook_manager.get_or_create(symbol)
            data = order_book.get_top_levels(10)
            
            channel_name = f"orderbook:{symbol}"
            channel = self.ably_client.channels.get(channel_name)
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
            channel = self.ably_client.channels.get(channel_name)
            await channel.publish("update", data)
            
        except Exception as e:
            logger.error(f"Error broadcasting update for {symbol}: {e}")


# Global instance
kucoin_orderbook_service = KuCoinOrderBookService()

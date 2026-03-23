"""
In-memory order book state manager.
Maintains order book state and applies incremental updates.
"""
import logging
from typing import Dict, List, Optional
from collections import OrderedDict

logger = logging.getLogger(__name__)


class OrderBookLevel:
    """Represents a single price level in the order book."""
    def __init__(self, price: float, quantity: float):
        self.price = price
        self.quantity = quantity


class OrderBook:
    """Manages order book state for a single symbol."""
    
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.bids: OrderedDict[float, float] = OrderedDict()  # price -> quantity
        self.asks: OrderedDict[float, float] = OrderedDict()  # price -> quantity
        self.sequence = 0
        
    def apply_snapshot(self, bids: List[List[str]], asks: List[List[str]], sequence: int):
        """
        Apply a full order book snapshot.
        CRITICAL: This must be called before applying any incremental updates.
        
        Args:
            bids: List of [price, quantity] pairs
            asks: List of [price, quantity] pairs
            sequence: Sequence number for this snapshot
        """
        self.bids.clear()
        self.asks.clear()
        
        # Add bids (sorted descending by price)
        for bid_data in bids:
            # Handle different data formats: [price, quantity] or {price, quantity}
            if isinstance(bid_data, list):
                if len(bid_data) >= 2:
                    price = float(bid_data[0])
                    qty = float(bid_data[1])
                else:
                    logger.warning(f"Invalid bid data format in snapshot: {bid_data}")
                    continue
            elif isinstance(bid_data, dict):
                price = float(bid_data.get('price', 0))
                qty = float(bid_data.get('quantity', 0))
            else:
                logger.warning(f"Unknown bid data format in snapshot: {type(bid_data)} - {bid_data}")
                continue
                
            if qty > 0:
                self.bids[price] = qty
                
        # Add asks (sorted ascending by price)
        for ask_data in asks:
            # Handle different data formats: [price, quantity] or {price, quantity}
            if isinstance(ask_data, list):
                if len(ask_data) >= 2:
                    price = float(ask_data[0])
                    qty = float(ask_data[1])
                else:
                    logger.warning(f"Invalid ask data format in snapshot: {ask_data}")
                    continue
            elif isinstance(ask_data, dict):
                price = float(ask_data.get('price', 0))
                qty = float(ask_data.get('quantity', 0))
            else:
                logger.warning(f"Unknown ask data format in snapshot: {type(ask_data)} - {ask_data}")
                continue
                
            if qty > 0:
                self.asks[price] = qty
                
        # Sort order books
        self.bids = OrderedDict(sorted(self.bids.items(), reverse=True))
        self.asks = OrderedDict(sorted(self.asks.items()))
        
        self.sequence = sequence
        
        logger.info(f"Applied snapshot for {self.symbol}: {len(self.bids)} bids, {len(self.asks)} asks")
        
    def apply_update(self, changes: Dict):
        """
        Apply incremental order book update.
        
        Args:
            changes: Dict with 'bids' and 'asks' arrays of [price, quantity] pairs
        """
        # Update bids
        if 'bids' in changes:
            for bid_data in changes['bids']:
                # Handle different data formats: [price, quantity] or {price, quantity}
                if isinstance(bid_data, list):
                    if len(bid_data) >= 2:
                        price = float(bid_data[0])
                        qty = float(bid_data[1])
                    else:
                        logger.warning(f"Invalid bid data format: {bid_data}")
                        continue
                elif isinstance(bid_data, dict):
                    price = float(bid_data.get('price', 0))
                    qty = float(bid_data.get('quantity', 0))
                else:
                    logger.warning(f"Unknown bid data format: {type(bid_data)} - {bid_data}")
                    continue
                
                if qty == 0:
                    # Remove price level
                    self.bids.pop(price, None)
                else:
                    # Update price level
                    self.bids[price] = qty
                    
            # Re-sort bids
            self.bids = OrderedDict(sorted(self.bids.items(), reverse=True))
            
        # Update asks
        if 'asks' in changes:
            for ask_data in changes['asks']:
                # Handle different data formats: [price, quantity] or {price, quantity}
                if isinstance(ask_data, list):
                    if len(ask_data) >= 2:
                        price = float(ask_data[0])
                        qty = float(ask_data[1])
                    else:
                        logger.warning(f"Invalid ask data format: {ask_data}")
                        continue
                elif isinstance(ask_data, dict):
                    price = float(ask_data.get('price', 0))
                    qty = float(ask_data.get('quantity', 0))
                else:
                    logger.warning(f"Unknown ask data format: {type(ask_data)} - {ask_data}")
                    continue
                
                if qty == 0:
                    # Remove price level
                    self.asks.pop(price, None)
                else:
                    # Update price level
                    self.asks[price] = qty
                    
            # Re-sort asks
            self.asks = OrderedDict(sorted(self.asks.items()))
            
    def get_top_levels(self, depth: int = 10) -> Dict:
        """
        Get top N levels of bids and asks.
        
        Args:
            depth: Number of levels to return
            
        Returns:
            Dict with 'bids' and 'asks' arrays
        """
        bids_list = [
            {"price": price, "quantity": qty}
            for price, qty in list(self.bids.items())[:depth]
        ]
        
        asks_list = [
            {"price": price, "quantity": qty}
            for price, qty in list(self.asks.items())[:depth]
        ]
        
        return {
            "bids": bids_list,
            "asks": asks_list,
            "sequence": self.sequence
        }


class OrderBookManager:
    """Manages order books for multiple symbols."""
    
    def __init__(self):
        self.order_books: Dict[str, OrderBook] = {}
        
    def get_or_create(self, symbol: str) -> OrderBook:
        """Get existing order book or create new one."""
        if symbol not in self.order_books:
            self.order_books[symbol] = OrderBook(symbol)
        return self.order_books[symbol]
        
    def remove(self, symbol: str):
        """Remove order book for symbol."""
        if symbol in self.order_books:
            del self.order_books[symbol]
            logger.info(f"Removed order book for {symbol}")


# Global instance
orderbook_manager = OrderBookManager()

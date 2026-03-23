"""
Symbol format conversion utility for different trading APIs.
"""


def to_kucoin(symbol: str) -> str:
    """
    Convert symbol to KuCoin format (BTC-USDT).
    
    Args:
        symbol: Symbol in any format (BTCUSDT, BTC/USDT, etc.)
        
    Returns:
        KuCoin format with hyphen separator
    """
    # Remove any existing separators
    clean = symbol.replace('-', '').replace('/', '')
    
    # Common quote currencies
    quotes = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB']
    
    for quote in quotes:
        if clean.endswith(quote):
            base = clean[:-len(quote)]
            return f"{base}-{quote}"
    
    # Default: assume last 4 chars are quote (USDT)
    return f"{clean[:-4]}-{clean[-4:]}"


def to_twelve_data(symbol: str) -> str:
    """
    Convert symbol to Twelve Data format (BTC/USD).
    
    Args:
        symbol: Symbol in any format
        
    Returns:
        Twelve Data format with slash separator, no T suffix
    """
    # Remove any existing separators
    clean = symbol.replace('-', '').replace('/', '')
    
    # Common quote currencies (remove T suffix for Twelve Data)
    quotes = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB']
    
    for quote in quotes:
        if clean.endswith(quote):
            base = clean[:-len(quote)]
            # Remove T suffix from quote for Twelve Data
            quote_clean = quote.replace('T', '')
            return f"{base}/{quote_clean}"
    
    # Default: assume last 4 chars are quote
    base = clean[:-4]
    quote = clean[-4:].replace('T', '')
    return f"{base}/{quote}"


def to_tradingview(symbol: str, exchange: str = 'BINANCE') -> str:
    """
    Convert symbol to TradingView format (BINANCE:BTCUSDT).
    
    Args:
        symbol: Symbol in any format
        exchange: Exchange name (default: BINANCE)
        
    Returns:
        TradingView format with exchange prefix
    """
    # Remove any existing separators
    clean = symbol.replace('-', '').replace('/', '')
    return f"{exchange.upper()}:{clean}"


def to_internal(symbol: str) -> str:
    """
    Convert symbol to internal format (BTCUSDT - no separator).
    
    Args:
        symbol: Symbol in any format
        
    Returns:
        Internal format without separators
    """
    return symbol.replace('-', '').replace('/', '')


def to_display(symbol: str) -> str:
    """
    Format symbol for display (BTC/USDT).
    
    Args:
        symbol: Symbol in any format
        
    Returns:
        Display format with slash separator
    """
    clean = symbol.replace('-', '').replace('/', '')
    
    quotes = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB']
    
    for quote in quotes:
        if clean.endswith(quote):
            base = clean[:-len(quote)]
            return f"{base}/{quote}"
    
    # Default: assume last 4 chars are quote
    return f"{clean[:-4]}/{clean[-4:]}"

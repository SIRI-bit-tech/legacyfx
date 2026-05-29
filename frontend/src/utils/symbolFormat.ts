// Symbol format conversion utility for different trading APIs

/**
 * Convert symbol to KuCoin format (BTC-USDT)
 * @param symbol - Symbol in any format (BTCUSDT, BTC/USDT, etc.)
 * @returns KuCoin format with hyphen separator
 */
export function toKuCoin(symbol: string): string {
  // Remove any existing separators
  const clean = symbol.replace(/[-\/]/g, '');
  
  // Common quote currencies
  const quotes = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB'];
  
  for (const quote of quotes) {
    if (clean.endsWith(quote)) {
      const base = clean.slice(0, -quote.length);
      return `${base}-${quote}`;
    }
  }
  
  // Default: assume last 4 chars are quote (USDT)
  return `${clean.slice(0, -4)}-${clean.slice(-4)}`;
}

/**
 * Convert symbol to Twelve Data format (BTC/USD)
 * @param symbol - Symbol in any format
 * @returns Twelve Data format with slash separator, no T suffix
 */
export function toTwelveData(symbol: string): string {
  // Remove any existing separators
  const clean = symbol.replace(/[-\/]/g, '');
  
  // Common quote currencies (remove T suffix for Twelve Data)
  const quotes = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB'];
  
  for (const quote of quotes) {
    if (clean.endsWith(quote)) {
      const base = clean.slice(0, -quote.length);
      // Remove T suffix from quote for Twelve Data
      const quoteClean = quote.replace('T', '');
      return `${base}/${quoteClean}`;
    }
  }
  
  // Default: assume last 4 chars are quote
  const base = clean.slice(0, -4);
  const quote = clean.slice(-4).replace('T', '');
  return `${base}/${quote}`;
}

/**
 * Convert symbol to TradingView format (BINANCE:BTCUSDT)
 * @param symbol - Symbol in any format
 * @param exchange - Exchange name (default: BINANCE)
 * @returns TradingView format with exchange prefix
 */
export function toTradingView(symbol: string, exchange: string = 'BINANCE'): string {
  // Remove any existing separators
  const clean = symbol.replace(/[-\/]/g, '');
  return `${exchange.toUpperCase()}:${clean}`;
}

/**
 * Convert symbol to internal format (BTCUSDT - no separator)
 * @param symbol - Symbol in any format
 * @returns Internal format without separators
 */
export function toInternal(symbol: string): string {
  return symbol.replace(/[-\/]/g, '');
}

/**
 * Format symbol for display (BTC/USDT)
 * @param symbol - Symbol in any format
 * @returns Display format with slash separator
 */
export function toDisplay(symbol: string): string {
  const clean = symbol.replace(/[-\/]/g, '');
  
  const quotes = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB'];
  
  for (const quote of quotes) {
    if (clean.endsWith(quote)) {
      const base = clean.slice(0, -quote.length);
      return `${base}/${quote}`;
    }
  }
  
  // Default: assume last 4 chars are quote
  return `${clean.slice(0, -4)}/${clean.slice(-4)}`;
}

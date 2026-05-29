import logging
from typing import Dict, Any
from app.services.mining_data import mining_data_service

logger = logging.getLogger(__name__)

class ProfitCalculator:
    """Calculate real-time mining profits based on current market conditions."""
    
    # Realistic daily profit percentages based on hashrate efficiency
    HASHRATE_PROFIT_RATES = {
        "BTC": {  # Bitcoin SHA-256
            "10 TH/s": 0.00000085,    # ~$0.06/day at $71k BTC
            "20 TH/s": 0.0000017,     # ~$0.12/day
            "50 TH/s": 0.00000425,    # ~$0.30/day
            "120 TH/s": 0.0000102,   # ~$0.72/day
            "200 TH/s": 0.000017,      # ~$1.20/day
        },
        "LTC": {  # Litecoin Scrypt
            "500 MH/s": 0.015,        # ~$0.84/day at $56 LTC
            "2.5 GH/s": 0.075,       # ~$4.20/day
            "5 GH/s": 0.15,           # ~$8.40/day
        },
        "DOGE": {  # Dogecoin Scrypt
            "1 GH/s": 15.0,           # ~$1.05/day at $0.07 DOGE
            "5 GH/s": 75.0,            # ~$5.25/day
        },
        "BCH": {  # Bitcoin Cash SHA-256
            "15 TH/s": 0.000095,      # ~$0.043/day at $456 BCH
            "75 TH/s": 0.000475,       # ~$0.215/day
        }
    }
    
    @staticmethod
    async def calculate_real_profit(plan: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate real-time profit based on current market price."""
        try:
            coin_symbol = plan["coin_symbol"]
            hashrate = plan["hashrate"]
            duration_days = plan["duration_days"]
            
            # Get current market price
            stats = await mining_data_service.fetch_network_stats(coin_symbol)
            current_price = stats.get("market_price_usd", 0)
            
            if current_price == 0:
                logger.warning(f"No price data for {coin_symbol}")
                # Return plan with zero profits instead of hardcoded values
                return {
                    **plan,
                    "daily_coin_amount": 0,
                    "daily_usd_profit": 0,
                    "total_coin_profit": 0,
                    "total_usd_profit": 0,
                    "roi_percentage": 0,
                    "current_price": 0
                }
            
            # Get daily coin amount based on hashrate
            profit_rates = ProfitCalculator.HASHRATE_PROFIT_RATES.get(coin_symbol, {})
            daily_coin_amount = profit_rates.get(hashrate, 0)
            
            if daily_coin_amount == 0:
                # No predefined rate for this hashrate - return zero profits
                logger.warning(f"No profit rate for {coin_symbol} {hashrate}")
                return {
                    **plan,
                    "daily_coin_amount": 0,
                    "daily_usd_profit": 0,
                    "total_coin_profit": 0,
                    "total_usd_profit": 0,
                    "roi_percentage": 0,
                    "current_price": current_price
                }
            
            # Calculate profits
            daily_usd_profit = daily_coin_amount * current_price
            total_coin_profit = daily_coin_amount * duration_days
            total_usd_profit = daily_usd_profit * duration_days
            
            # Calculate ROI
            roi_percentage = round((total_usd_profit / plan["price"]) * 100, 1) if plan["price"] > 0 else 0
            
            return {
                **plan,
                "daily_coin_amount": daily_coin_amount,
                "daily_usd_profit": round(daily_usd_profit, 4),
                "total_coin_profit": round(total_coin_profit, 4),
                "total_usd_profit": round(total_usd_profit, 2),
                "roi_percentage": roi_percentage,
                "current_price": current_price
            }
            
        except Exception as e:
            logger.error(f"Error calculating profit: {str(e)}")
            # Return plan with zero profits on error
            return {
                **plan,
                "daily_coin_amount": 0,
                "daily_usd_profit": 0,
                "total_coin_profit": 0,
                "total_usd_profit": 0,
                "roi_percentage": 0,
                "current_price": 0
            }

profit_calculator = ProfitCalculator()

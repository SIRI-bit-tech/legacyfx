"""
Account helper functions
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def calculate_portfolio_value(holdings: list) -> float:
    """Calculate total portfolio value"""
    total = 0
    for holding in holdings:
        if isinstance(holding, dict) and "value" in holding:
            total += holding["value"]
    return total


def calculate_pnl(entry_price: float, exit_price: float, quantity: float) -> tuple[float, float]:
    """Calculate profit/loss and percentage"""
    if entry_price <= 0:
        return 0, 0
    
    pnl = (exit_price - entry_price) * quantity
    pnl_percentage = ((exit_price - entry_price) / entry_price) * 100
    
    return pnl, pnl_percentage


def get_account_tier(volume: float) -> str:
    """Determine account tier based on trading volume"""
    if volume >= 1000000:
        return "VIP"
    elif volume >= 100000:
        return "GOLD"
    elif volume >= 10000:
        return "SILVER"
    else:
        return "BRONZE"

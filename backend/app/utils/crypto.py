"""
Cryptocurrency utility functions
"""
import hashlib
import secrets
from typing import Tuple


def validate_crypto_address(address: str, network: str) -> bool:
    """Validate cryptocurrency address format"""
    if not address:
        return False
    
    # Basic validation - can be extended per network
    if network.lower() == "bitcoin":
        return len(address) in [26, 35, 42] and address[0] in ['1', '3', 'b']
    elif network.lower() in ["ethereum", "bsc", "polygon"]:
        return len(address) == 42 and address.startswith("0x")
    
    return False


def generate_deposit_address() -> str:
    """Generate a unique deposit address"""
    return f"0x{secrets.token_hex(20)}"


def validate_private_key(key: str) -> bool:
    """Validate private key format"""
    if not key:
        return False
    try:
        # Basic validation - should be 64 hex characters for Ethereum
        return len(key) == 64 and all(c in '0123456789abcdefABCDEF' for c in key)
    except Exception:
        return False


def hash_address(address: str) -> str:
    """Hash a wallet address for storage"""
    return hashlib.sha256(address.encode()).hexdigest()

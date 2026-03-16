"""
IP address and geolocation utilities
"""
from starlette.requests import Request


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    # Check X-Forwarded-For header first (for proxies)
    if request.headers.get("x-forwarded-for"):
        return request.headers.get("x-forwarded-for").split(",")[0].strip()
    
    # Fall back to client host
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """Extract user agent from request"""
    return request.headers.get("user-agent", "unknown")


def is_valid_ip(ip_address: str) -> bool:
    """Validate IP address format"""
    import ipaddress
    try:
        ipaddress.ip_address(ip_address)
        return True
    except ValueError:
        return False

"""
Custom exception classes for API errors
"""


class APIError(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(self.message)


class AuthenticationError(APIError):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, 401, "AUTH_ERROR")


class AuthorizationError(APIError):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, 403, "AUTHZ_ERROR")


class NotFoundError(APIError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404, "NOT_FOUND")


class ValidationError(APIError):
    def __init__(self, message: str = "Invalid input"):
        super().__init__(message, 422, "VALIDATION_ERROR")


class ConflictError(APIError):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, 409, "CONFLICT")


class InsufficientFundsError(APIError):
    def __init__(self, message: str = "Insufficient funds"):
        super().__init__(message, 400, "INSUFFICIENT_FUNDS")


class RateLimitError(APIError):
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, 429, "RATE_LIMIT")


class ServiceUnavailableError(APIError):
    def __init__(self, message: str = "Service unavailable"):
        super().__init__(message, 503, "SERVICE_UNAVAILABLE")

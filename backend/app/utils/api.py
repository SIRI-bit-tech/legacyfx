from fastapi import HTTPException, status
from typing import Any, Dict


class APIResponse:
    """Standard API response format."""
    
    @staticmethod
    def success(data: Any = None, message: str = "", status_code: int = 200) -> Dict:
        return {
            "success": True,
            "data": data,
            "message": message,
            "status": status_code,
        }
    
    @staticmethod
    def error(
        message: str,
        code: str = "ERROR",
        details: Dict = None,
        status_code: int = 400
    ) -> Dict:
        return {
            "success": False,
            "error": message,
            "code": code,
            "details": details or {},
            "status": status_code,
        }


def raise_exception(
    message: str,
    code: str = "ERROR",
    details: Dict = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
):
    """Raise HTTPException with standard format."""
    raise HTTPException(
        status_code=status_code,
        detail=APIResponse.error(message, code, details, status_code)
    )


def raise_not_found(resource: str = "Resource"):
    """Raise 404 not found exception."""
    raise_exception(
        f"{resource} not found",
        code="NOT_FOUND",
        status_code=status.HTTP_404_NOT_FOUND
    )


def raise_unauthorized(message: str = "Unauthorized"):
    """Raise 401 unauthorized exception."""
    raise_exception(
        message,
        code="UNAUTHORIZED",
        status_code=status.HTTP_401_UNAUTHORIZED
    )


def raise_forbidden(message: str = "Forbidden"):
    """Raise 403 forbidden exception."""
    raise_exception(
        message,
        code="FORBIDDEN",
        status_code=status.HTTP_403_FORBIDDEN
    )


def raise_unprocessable(message: str, details: Dict = None):
    """Raise 422 unprocessable entity exception."""
    raise_exception(
        message,
        code="UNPROCESSABLE_ENTITY",
        details=details,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )

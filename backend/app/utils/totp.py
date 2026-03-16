"""
Time-based One-Time Password utilities for 2FA
"""
import pyotp
import qrcode
from io import BytesIO
import base64


def generate_totp_secret() -> str:
    """Generate a new TOTP secret"""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "Legacy FX") -> str:
    """Get provisioning URI for TOTP"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=email,
        issuer_name=issuer
    )


def generate_qr_code(uri: str) -> str:
    """Generate QR code for TOTP setup"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"


def verify_totp_token(secret: str, token: str) -> bool:
    """Verify a TOTP token"""
    totp = pyotp.TOTP(secret)
    return totp.verify(token)


def generate_backup_codes(count: int = 10) -> list[str]:
    """Generate backup codes for 2FA"""
    return [f"{secrets.randbelow(1000000):06d}" for _ in range(count)]


import secrets

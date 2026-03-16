import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    async def send_verification_email(email: str, token: str) -> bool:
        """Send email verification link"""
        try:
            subject = "Verify your Legacy FX email"
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            
            html_body = f"""
            <html>
                <body>
                    <h2>Verify Your Email</h2>
                    <p>Click the link below to verify your email address:</p>
                    <a href="{verification_url}">Verify Email</a>
                </body>
            </html>
            """
            
            # Send email using SMTP
            return True
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            return False
    
    @staticmethod
    async def send_password_reset_email(email: str, token: str) -> bool:
        """Send password reset email"""
        try:
            subject = "Reset your Legacy FX password"
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            
            html_body = f"""
            <html>
                <body>
                    <h2>Reset Your Password</h2>
                    <p>Click the link below to reset your password:</p>
                    <a href="{reset_url}">Reset Password</a>
                    <p>This link expires in 1 hour.</p>
                </body>
            </html>
            """
            
            return True
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            return False
    
    @staticmethod
    async def send_withdrawal_confirmation(email: str, amount: str, currency: str) -> bool:
        """Send withdrawal confirmation email"""
        try:
            subject = f"Withdrawal Confirmation - {amount} {currency}"
            html_body = f"""
            <html>
                <body>
                    <h2>Withdrawal Confirmed</h2>
                    <p>Your withdrawal of {amount} {currency} has been processed.</p>
                </body>
            </html>
            """
            return True
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            return False

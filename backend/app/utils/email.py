"""
Email sending utilities
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)


def create_email_template(title: str, code: str = None, message: str = None, validity_minutes: int = 15) -> str:
    """Create a professional HTML email template matching Binance style"""
    
    code_section = ""
    if code:
        code_section = f"""
        <tr>
            <td align="center" style="padding: 30px 20px;">
                <p style="color: #999999; font-size: 14px; margin: 0 0 15px 0;">Your verification code</p>
                <div style="background-color: #1f1f1f; border: 2px solid #D4AF37; padding: 20px; border-radius: 8px; display: inline-block;">
                    <p style="color: #D4AF37; font-size: 48px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">{code}</p>
                </div>
                <p style="color: #999999; font-size: 12px; margin: 15px 0 0 0;">Valid for {validity_minutes} minutes</p>
            </td>
        </tr>
        """
    
    message_section = ""
    if message:
        message_section = f"""
        <tr>
            <td style="padding: 20px 30px;">
                <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin: 0;">
                    {message}
                </p>
            </td>
        </tr>
        """
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; background-color: #0a0a0a; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" style="width: 100%; max-width: 600px; background-color: #1a1a1a; border: 1px solid #333333; border-radius: 8px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background: linear-gradient(135deg, #D4AF37 0%, #aa8c2f 100%); padding: 30px 20px;">
                                <div style="font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">
                                    ⬢ LEGACY FX
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Title -->
                        <tr>
                            <td align="center" style="padding: 30px 20px 10px 20px;">
                                <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: bold;">{title}</h1>
                            </td>
                        </tr>
                        
                        <!-- Code Section -->
                        {code_section}
                        
                        <!-- Message Section -->
                        {message_section}
                        
                        <!-- Security Notice -->
                        <tr>
                            <td style="padding: 20px 30px;">
                                <div style="background-color: #2a2a2a; border-left: 4px solid #D4AF37; padding: 15px; border-radius: 4px;">
                                    <p style="color: #D4AF37; font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">🔒 SECURITY NOTICE</p>
                                    <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.5;">
                                        Do not share this code with anyone. Legacy FX staff will never ask for your verification code.
                                        <br><br>
                                        If you didn't request this code, you can safely ignore this email.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px 20px; border-top: 1px solid #333333; text-align: center;">
                                <p style="color: #666666; font-size: 12px; margin: 0 0 15px 0;">
                                    Follow us on social media
                                </p>
                                <div style="margin-bottom: 20px;">
                                    <a href="#" style="display: inline-block; margin: 0 10px; color: #D4AF37; text-decoration: none; font-size: 14px;">Twitter</a>
                                    <a href="#" style="display: inline-block; margin: 0 10px; color: #D4AF37; text-decoration: none; font-size: 14px;">Facebook</a>
                                    <a href="#" style="display: inline-block; margin: 0 10px; color: #D4AF37; text-decoration: none; font-size: 14px;">Instagram</a>
                                </div>
                                <p style="color: #555555; font-size: 11px; margin: 0;">
                                    © 2026 Legacy FX. All rights reserved.
                                    <br>
                                    This is an automated message, please do not reply.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Disclaimer -->
                        <tr>
                            <td style="padding: 20px 30px; background-color: #0f0f0f; border-top: 1px solid #333333;">
                                <p style="color: #444444; font-size: 10px; margin: 0; line-height: 1.5;">
                                    <strong>Disclaimer:</strong> Digital asset prices are subject to high market risk and price volatility. The value of your investment may go down or up. Legacy FX is not responsible for any losses incurred.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def send_email(recipient: str, subject: str, html_body: str) -> bool:
    """Send email via SMTP"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = recipient
        
        msg.attach(MIMEText(html_body, "html"))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, recipient, msg.as_string())
        
        logger.info(f"Email sent to {recipient}")
        return True
    except Exception as e:
        logger.error(f"Email sending error: {e}")
        return False

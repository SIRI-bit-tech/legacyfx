from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://localhost/legacyfx"
    REDIS_URL: str = "redis://localhost:6379"

    # Better Auth
    BETTER_AUTH_SECRET: str = "default_secret_min_32_chars_long_here"
    BETTER_AUTH_BASE_URL: str = "http://localhost:3000"

    # API Keys
    COINGECKO_API_KEY: str = ""
    BINANCE_API_KEY: str = ""
    BINANCE_SECRET_KEY: str = ""

    # Twelve Data
    TWELVE_DATA_API_KEY: str = ""
    TWELVE_DATA_BASE_URL: str = "https://api.twelvedata.com"

    # KuCoin
    KUCOIN_API_KEY: str = ""
    KUCOIN_API_SECRET: str = ""
    KUCOIN_API_PASSPHRASE: str = ""
    KUCOIN_WS_BASE_URL: str = "wss://ws-api.kucoin.com"
    KUCOIN_REST_BASE_URL: str = "https://api.kucoin.com"

    # Bybit
    BYBIT_API_KEY: str = ""
    BYBIT_SECRET_KEY: str = ""
    BYBIT_API_URL: str = "https://api.bybit.com"

    # Ably
    ABLY_API_KEY: str = ""
    ABLY_KEY: str = ""
    ABLY_CLIENT_ID: str = "trade-server"

    # Trading Configuration
    PRICE_UPDATE_INTERVAL: int = 3000
    ORDER_BOOK_UPDATE_INTERVAL: int = 250

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Email
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@legacyfx.com"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    EMAIL_FROM: str = "noreply@legacyfx.com"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Security
    SECRET_KEY: str = "default_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ENCRYPTION_KEY: str = ""
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 900
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Session
    SESSION_TIMEOUT_MINUTES: int = 15
    SESSION_WARNING_MINUTES: int = 14
    MAX_LOGIN_ATTEMPTS: int = 10
    LOGIN_LOCKOUT_MINUTES: int = 30
    TOTP_ISSUER: str = "Legacy FX"

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60
    RATE_LIMIT_PER_MINUTE: int = 60

    # API Server
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Admin Portal
    ADMIN_REGISTRATION_CODE: str = "LEGACY_ADMIN_2024"
    UPLOADTHING_SECRET: str = ""
    UPLOADTHING_APP_ID: str = ""

    # Real Estate
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_REALTY_HOST: str = "realty-in-us.p.rapidapi.com"
    RAPIDAPI_REALTY_BASE_URL: str = "https://realty-in-us.p.rapidapi.com"
    
    # RealtyAPI (realtyapi.io)
    REALTY_API_KEY: str = ""
    REALTY_API_BASE_URL: str = "https://realtyapi.io/v1"
    
    REAL_ESTATE_CACHE_TTL: int = 3600

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

"""
Cloudinary file storage integration
"""
import cloudinary
import cloudinary.uploader
import logging
from config import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)


async def upload_file(file_bytes: bytes, filename: str, folder: str = "legacy-fx") -> str:
    """Upload file to Cloudinary"""
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            public_id=filename,
            overwrite=True
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        return None


async def upload_avatar(file_bytes: bytes, user_id: str) -> str:
    """Upload user avatar"""
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="avatars",
            public_id=f"user-{user_id}",
            overwrite=True,
            transformation=[
                {"width": 200, "height": 200, "crop": "fill"}
            ]
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Avatar upload error: {e}")
        return None


async def upload_kyc_document(file_bytes: bytes, user_id: str, doc_type: str) -> str:
    """Upload KYC document"""
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="kyc-documents",
            public_id=f"kyc-{user_id}-{doc_type}",
            overwrite=True,
            resource_type="auto"
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"KYC document upload error: {e}")
        return None


async def delete_file(public_id: str) -> bool:
    """Delete file from Cloudinary"""
    try:
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception as e:
        logger.error(f"Cloudinary delete error: {e}")
        return False

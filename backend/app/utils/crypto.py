"""
Fernet symmetric encryption for GitHub OAuth tokens stored in the DB.
Key must be a URL-safe base64-encoded 32-byte value (use Fernet.generate_key()).
"""
from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        if not settings.FERNET_KEY:
            raise RuntimeError("FERNET_KEY is not set in environment")
        _fernet = Fernet(settings.FERNET_KEY.encode())
    return _fernet


def encrypt_token(plain: str) -> str:
    """Encrypt a plaintext token string; returns a URL-safe base64 string."""
    return _get_fernet().encrypt(plain.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    """Decrypt a previously encrypted token; raises ValueError on bad token."""
    try:
        return _get_fernet().decrypt(encrypted.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Token decryption failed — key mismatch or tampered data") from exc

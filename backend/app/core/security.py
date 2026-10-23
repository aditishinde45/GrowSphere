"""
JWT authentication and password hashing utilities.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# Cached JWKS client for Neon Auth verification
_jwks_client: Optional[jwt.PyJWKClient] = None


def get_neon_jwks_client() -> Optional[jwt.PyJWKClient]:
    global _jwks_client
    if _jwks_client is None and getattr(settings, "NEON_AUTH_JWKS_URL", None):
        try:
            _jwks_client = jwt.PyJWKClient(settings.NEON_AUTH_JWKS_URL, cache_keys=True)
        except Exception:
            pass
    return _jwks_client


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT. Supports internal tokens and Neon Auth tokens."""
    # 1. Try internal GrowSphere token
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError as internal_err:
        # 2. Try Neon Auth JWKS if available
        jwks = get_neon_jwks_client()
        if jwks:
            try:
                signing_key = jwks.get_signing_key_from_jwt(token)
                return jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["EdDSA", "RS256", "ES256"],
                    options={"verify_aud": False},
                )
            except Exception:
                pass
        raise internal_err

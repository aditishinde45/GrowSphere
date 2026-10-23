"""
FastAPI dependencies for authentication and authorization.
"""

from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User, UserRole

security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract and verify the current user from a Bearer token."""
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate token")

    # Support both integer user IDs (GrowSphere internal) and string/email (Neon Auth)
    if str(user_id).isdigit():
        user = db.query(User).filter(User.id == int(user_id)).first()
    else:
        email = payload.get("email") or str(user_id)
        user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")
    return user


security_optional = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional),
    db: Session = Depends(get_db),
):
    """Optionally extract current user without requiring authentication."""
    if not credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            return None
        if str(user_id).isdigit():
            return db.query(User).filter(User.id == int(user_id)).first()
        email = payload.get("email") or str(user_id)
        return db.query(User).filter(User.email == email).first()
    except Exception:
        return None


def require_roles(*roles: UserRole):
    """Factory for role-based access control dependency."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {[r.value for r in roles]}",
            )
        return current_user
    return role_checker


# Convenience dependencies for common role checks
require_student = require_roles(UserRole.STUDENT)
require_employee = require_roles(UserRole.EMPLOYEE)
require_seller = require_roles(UserRole.SELLER)
require_mentor = require_roles(UserRole.MENTOR)
require_admin = require_roles(UserRole.ADMIN)
require_learner = require_roles(UserRole.STUDENT, UserRole.EMPLOYEE)

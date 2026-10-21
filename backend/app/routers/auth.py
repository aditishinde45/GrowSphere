"""
Authentication router — register, login, and user profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models import User, UserRole, StudentProfile, EmployeeProfile, SellerProfile, MentorProfile, AuditLog
from app.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user and return an access token."""
    # Check for existing user
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Create user
    user = User(
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name.strip(),
        role=UserRole(data.role),
    )
    db.add(user)
    db.flush()  # Get user.id

    # Create role-specific profile
    if user.role == UserRole.STUDENT:
        db.add(StudentProfile(user_id=user.id))
    elif user.role == UserRole.EMPLOYEE:
        db.add(EmployeeProfile(user_id=user.id))
    elif user.role == UserRole.SELLER:
        db.add(SellerProfile(user_id=user.id, display_name=user.full_name))
    elif user.role == UserRole.MENTOR:
        db.add(MentorProfile(user_id=user.id, display_name=user.full_name))

    # Audit log
    db.add(AuditLog(user_id=user.id, action="user.register", details={"role": data.role}))

    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return an access token."""
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    db.add(AuditLog(user_id=user.id, action="user.login"))
    db.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user."""
    return UserOut.model_validate(current_user)

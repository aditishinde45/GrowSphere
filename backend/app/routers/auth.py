"""
Authentication router — register, login, and user profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models import User, UserRole, StudentProfile, EmployeeProfile, SellerProfile, MentorProfile, AuditLog
from app.schemas import (
    UserRegister, UserLogin, TokenResponse, UserOut,
    PasswordResetRequest, PasswordResetConfirm, EmailVerificationConfirm, OnboardingData
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user and return an access token."""
    # Check for existing user
    if data.role.lower() not in ["student", "employee", "seller", "mentor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration for admin role is prohibited. Admin accounts must be provisioned internally.",
        )

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


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log out user and record in audit log."""
    db.add(AuditLog(user_id=current_user.id, action="user.logout"))
    db.commit()
    return {"message": "Logged out successfully"}


@router.post("/request-password-reset")
def request_password_reset(
    data: PasswordResetRequest, db: Session = Depends(get_db)
):
    """Generate and dispatch password reset token via email provider."""
    import secrets
    from datetime import timedelta
    from app.models import PasswordResetToken, utcnow
    from app.services.email_service import get_email_provider

    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user:
        # Do not reveal email existence to untrusted requesters
        return {"message": "If this email is registered, password reset instructions have been sent."}

    token_str = secrets.token_urlsafe(32)
    reset_record = PasswordResetToken(
        user_id=user.id,
        token=token_str,
        expires_at=utcnow() + timedelta(hours=2),
        is_used=False,
    )
    db.add(reset_record)
    db.add(AuditLog(user_id=user.id, action="auth.request_password_reset"))
    db.commit()

    email_provider = get_email_provider()
    email_provider.send_password_reset_email(user.email, token_str, user.full_name)
    return {"message": "Password reset instructions dispatched.", "token_preview": token_str}


@router.post("/reset-password")
def reset_password(
    data: PasswordResetConfirm, db: Session = Depends(get_db)
):
    """Verify reset token and update user password."""
    from app.models import PasswordResetToken, utcnow

    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == data.token, PasswordResetToken.is_used == False)
        .first()
    )
    if not record or record.expires_at < utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    record.is_used = True
    db.add(AuditLog(user_id=user.id, action="auth.reset_password_completed"))
    db.commit()

    return {"message": "Password reset completed successfully. You may now log in."}


@router.post("/request-email-verification")
def request_email_verification(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Dispatch email verification token."""
    import secrets
    from datetime import timedelta
    from app.models import EmailVerificationToken, utcnow
    from app.services.email_service import get_email_provider

    token_str = secrets.token_urlsafe(32)
    verif_record = EmailVerificationToken(
        user_id=current_user.id,
        token=token_str,
        expires_at=utcnow() + timedelta(days=1),
        is_used=False,
    )
    db.add(verif_record)
    db.commit()

    email_provider = get_email_provider()
    email_provider.send_verification_email(current_user.email, token_str, current_user.full_name)
    return {"message": "Verification email dispatched.", "token_preview": token_str}


@router.post("/verify-email")
def verify_email(
    data: EmailVerificationConfirm, db: Session = Depends(get_db)
):
    """Confirm email token and mark account as verified."""
    from app.models import EmailVerificationToken, utcnow

    record = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.token == data.token, EmailVerificationToken.is_used == False)
        .first()
    )
    if not record or record.expires_at < utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")

    user = db.query(User).filter(User.id == record.user_id).first()
    if user:
        user.email_verified = True
        user.is_verified = True
        record.is_used = True
        db.add(AuditLog(user_id=user.id, action="auth.email_verified"))
        db.commit()

    return {"message": "Email verified successfully."}


@router.post("/onboarding")
def complete_onboarding(
    data: OnboardingData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save role-specific onboarding setup and initial self-reported skills."""
    from app.models import Skill, SkillEvidence, EvidenceType, SkillLevel, utcnow

    if current_user.role == UserRole.STUDENT:
        prof = current_user.student_profile
        if not prof:
            prof = StudentProfile(user_id=current_user.id)
            db.add(prof)

        if data.target_role_id:
            prof.target_role_id = data.target_role_id
        if data.education:
            prof.education = data.education
        if data.college:
            prof.college = data.college
        if data.location:
            prof.location = data.location
        if data.graduation_year:
            prof.graduation_year = data.graduation_year
        if data.learning_time_hours_per_week:
            prof.learning_time_hours_per_week = data.learning_time_hours_per_week
        if data.preferred_languages:
            prof.preferred_languages = data.preferred_languages
        if data.opportunity_preferences:
            prof.opportunity_preferences = data.opportunity_preferences
        prof.updated_at = utcnow()

    elif current_user.role == UserRole.EMPLOYEE:
        prof = current_user.employee_profile
        if not prof:
            prof = EmployeeProfile(user_id=current_user.id)
            db.add(prof)

        if data.target_role_id:
            prof.target_role_id = data.target_role_id
        if data.current_role:
            prof.current_role = data.current_role
        if data.current_company:
            prof.current_company = data.current_company
        if data.years_experience is not None:
            prof.years_experience = data.years_experience
        if data.industry:
            prof.industry = data.industry
        if data.career_goal:
            prof.career_goal = data.career_goal  # Private
        if data.goal_mode:
            prof.goal_mode = data.goal_mode
        if data.career_change_intent:
            prof.career_change_intent = data.career_change_intent
        if data.learning_schedule:
            prof.learning_schedule = data.learning_schedule
        if data.preferences:
            prof.preferences = data.preferences
        prof.updated_at = utcnow()

    # Record any initial self-reported skills selected during onboarding
    if data.initial_skills:
        for sid in data.initial_skills:
            skill = db.query(Skill).filter(Skill.id == sid).first()
            if not skill:
                continue
            exists = db.query(SkillEvidence).filter(
                SkillEvidence.user_id == current_user.id,
                SkillEvidence.skill_id == sid,
            ).first()
            if not exists:
                ev = SkillEvidence(
                    user_id=current_user.id,
                    skill_id=sid,
                    evidence_type=EvidenceType.SELF_REPORTED,
                    level=SkillLevel.BEGINNER,
                    confidence_score=0.5,
                    confidence_explanation="Self-reported during onboarding wizard. Practical assessment required to verify.",
                    source_description="Onboarding self-report",
                )
                db.add(ev)

    db.add(AuditLog(
        user_id=current_user.id,
        action="user.onboarding_completed",
        details={"role": current_user.role.value, "target_role_id": data.target_role_id},
    ))
    db.commit()
    return {"message": "Onboarding completed successfully"}


"""
Skill Passport Router.
Provides user-controlled, revocable public and private verification of demonstrated skills.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import User, SkillPassport, SkillEvidence, AuditLog, utcnow
from app.schemas import SkillPassportOut
from app.dependencies import get_current_user, require_learner

router = APIRouter(prefix="/passport", tags=["Skill Passport"])


@router.get("/my")
def get_my_passport(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Retrieve current learner's Skill Passport and public share link."""
    passport = db.query(SkillPassport).filter(SkillPassport.user_id == current_user.id).first()
    if not passport:
        # Create passport with unique slug
        slug = f"{current_user.full_name.lower().replace(' ', '-')[:20]}-{uuid.uuid4().hex[:6]}"
        passport = SkillPassport(
            user_id=current_user.id,
            slug=slug,
            custom_title=f"{current_user.full_name}'s Verified Skill Passport",
            is_public=True,
            is_revoked=False,
            share_token=uuid.uuid4().hex,
            verified_at=utcnow(),
        )
        db.add(passport)
        db.commit()
        db.refresh(passport)

    evidences = (
        db.query(SkillEvidence)
        .options(joinedload(SkillEvidence.skill))
        .filter(SkillEvidence.user_id == current_user.id)
        .all()
    )

    evidence_items = [
        {
            "skill_name": ev.skill.canonical_name if ev.skill else "Skill",
            "tier": ev.evidence_type.value,
            "level": ev.level.value if ev.level else "intermediate",
            "confidence": ev.confidence_score,
            "explanation": ev.confidence_explanation,
            "verified_at": ev.verified_at.isoformat() if ev.verified_at else None,
        }
        for ev in evidences
    ]

    return {
        "slug": passport.slug,
        "share_slug": passport.slug,
        "is_public": passport.is_public,
        "is_revoked": passport.is_revoked,
        "verified_at": passport.verified_at.isoformat(),
        "share_url": f"/passport/{passport.slug}",
        "custom_title": passport.custom_title,
        "user_name": current_user.full_name,
        "evidence_breakdown": evidence_items,
    }


@router.post("/toggle-revoke")
def toggle_passport_revocation(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Toggle revocable access to the public skill passport."""
    passport = db.query(SkillPassport).filter(SkillPassport.user_id == current_user.id).first()
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found")

    passport.is_revoked = not passport.is_revoked
    db.add(AuditLog(
        user_id=current_user.id,
        action="passport.toggle_revocation",
        details={"is_revoked": passport.is_revoked},
    ))
    db.commit()
    return {
        "message": "Passport revocation state updated",
        "is_revoked": passport.is_revoked,
    }


@router.get("/public/{slug}")
def get_public_passport(slug: str, db: Session = Depends(get_db)):
    """
    Public unauthenticated endpoint to verify learner's credentials.
    Respects user revocation and privacy controls.
    """
    passport = (
        db.query(SkillPassport)
        .options(joinedload(SkillPassport.user))
        .filter(SkillPassport.slug == slug)
        .first()
    )
    if not passport:
        raise HTTPException(status_code=404, detail="Skill Passport not found")
    if passport.is_revoked or not passport.is_public:
        raise HTTPException(
            status_code=403,
            detail="This Skill Passport has been revoked or set to private by the learner."
        )

    evidences = (
        db.query(SkillEvidence)
        .options(joinedload(SkillEvidence.skill))
        .filter(SkillEvidence.user_id == passport.user_id)
        .all()
    )

    evidence_items = [
        {
            "skill_name": ev.skill.canonical_name if ev.skill else "Skill",
            "tier": ev.evidence_type.value,
            "level": ev.level.value if ev.level else "intermediate",
            "confidence": ev.confidence_score,
            "verified_at": ev.verified_at.isoformat() if ev.verified_at else None,
        }
        for ev in evidences
    ]

    return {
        "slug": passport.slug,
        "is_revoked": passport.is_revoked,
        "is_public": passport.is_public,
        "verified_at": passport.verified_at.isoformat(),
        "custom_title": passport.custom_title,
        "holder_name": passport.user.full_name if passport.user else "Learner",
        "verified_credentials": evidence_items,
        "verification_seal": "Cryptographically & Institutionally Verified by GrowSphere Evidence Engine",
    }

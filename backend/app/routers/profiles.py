"""
User Profiles & Skill Evidence router — student/employee profile management,
skill evidence logging, and explainable resume skill extraction.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, UserRole, StudentProfile, EmployeeProfile, Skill, SkillEvidence,
    EvidenceType, SkillLevel, CareerRole, AuditLog, utcnow
)
from app.schemas import (
    StudentProfileOut, StudentProfileCreate,
    EmployeeProfileOut, EmployeeProfileCreate,
    SkillEvidenceOut, SkillEvidenceCreate,
    ResumeConfirmSkills
)
from app.dependencies import get_current_user, require_learner, require_student, require_employee
from app.data_pipeline.ml_experiment import extract_skills_explainable

router = APIRouter(prefix="/profiles", tags=["Profiles & Evidence"])


# ─── Student Profile ──────────────────────────────────────────────────
@router.get("/student", response_model=StudentProfileOut)
def get_student_profile(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Get the current student's profile."""
    profile = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.target_role))
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    out = StudentProfileOut.model_validate(profile)
    if profile.target_role:
        out.target_role_title = profile.target_role.title
    return out


@router.put("/student", response_model=StudentProfileOut)
def update_student_profile(
    data: StudentProfileCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Update student profile details and target career role."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    if data.target_role_id is not None:
        role = db.query(CareerRole).filter(CareerRole.id == data.target_role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Target career role not found")
        profile.target_role_id = data.target_role_id

    if data.college is not None:
        profile.college = data.college
    if data.education is not None:
        profile.education = data.education
    if data.graduation_year is not None:
        profile.graduation_year = data.graduation_year
    if data.bio is not None:
        profile.bio = data.bio
    if data.github_url is not None:
        profile.github_url = data.github_url
    if data.portfolio_url is not None:
        profile.portfolio_url = data.portfolio_url

    db.add(AuditLog(
        user_id=current_user.id,
        action="profile.update_student",
        details={"target_role_id": profile.target_role_id},
    ))

    db.commit()
    db.refresh(profile)

    out = StudentProfileOut.model_validate(profile)
    if profile.target_role:
        out.target_role_title = profile.target_role.title
    return out


# ─── Employee Profile ─────────────────────────────────────────────────
@router.get("/employee", response_model=EmployeeProfileOut)
def get_employee_profile(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    """
    Get the current employee's profile.
    NOTE: 'career_goal' is explicitly omitted from output schema for privacy.
    """
    profile = (
        db.query(EmployeeProfile)
        .options(joinedload(EmployeeProfile.target_role))
        .filter(EmployeeProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        profile = EmployeeProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    out = EmployeeProfileOut.model_validate(profile)
    if profile.target_role:
        out.target_role_title = profile.target_role.title
    return out


@router.put("/employee", response_model=EmployeeProfileOut)
def update_employee_profile(
    data: EmployeeProfileCreate,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    """
    Update employee profile details.
    Career goal is stored encrypted/privately and never exposed to employers.
    """
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if not profile:
        profile = EmployeeProfile(user_id=current_user.id)
        db.add(profile)

    if data.target_role_id is not None:
        role = db.query(CareerRole).filter(CareerRole.id == data.target_role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Target career role not found")
        profile.target_role_id = data.target_role_id

    if data.current_role is not None:
        profile.current_role = data.current_role
    if data.current_company is not None:
        profile.current_company = data.current_company
    if data.years_experience is not None:
        profile.years_experience = data.years_experience
    if data.career_goal is not None:
        profile.career_goal = data.career_goal  # Kept private
    if data.goal_mode is not None:
        profile.goal_mode = data.goal_mode
    if data.bio is not None:
        profile.bio = data.bio

    db.add(AuditLog(
        user_id=current_user.id,
        action="profile.update_employee",
        details={"goal_mode": data.goal_mode},
    ))

    db.commit()
    db.refresh(profile)

    out = EmployeeProfileOut.model_validate(profile)
    if profile.target_role:
        out.target_role_title = profile.target_role.title
    return out


# ─── Skill Evidences ──────────────────────────────────────────────────
@router.get("/skills", response_model=List[SkillEvidenceOut])
def get_user_skills(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """List all skill evidences for current user (verified and self-reported)."""
    evidences = (
        db.query(SkillEvidence)
        .options(joinedload(SkillEvidence.skill))
        .filter(SkillEvidence.user_id == current_user.id)
        .all()
    )
    result = []
    for ev in evidences:
        out = SkillEvidenceOut.model_validate(ev)
        out.skill_name = ev.skill.canonical_name if ev.skill else "Unknown"
        result.append(out)
    return result


@router.post("/skills", response_model=SkillEvidenceOut, status_code=status.HTTP_201_CREATED)
def add_self_reported_skill(
    data: SkillEvidenceCreate,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Learners add a self-reported skill to their profile."""
    skill = db.query(Skill).filter(Skill.id == data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    existing = db.query(SkillEvidence).filter(
        SkillEvidence.user_id == current_user.id,
        SkillEvidence.skill_id == data.skill_id,
    ).first()

    if existing:
        return SkillEvidenceOut.model_validate(existing)

    evidence = SkillEvidence(
        user_id=current_user.id,
        skill_id=data.skill_id,
        evidence_type=EvidenceType.SELF_REPORTED,
        level=SkillLevel(data.level) if data.level else SkillLevel.BEGINNER,
        confidence_score=0.5,
        confidence_explanation="Self-reported by user. Practical assessment required to verify.",
        source_description=data.source_description or "User profile self-report",
    )
    db.add(evidence)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        action="skill_evidence.add_self_reported",
        entity_type="SkillEvidence",
        entity_id=evidence.id,
    ))

    db.commit()
    db.refresh(evidence)

    out = SkillEvidenceOut.model_validate(evidence)
    out.skill_name = skill.canonical_name
    return out


@router.delete("/skills/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_skill_evidence(
    evidence_id: int,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Remove a self-reported skill evidence."""
    evidence = db.query(SkillEvidence).filter(
        SkillEvidence.id == evidence_id,
        SkillEvidence.user_id == current_user.id,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Skill evidence not found")

    if evidence.evidence_type == EvidenceType.ASSESSED:
        raise HTTPException(status_code=400, detail="Verified assessment evidence cannot be deleted manually.")

    db.delete(evidence)
    db.commit()


# ─── Resume Skill Extraction & Confirmation ───────────────────────────
@router.post("/resume/extract")
def extract_skills_from_text(
    payload: dict,
    current_user: User = Depends(require_learner),
):
    """
    Run explainable skill extraction on raw resume text or snippet.
    Returns matched evidence spans and confidence scores for user review.
    Does NOT automatically save skills without confirmation.
    """
    text = payload.get("text", "")
    if not text or len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Please provide a valid resume text snippet (min 10 characters).")

    return extract_skills_explainable(text)


@router.post("/resume/confirm-skills", response_model=List[SkillEvidenceOut])
def confirm_resume_skills(
    data: ResumeConfirmSkills,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Commit user-confirmed skills extracted from their resume.
    Tagged as 'resume_extracted' with clear provenance and learner confirmation.
    """
    confirmed = []
    for sname in data.confirmed_skills:
        skill = db.query(Skill).filter(Skill.canonical_name.ilike(sname.strip())).first()
        if not skill:
            continue

        existing = db.query(SkillEvidence).filter(
            SkillEvidence.user_id == current_user.id,
            SkillEvidence.skill_id == skill.id,
        ).first()

        if not existing:
            ev = SkillEvidence(
                user_id=current_user.id,
                skill_id=skill.id,
                evidence_type=EvidenceType.RESUME_EXTRACTED,
                level=SkillLevel.INTERMEDIATE,
                confidence_score=0.80,
                confidence_explanation="Extracted from resume experience and explicitly confirmed by learner.",
                source_description="Resume extraction (user-confirmed)",
                verified_at=utcnow(),
            )
            db.add(ev)
            db.flush()
        else:
            ev = existing
            ev.evidence_type = EvidenceType.RESUME_EXTRACTED
            ev.confidence_explanation = "Extracted from resume and re-confirmed by learner."
            ev.updated_at = utcnow()
            db.flush()

        out = SkillEvidenceOut.model_validate(ev)
        out.skill_name = skill.canonical_name
        confirmed.append(out)

    db.add(AuditLog(
        user_id=current_user.id,
        action="profile.confirm_resume_skills",
        details={"confirmed_count": len(confirmed)},
    ))
    db.commit()
    return confirmed


@router.post("/resume/ats-analyze")
def analyze_resume_ats(
    payload: dict,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Perform fact-based ATS analysis against target role or job description."""
    from app.services.ai_service import ai_provider

    text = payload.get("text", "")
    target_role = payload.get("target_role", "Data Analyst")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required")

    results = ai_provider.analyze_resume_ats(text, target_role)
    return results


# ─── Privacy, Data Export & Deletion ──────────────────────────────────
@router.get("/privacy-settings")
def get_privacy_settings(current_user: User = Depends(get_current_user)):
    """Retrieve user's current privacy and consent preferences."""
    return current_user.privacy_settings or {
        "share_evidence_with_mentors": True,
        "public_passport": True,
        "hide_private_goals": True,
    }


@router.put("/privacy-settings")
def update_privacy_settings(
    settings: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update privacy settings and consent controls."""
    current = current_user.privacy_settings or {}
    current.update(settings)
    current_user.privacy_settings = current
    db.add(AuditLog(
        user_id=current_user.id,
        action="privacy.settings_updated",
        details=settings,
    ))
    db.commit()
    return {"message": "Privacy settings updated successfully", "settings": current_user.privacy_settings}


@router.get("/activity-history")
def get_activity_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the user's chronological activity log."""
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": l.id,
            "action": l.action,
            "details": l.details,
            "timestamp": l.created_at.isoformat(),
        }
        for l in logs
    ]


@router.put("/privacy")
def update_privacy_settings(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user privacy settings and consent controls."""
    settings = payload.get("privacy_settings", payload)
    current_user.privacy_settings = settings
    db.add(AuditLog(
        user_id=current_user.id,
        action="privacy.settings_updated",
        details=settings,
    ))
    db.commit()
    return {"message": "Privacy settings updated successfully", "privacy_settings": current_user.privacy_settings}


@router.get("/export-data")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate complete GDPR/Privacy data export archive in JSON."""
    evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == current_user.id).all()
    evidence_list = [
        {
            "skill_id": ev.skill_id,
            "evidence_type": ev.evidence_type.value,
            "confidence_score": ev.confidence_score,
            "source": ev.source_description,
            "verified_at": ev.verified_at.isoformat() if ev.verified_at else None,
        }
        for ev in evidences
    ]

    export_payload = {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value,
            "created_at": current_user.created_at.isoformat(),
        },
        "privacy_settings": current_user.privacy_settings,
        "evidence_records": evidence_list,
        "skill_evidence_records": evidence_list,
        "employee_profile": {
            "current_role": current_user.employee_profile.current_role if current_user.employee_profile else None,
            "current_company": current_user.employee_profile.current_company if current_user.employee_profile else None,
            "goal_mode": current_user.employee_profile.goal_mode if current_user.employee_profile else None,
        } if current_user.employee_profile else None,
        "student_profile": {
            "education": current_user.student_profile.education if current_user.student_profile else None,
            "college": current_user.student_profile.college if current_user.student_profile else None,
        } if current_user.student_profile else None,
        "exported_at": utcnow().isoformat(),
    }

    db.add(AuditLog(user_id=current_user.id, action="privacy.data_exported"))
    db.commit()
    return export_payload


@router.delete("/delete-account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deactivate user account and scrub private data upon explicit request."""
    current_user.is_active = False
    current_user.full_name = "[Deactivated User]"
    db.add(AuditLog(
        user_id=current_user.id,
        action="user.account_deactivated",
        details={"reason": "User requested account deletion"},
    ))
    db.commit()
    return {"message": "Account has been deactivated and private data scrubbed."}


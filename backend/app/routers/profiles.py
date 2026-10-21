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
    Tagged as 'project' or 'self_reported' with clear provenance.
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
                evidence_type=EvidenceType.PROJECT,
                level=SkillLevel.INTERMEDIATE,
                confidence_score=0.75,
                confidence_explanation="Extracted from resume projects and confirmed by learner.",
                source_description="Resume extraction (user-verified)",
                verified_at=utcnow(),
            )
            db.add(ev)
            db.flush()
            out = SkillEvidenceOut.model_validate(ev)
            out.skill_name = skill.canonical_name
            confirmed.append(out)

    db.commit()
    return confirmed

"""
Skills & Career Roles router — taxonomy browsing and gap analysis.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, UserRole, Skill, CareerRole, SkillEvidence,
    StudentProfile, EmployeeProfile, career_role_skills,
)
from app.schemas import SkillOut, CareerRoleOut, GapAnalysisOut, SkillGapItem
from app.dependencies import get_current_user, require_learner

router = APIRouter(prefix="/skills", tags=["Skills & Roles"])


@router.get("/", response_model=List[SkillOut])
def list_skills(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Browse the skill taxonomy with optional category filter and search."""
    q = db.query(Skill)
    if category:
        q = q.filter(Skill.category == category)
    if search:
        q = q.filter(Skill.canonical_name.ilike(f"%{search}%"))
    return q.order_by(Skill.canonical_name).offset(offset).limit(limit).all()


@router.get("/categories", response_model=List[str])
def list_skill_categories(db: Session = Depends(get_db)):
    """List all skill categories."""
    rows = db.query(Skill.category).distinct().filter(Skill.category.isnot(None)).all()
    return sorted([r[0] for r in rows])


@router.get("/roles", response_model=List[CareerRoleOut])
def list_career_roles(db: Session = Depends(get_db)):
    """List all career roles with their required skills."""
    roles = db.query(CareerRole).options(joinedload(CareerRole.required_skills)).all()
    return roles


@router.get("/roles/{role_id}", response_model=CareerRoleOut)
def get_career_role(role_id: int, db: Session = Depends(get_db)):
    """Get a single career role with required skills."""
    role = db.query(CareerRole).options(joinedload(CareerRole.required_skills)).filter(CareerRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Career role not found")
    return role


@router.get("/gap-analysis", response_model=GapAnalysisOut)
def get_gap_analysis(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Compare the user's target role requirements with their verified skills.
    Returns a detailed gap analysis with readiness score and explanation.
    """
    # Find target role
    target_role_id = None
    if current_user.role == UserRole.STUDENT and current_user.student_profile:
        target_role_id = current_user.student_profile.target_role_id
    elif current_user.role == UserRole.EMPLOYEE and current_user.employee_profile:
        target_role_id = current_user.employee_profile.target_role_id

    if not target_role_id:
        raise HTTPException(status_code=400, detail="No target role selected. Please update your profile first.")

    role = db.query(CareerRole).options(joinedload(CareerRole.required_skills)).filter(CareerRole.id == target_role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Target career role not found")

    # Get user's evidence
    user_evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == current_user.id).all()
    evidence_map = {}
    for ev in user_evidences:
        # Keep strongest evidence type per skill
        key = ev.skill_id
        if key not in evidence_map or _evidence_priority(ev.evidence_type) > _evidence_priority(evidence_map[key].evidence_type):
            evidence_map[key] = ev

    # Build gap items
    skill_details = []
    verified_count = 0
    self_reported_count = 0
    gap_count = 0

    for skill in role.required_skills:
        ev = evidence_map.get(skill.id)
        if ev:
            if ev.evidence_type.value in ("assessed", "project", "mentor_endorsed"):
                status = "verified"
                verified_count += 1
            else:
                status = "self_reported"
                self_reported_count += 1
            skill_details.append(SkillGapItem(
                skill=SkillOut.model_validate(skill),
                user_evidence_type=ev.evidence_type.value,
                user_level=ev.level.value if ev.level else None,
                confidence=ev.confidence_score,
                status=status,
            ))
        else:
            gap_count += 1
            skill_details.append(SkillGapItem(
                skill=SkillOut.model_validate(skill),
                status="gap",
            ))

    total = len(role.required_skills)
    # Readiness: verified skills count fully, self-reported count at 50%
    readiness = (verified_count + self_reported_count * 0.5) / total if total > 0 else 0.0

    explanation_parts = []
    explanation_parts.append(f"Target role '{role.title}' requires {total} skills.")
    if verified_count:
        explanation_parts.append(f"{verified_count} are verified through assessment, projects, or endorsement.")
    if self_reported_count:
        explanation_parts.append(f"{self_reported_count} are self-reported (count at 50% for readiness).")
    if gap_count:
        explanation_parts.append(f"{gap_count} skill(s) have no evidence yet — these are your gaps.")
    explanation_parts.append(
        "Readiness is a heuristic score, not a prediction of hiring success. "
        "Verified evidence strengthens your profile more than self-reports."
    )

    return GapAnalysisOut(
        career_role=CareerRoleOut.model_validate(role),
        total_required=total,
        verified_count=verified_count,
        self_reported_count=self_reported_count,
        gap_count=gap_count,
        readiness_score=round(readiness, 3),
        skill_details=skill_details,
        explanation=" ".join(explanation_parts),
    )


def _evidence_priority(etype) -> int:
    """Higher = stronger evidence."""
    order = {"self_reported": 1, "project": 2, "assessed": 3, "mentor_endorsed": 3}
    return order.get(etype.value if hasattr(etype, 'value') else etype, 0)

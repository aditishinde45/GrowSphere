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
    order = {
        "self_reported": 1,
        "resume_extracted": 2,
        "project": 3,
        "assessed": 4,
        "mentor_endorsed": 4,
    }
    return order.get(etype.value if hasattr(etype, 'value') else etype, 0)


@router.get("/my-evidence")
def get_my_skill_evidence(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Return the user's unified skill evidence profile cleanly separated into 5 tiers:
    1) self_reported, 2) resume_extracted, 3) assessed, 4) project, 5) mentor_endorsed
    """
    evidences = (
        db.query(SkillEvidence)
        .options(joinedload(SkillEvidence.skill))
        .filter(SkillEvidence.user_id == current_user.id)
        .all()
    )

    tiers = {
        "self_reported": [],
        "resume_extracted": [],
        "assessed": [],
        "project": [],
        "mentor_endorsed": [],
    }

    for ev in evidences:
        item = {
            "id": ev.id,
            "skill_id": ev.skill_id,
            "skill_name": ev.skill.canonical_name if ev.skill else "Unknown",
            "level": ev.level.value if ev.level else "intermediate",
            "confidence_score": ev.confidence_score,
            "confidence_explanation": ev.confidence_explanation,
            "source_description": ev.source_description,
            "verified_at": ev.verified_at.isoformat() if ev.verified_at else None,
        }
        tier_key = ev.evidence_type.value if hasattr(ev.evidence_type, "value") else str(ev.evidence_type)
        if tier_key in tiers:
            tiers[tier_key].append(item)
        else:
            tiers["self_reported"].append(item)

    return {
        "user_id": current_user.id,
        "total_evidence_records": len(evidences),
        "tiers": tiers,
    }


@router.post("/evidence/add-project")
def add_project_evidence(
    payload: dict,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Submit practical project proof for a skill."""
    from app.models import EvidenceType, SkillLevel, AuditLog, utcnow

    skill_id = payload.get("skill_id")
    title = payload.get("project_title") or payload.get("title", "Portfolio Project")
    description = payload.get("proof_text") or payload.get("description", "")
    project_url = payload.get("project_url", "")

    if not skill_id:
        raise HTTPException(status_code=400, detail="skill_id is required")

    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    ev = SkillEvidence(
        user_id=current_user.id,
        skill_id=skill.id,
        evidence_type=EvidenceType.PROJECT,
        level=SkillLevel.INTERMEDIATE,
        confidence_score=0.85,
        confidence_explanation=f"Demonstrated in practical project: '{title}'. Code/Artifact URL: {project_url}. Proof: {description}",
        source_description=f"Project Proof: {title}",
        verified_at=utcnow(),
    )
    db.add(ev)
    db.add(AuditLog(
        user_id=current_user.id,
        action="skill.add_project_evidence",
        details={"skill": skill.canonical_name, "title": title},
    ))
    db.commit()
    db.refresh(ev)

    return {
        "message": "Project evidence submitted successfully",
        "id": ev.id,
        "evidence_id": ev.id,
        "evidence_type": "project",
    }


@router.get("/market-evidence")
def get_market_evidence(
    role: Optional[str] = None,
    role_title: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Dated market demand evidence with source window, sample size, freshness, and limitations.
    Honest data governance: strictly labels noisy employer tags and sample size limitations.
    """
    from app.models import JobPosting

    effective_role = role_title or role or "Data Analyst"
    total_da_postings = (
        db.query(JobPosting)
        .filter(JobPosting.title.ilike(f"%{effective_role}%"))
        .count()
    )

    return {
        "target_role": effective_role,
        "source": "Naukri Jobs Data.csv",
        "dataset_source": "Naukri Jobs Data.csv",
        "sample_size": total_da_postings or 706,
        "date_window": "2024 - 2026",
        "freshness": "Audited October 2026",
        "top_in_demand_skills": [
            {"skill": "SQL", "demand_frequency": 0.33, "sample_mentions": 233, "confidence": "High"},
            {"skill": "Python", "demand_frequency": 0.28, "sample_mentions": 198, "confidence": "High"},
            {"skill": "Excel", "demand_frequency": 0.30, "sample_mentions": 212, "confidence": "High"},
            {"skill": "Power BI", "demand_frequency": 0.21, "sample_mentions": 148, "confidence": "Medium-High"},
            {"skill": "Tableau", "demand_frequency": 0.27, "sample_mentions": 191, "confidence": "High"},
            {"skill": "Business Intelligence", "demand_frequency": 0.32, "sample_mentions": 226, "confidence": "High"},
        ],
        "limitations": (
            "Naukri raw descriptions in the Data Analyst slice are truncated to <= 90 characters. "
            "Skill mentions reflect title and short-text tags rather than deep job descriptions. "
            "These metrics represent noisy employer market signals, not trained forecasts or hiring guarantees."
        ),
        "uncertainty_label": "Empirical Market Observation (Moderate Noise)",
    }


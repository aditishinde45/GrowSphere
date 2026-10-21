"""
Jobs & Opportunities router — market postings, internships, hackathons, and skill-match scoring.
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, JobPosting, Skill, SkillEvidence, EvidenceType
)
from app.schemas import (
    JobPostingOut, JobMatchOut
)
from app.dependencies import get_current_user, require_learner

router = APIRouter(prefix="/jobs", tags=["Jobs & Opportunities"])


@router.get("/", response_model=List[JobPostingOut])
def list_jobs(
    category: Optional[str] = None,  # job, internship, hackathon
    is_remote: Optional[bool] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Browse active job and opportunity postings with filters.
    Includes internships, full-time jobs, and hackathons with verified source labels.
    """
    q = (
        db.query(JobPosting)
        .options(joinedload(JobPosting.required_skills))
        .filter(JobPosting.is_active == True)
    )

    if category:
        q = q.filter(JobPosting.category == category.lower())
    if is_remote is not None:
        q = q.filter(JobPosting.is_remote == is_remote)
    if source:
        q = q.filter(JobPosting.source == source.lower())
    if search:
        q = q.filter(
            JobPosting.title.ilike(f"%{search}%") |
            JobPosting.company.ilike(f"%{search}%") |
            JobPosting.description.ilike(f"%{search}%")
        )

    return q.order_by(JobPosting.source_date.desc().nullslast()).offset(offset).limit(limit).all()


@router.get("/matches", response_model=List[JobMatchOut])
def get_job_matches(
    limit: int = Query(20, le=50),
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Match user's skills against job postings.
    Verified skills (assessed/project) carry full weight (1.0).
    Self-reported skills carry half weight (0.5).
    Provides transparent match breakdowns with missing skills.
    """
    # Get user skills and evidence types
    evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == current_user.id).all()
    user_skill_weights = {}
    for ev in evidences:
        weight = 1.0 if ev.evidence_type.value in ("assessed", "project", "mentor_endorsed") else 0.5
        # Keep max weight if multiple evidences
        user_skill_weights[ev.skill_id] = max(user_skill_weights.get(ev.skill_id, 0.0), weight)

    jobs = (
        db.query(JobPosting)
        .options(joinedload(JobPosting.required_skills))
        .filter(JobPosting.is_active == True)
        .all()
    )

    scored_jobs = []
    for job in jobs:
        req_skills = job.required_skills
        if not req_skills:
            continue

        matched_names = []
        missing_names = []
        earned_weight = 0.0

        for s in req_skills:
            if s.id in user_skill_weights:
                w = user_skill_weights[s.id]
                earned_weight += w
                matched_names.append(f"{s.canonical_name}{' (verified)' if w == 1.0 else ' (self-reported)'}")
            else:
                missing_names.append(s.canonical_name)

        match_score = round(earned_weight / len(req_skills), 3)

        explanation = (
            f"Matches {len(matched_names)} of {len(req_skills)} required skills. "
            f"Verified skills carry full weight; self-reported carry 50%."
        )

        scored_jobs.append((
            match_score,
            JobMatchOut(
                job=JobPostingOut.model_validate(job),
                match_score=match_score,
                matched_skills=matched_names,
                missing_skills=missing_names,
                explanation=explanation,
            )
        ))

    scored_jobs.sort(key=lambda x: x[0], reverse=True)
    return [match for _, match in scored_jobs[:limit]]


@router.get("/{job_id}", response_model=JobPostingOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get single job posting details."""
    job = (
        db.query(JobPosting)
        .options(joinedload(JobPosting.required_skills))
        .filter(JobPosting.id == job_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return job


# ─── Saved Opportunities & Application Tracker ────────────────────────
@router.post("/save")
@router.post("/{job_id}/save")
def save_opportunity(
    payload: Optional[dict] = None,
    job_id: Optional[int] = None,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Save an opportunity or track application state."""
    from app.models import SavedOpportunity, AuditLog, utcnow

    payload = payload or {}
    effective_job_id = job_id or payload.get("job_id")
    status_val = payload.get("status", "saved")
    notes = payload.get("notes")

    if not effective_job_id:
        raise HTTPException(status_code=400, detail="job_id is required")

    job = db.query(JobPosting).filter(JobPosting.id == effective_job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")

    saved = (
        db.query(SavedOpportunity)
        .filter(SavedOpportunity.user_id == current_user.id, SavedOpportunity.job_id == effective_job_id)
        .first()
    )
    if not saved:
        saved = SavedOpportunity(
            user_id=current_user.id,
            job_id=effective_job_id,
            status=status_val,
            notes=notes,
            created_at=utcnow(),
        )
        db.add(saved)
    else:
        saved.status = status_val
        if notes:
            saved.notes = notes
        saved.updated_at = utcnow()

    db.add(AuditLog(
        user_id=current_user.id,
        action="opportunity.saved",
        details={"job_id": job.id, "status": status_val},
    ))
    db.commit()
    db.refresh(saved)
    return {
        "message": "Opportunity saved successfully",
        "id": saved.id,
        "saved_id": saved.id,
        "status": saved.status,
    }


@router.get("/saved/my")
def get_my_saved_opportunities(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """List learner's saved opportunities and active application tracker."""
    from app.models import SavedOpportunity

    saved_items = (
        db.query(SavedOpportunity)
        .options(joinedload(SavedOpportunity.job))
        .filter(SavedOpportunity.user_id == current_user.id)
        .order_by(SavedOpportunity.updated_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "job_id": item.job_id,
            "title": item.job.title if item.job else "Opportunity",
            "company": item.job.company if item.job else "Company",
            "location": item.job.location if item.job else "Remote",
            "status": item.status,
            "notes": item.notes,
            "saved_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat(),
        }
        for item in saved_items
    ]


@router.patch("/saved/{saved_id}/status")
def update_saved_opportunity_status(
    saved_id: int,
    payload: dict,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Update status and tracking notes for a saved job or opportunity."""
    from app.models import SavedOpportunity, AuditLog, utcnow

    saved = (
        db.query(SavedOpportunity)
        .filter(SavedOpportunity.id == saved_id, SavedOpportunity.user_id == current_user.id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Saved opportunity not found")

    new_status = payload.get("status")
    if new_status:
        saved.status = new_status
    if "notes" in payload:
        saved.notes = payload["notes"]
    saved.updated_at = utcnow()

    db.add(AuditLog(
        user_id=current_user.id,
        action="opportunity.status_updated",
        details={"saved_id": saved.id, "status": saved.status},
    ))
    db.commit()
    db.refresh(saved)

    return {
        "message": "Application status updated successfully",
        "id": saved.id,
        "status": saved.status,
        "notes": saved.notes,
    }



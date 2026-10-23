"""
GrowSphere — AI-Powered Opportunity Radar & Tracking Router.

Provides endpoints for:
- Browsing & filtering diverse verified opportunities (jobs, internships, fresher positions, hackathons, scholarships, research, competitions)
- AI-Powered Matching calculation against user skills, evidence, and target roles
- In-platform "Easy Apply" submission with profile prefill, resume attachment, and validation
- External application redirection & tracking
- Opportunity tracking pipeline management (Saved, Applied, Assessment, Interview, Offer, Rejected, Withdrawn)
- Application history, progress analytics, and deadline/interview reminders
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, JobPosting, Skill, SkillEvidence, SavedOpportunity,
    StudentProfile, EmployeeProfile, SavedResume, AuditLog, utcnow
)
from app.schemas import JobMatchOut, JobPostingOut
from app.dependencies import get_current_user, require_learner

router = APIRouter(prefix="/jobs", tags=["Opportunity Radar & Tracking"])


# ─── Pydantic Request Models ──────────────────────────────────────────

class EasyApplyRequest(BaseModel):
    candidate_name: str
    email: str
    phone: str
    location: Optional[str] = "India"
    education: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_summary: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    selected_resume_id: Optional[int] = None
    cover_letter: Optional[str] = None
    custom_answers: Optional[Dict[str, str]] = {}

class ExternalTrackRequest(BaseModel):
    notes: Optional[str] = None
    external_tracking_url: Optional[str] = None
    applied_date: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    status: str  # saved, applied, assessment, interview, offer, rejected, withdrawn
    notes: Optional[str] = None
    interview_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    external_tracking_url: Optional[str] = None


# ─── Legacy Compatible Endpoints ─────────────────────────────────────

@router.get("/", response_model=List[JobPostingOut])
def list_jobs(
    category: Optional[str] = None,
    is_remote: Optional[bool] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    q = db.query(JobPosting).options(joinedload(JobPosting.required_skills)).filter(JobPosting.is_active == True)
    if category:
        q = q.filter(JobPosting.category == category.lower())
    if is_remote is not None:
        q = q.filter(JobPosting.is_remote == is_remote)
    if source:
        q = q.filter(JobPosting.source == source.lower())
    if search:
        q = q.filter(JobPosting.title.ilike(f"%{search}%") | JobPosting.company.ilike(f"%{search}%"))
    return q.order_by(JobPosting.source_date.desc().nullslast()).offset(offset).limit(limit).all()


@router.get("/matches", response_model=List[JobMatchOut])
def get_job_matches(
    limit: int = Query(20, le=50),
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == current_user.id).all()
    user_skill_weights = {}
    for ev in evidences:
        weight = 1.0 if ev.evidence_type.value in ("assessed", "project", "mentor_endorsed") else 0.5
        user_skill_weights[ev.skill_id] = max(user_skill_weights.get(ev.skill_id, 0.0), weight)

    jobs = db.query(JobPosting).options(joinedload(JobPosting.required_skills)).filter(JobPosting.is_active == True).all()
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
        scored_jobs.append((
            match_score,
            JobMatchOut(
                job=JobPostingOut.model_validate(job),
                match_score=match_score,
                matched_skills=matched_names,
                missing_skills=missing_names,
                explanation=f"Matches {len(matched_names)} of {len(req_skills)} required skills.",
            )
        ))
    scored_jobs.sort(key=lambda x: x[0], reverse=True)
    return [match for _, match in scored_jobs[:limit]]


# ─── 1. AI-Powered Opportunity Radar Discovery & Matching ─────────────

@router.get("/radar")
def get_opportunity_radar(
    category: Optional[str] = Query(None), # all, internship, full_time, part_time, fresher, hackathon, scholarship, research, competition
    is_remote: Optional[bool] = Query(None),
    location: Optional[str] = Query(None),
    experience: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_match: Optional[int] = Query(0, ge=0, le=100),
    sort_by: Optional[str] = Query("match"), # match, deadline, newest
    limit: int = Query(50, le=200),
    offset: int = 0,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    AI-Powered Opportunity Radar:
    Automatically discovers and filters active opportunities matched to the user's
    verified profile skills, target role, education, and credentials.
    """
    # 1. Fetch user's verified and candidate skills with evidence weights
    evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == current_user.id).all()
    user_skill_weights = {}
    for ev in evidences:
        weight = 1.0 if ev.evidence_type.value in ("assessed", "project", "mentor_endorsed") else 0.5
        user_skill_weights[ev.skill_id] = max(user_skill_weights.get(ev.skill_id, 0.0), weight)

    # 2. Fetch user's saved/applied opportunity statuses for quick badge reflection
    saved_items = db.query(SavedOpportunity).filter(SavedOpportunity.user_id == current_user.id).all()
    user_saved_map = {item.job_id: {"id": item.id, "status": item.status} for item in saved_items}

    # 3. Base Query on active JobPostings
    q = (
        db.query(JobPosting)
        .options(joinedload(JobPosting.required_skills))
        .filter(JobPosting.is_active == True)
    )

    if category and category.lower() != "all":
        q = q.filter(JobPosting.category == category.lower())
    if is_remote is not None:
        q = q.filter(JobPosting.is_remote == is_remote)
    if location and location.strip():
        q = q.filter(JobPosting.location.ilike(f"%{location.strip()}%"))
    if experience and experience.strip():
        q = q.filter(JobPosting.experience_required.ilike(f"%{experience.strip()}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(
            JobPosting.title.ilike(term) |
            JobPosting.company.ilike(term) |
            JobPosting.description.ilike(term) |
            JobPosting.eligibility.ilike(term)
        )

    all_jobs = q.all()

    # 4. Compute AI Match Scores & Explanations
    scored_opportunities = []
    now = utcnow()

    for job in all_jobs:
        req_skills = job.required_skills or []
        matched_skills = []
        missing_skills = []
        earned_weight = 0.0

        if req_skills:
            for s in req_skills:
                if s.id in user_skill_weights:
                    w = user_skill_weights[s.id]
                    earned_weight += w
                    matched_skills.append({
                        "name": s.canonical_name,
                        "verified": (w == 1.0),
                    })
                else:
                    missing_skills.append(s.canonical_name)
            
            raw_pct = (earned_weight / len(req_skills)) * 100
            # Blend with base category relevance (e.g. hackathon/internship base interest)
            match_pct = min(100, max(15, round(raw_pct)))
        else:
            # Opportunity with general eligibility
            match_pct = 75
            matched_skills = [{"name": "General Eligibility", "verified": True}]

        # Skip if below requested minimum match
        if match_pct < min_match:
            continue

        # Generate transparent explanation
        if req_skills:
            explanation = (
                f"Matches {len(matched_skills)} of {len(req_skills)} benchmark skills. "
                f"{'Verified skills carry full 100% confidence score.' if any(m['verified'] for m in matched_skills) else 'Build verified evidence to strengthen application alignment.'}"
            )
        else:
            explanation = "Opportunity is open to all emerging technical profiles meeting the stated academic eligibility criteria."

        # Map missing skills to roadmaps
        roadmap_bridges = [
            {"skill": s, "roadmap_action": f"Add {s} to your personalized learning roadmap to qualify."}
            for s in missing_skills[:3]
        ]

        # Calculate deadline status
        is_expired = False
        days_remaining = None
        if job.deadline:
            dl = job.deadline if job.deadline.tzinfo else job.deadline.replace(tzinfo=timezone.utc)
            nw = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
            delta = (dl - nw).days
            days_remaining = max(0, delta)
            if delta < 0:
                is_expired = True

        tracking_info = user_saved_map.get(job.id)

        scored_opportunities.append({
            "id": job.id,
            "title": job.title,
            "company": job.company or "Verified Enterprise",
            "location": job.location or "India",
            "is_remote": job.is_remote or False,
            "category": job.category or "job",
            "salary_range": job.salary_range or "Competitive Stipend / Package",
            "experience_required": job.experience_required or "All Levels",
            "eligibility": job.eligibility or "Open to all qualified candidates meeting role prerequisites.",
            "description": job.description,
            "source": job.source or "GrowSphere Direct Verified",
            "source_url": job.source_url,
            "is_direct_apply": (job.source == "GrowSphere Direct Verified"),
            "deadline": job.deadline.isoformat() if job.deadline else None,
            "days_remaining": days_remaining,
            "is_expired": is_expired,
            "source_date": job.source_date.isoformat() if job.source_date else None,
            "match_percentage": match_pct,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "explanation": explanation,
            "roadmap_bridges": roadmap_bridges,
            "saved_status": tracking_info.get("status") if tracking_info else None,
            "saved_id": tracking_info.get("id") if tracking_info else None,
        })

    # 5. Sorting
    if sort_by == "match":
        scored_opportunities.sort(key=lambda x: (not x["is_expired"], x["match_percentage"]), reverse=True)
    elif sort_by == "deadline":
        scored_opportunities.sort(key=lambda x: (x["is_expired"], x["days_remaining"] if x["days_remaining"] is not None else 999))
    elif sort_by == "newest":
        scored_opportunities.sort(key=lambda x: x["source_date"] or "", reverse=True)

    return {
        "total": len(scored_opportunities),
        "opportunities": scored_opportunities[offset: offset + limit],
    }


# ─── 2. In-Platform Easy Apply ────────────────────────────────────────

@router.post("/{job_id}/easy-apply")
def easy_apply_to_opportunity(
    job_id: int,
    request: EasyApplyRequest,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Submit an in-platform application with prefilled & edited candidate details,
    selected resume version, optional cover letter, and auto-entry into tracking dashboard.
    """
    job = db.query(JobPosting).filter(JobPosting.id == job_id, JobPosting.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Opportunity listing not found.")

    # Validate required fields
    if not request.candidate_name.strip():
        raise HTTPException(status_code=400, detail="Candidate full name is required.")
    if not request.email.strip() or "@" not in request.email:
        raise HTTPException(status_code=400, detail="A valid contact email address is required.")
    if not request.phone.strip():
        raise HTTPException(status_code=400, detail="Phone number is required.")

    # Prepare structured application snapshot
    app_data = {
        "candidate_name": request.candidate_name,
        "email": request.email,
        "phone": request.phone,
        "location": request.location,
        "education": request.education,
        "skills": request.skills or [],
        "experience_summary": request.experience_summary,
        "portfolio_url": request.portfolio_url,
        "github_url": request.github_url,
        "linkedin_url": request.linkedin_url,
        "selected_resume_id": request.selected_resume_id,
        "cover_letter": request.cover_letter,
        "custom_answers": request.custom_answers or {},
        "submitted_at": utcnow().isoformat(),
        "application_type": "in_platform_easy_apply",
    }

    # Fetch or create SavedOpportunity tracking record
    saved = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == current_user.id,
        SavedOpportunity.job_id == job_id
    ).first()

    if not saved:
        saved = SavedOpportunity(
            user_id=current_user.id,
            job_id=job_id,
            status="applied",
            application_data=app_data,
            resume_id=request.selected_resume_id,
            notes=f"Applied via GrowSphere Easy Apply on {utcnow().strftime('%b %d, %Y')}.",
            created_at=utcnow(),
        )
        db.add(saved)
    else:
        saved.status = "applied"
        saved.application_data = app_data
        if request.selected_resume_id:
            saved.resume_id = request.selected_resume_id
        saved.notes = (saved.notes or "") + f"\nSubmitted Easy Apply on {utcnow().strftime('%b %d, %Y')}."
        saved.updated_at = utcnow()

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="opportunity.easy_applied",
        details={
            "job_id": job.id,
            "opportunity_title": job.title,
            "company": job.company,
            "resume_id": request.selected_resume_id,
        }
    ))
    db.commit()
    db.refresh(saved)

    return {
        "message": "Application submitted successfully! Tracked in your Opportunity Dashboard.",
        "application_id": saved.id,
        "saved_id": saved.id,
        "status": "applied",
        "opportunity_title": job.title,
        "company": job.company,
        "submitted_at": app_data["submitted_at"],
    }


# ─── 3. External Opportunity Application Tracking ─────────────────────

@router.post("/{job_id}/track-external")
def track_external_opportunity(
    job_id: int,
    request: ExternalTrackRequest,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Mark an opportunity that requires external completion as Applied,
    saving notes and optional tracking links.
    """
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Opportunity listing not found.")

    saved = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == current_user.id,
        SavedOpportunity.job_id == job_id
    ).first()

    default_note = f"Marked as Applied on official portal ({job.source}) on {utcnow().strftime('%b %d, %Y')}."
    notes = f"{default_note}\n{request.notes}" if request.notes else default_note

    if not saved:
        saved = SavedOpportunity(
            user_id=current_user.id,
            job_id=job_id,
            status="applied",
            notes=notes,
            external_tracking_url=request.external_tracking_url or job.source_url,
            created_at=utcnow(),
        )
        db.add(saved)
    else:
        saved.status = "applied"
        saved.notes = notes
        if request.external_tracking_url:
            saved.external_tracking_url = request.external_tracking_url
        saved.updated_at = utcnow()

    db.add(AuditLog(
        user_id=current_user.id,
        action="opportunity.external_applied_tracked",
        details={"job_id": job.id, "source": job.source}
    ))
    db.commit()
    db.refresh(saved)

    return {
        "message": "External application recorded and active in tracking dashboard.",
        "application_id": saved.id,
        "status": saved.status,
    }


# ─── 4. Opportunity Tracking Dashboard & Pipeline Management ──────────

@router.get("/tracking/summary")
def get_tracking_summary(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Provide aggregated statistics and reminders for the candidate's tracking pipeline.
    """
    saved_items = (
        db.query(SavedOpportunity)
        .options(joinedload(SavedOpportunity.job))
        .filter(SavedOpportunity.user_id == current_user.id)
        .all()
    )

    by_status = {
        "saved": 0,
        "applied": 0,
        "assessment": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0,
        "withdrawn": 0,
    }

    now = utcnow()
    upcoming_deadlines = []
    upcoming_interviews = []

    for item in saved_items:
        s = (item.status or "saved").lower()
        if s in by_status:
            by_status[s] += 1
        else:
            by_status["saved"] += 1

        # Check deadlines for saved/active applications
        if item.job and item.job.deadline and s in ("saved", "applied"):
            dl = item.job.deadline if item.job.deadline.tzinfo else item.job.deadline.replace(tzinfo=timezone.utc)
            nw = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
            days = (dl - nw).days
            if 0 <= days <= 7:
                upcoming_deadlines.append({
                    "job_id": item.job.id,
                    "title": item.job.title,
                    "company": item.job.company,
                    "deadline": item.job.deadline.isoformat(),
                    "days_remaining": days,
                })

        # Check interview reminders
        if item.interview_date:
            iv = item.interview_date if item.interview_date.tzinfo else item.interview_date.replace(tzinfo=timezone.utc)
            nw = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
            if iv >= nw:
                upcoming_interviews.append({
                    "application_id": item.id,
                    "title": item.job.title if item.job else "Interview",
                    "company": item.job.company if item.job else "Company",
                    "interview_date": item.interview_date.isoformat(),
                })

    return {
        "total_tracked": len(saved_items),
        "by_status": by_status,
        "upcoming_deadlines": upcoming_deadlines,
        "upcoming_interviews": upcoming_interviews,
    }


@router.get("/saved/my")
def get_my_saved_opportunities(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    List candidate's saved and active tracked opportunities with full details.
    """
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
            "category": item.job.category if item.job else "job",
            "salary_range": item.job.salary_range if item.job else None,
            "source": item.job.source if item.job else "Verified Source",
            "source_url": item.job.source_url if item.job else None,
            "deadline": item.job.deadline.isoformat() if item.job and item.job.deadline else None,
            "status": item.status,
            "notes": item.notes,
            "interview_date": item.interview_date.isoformat() if item.interview_date else None,
            "follow_up_date": item.follow_up_date.isoformat() if item.follow_up_date else None,
            "external_tracking_url": item.external_tracking_url,
            "application_data": item.application_data,
            "job_posting": {
                "id": item.job.id,
                "title": item.job.title,
                "company": item.job.company,
                "location": item.job.location,
            } if item.job else None,
            "saved_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        }
        for item in saved_items
    ]


@router.patch("/saved/{saved_id}/status")
def update_saved_opportunity_status(
    saved_id: int,
    payload: StatusUpdateRequest,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Update tracking pipeline status (Saved, Applied, Assessment, Interview, Offer, Rejected, Withdrawn)
    along with notes, interview date, and follow-up reminders.
    """
    saved = (
        db.query(SavedOpportunity)
        .filter(SavedOpportunity.id == saved_id, SavedOpportunity.user_id == current_user.id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Tracked opportunity not found.")

    saved.status = payload.status.lower()
    if payload.notes is not None:
        saved.notes = payload.notes
    if payload.external_tracking_url is not None:
        saved.external_tracking_url = payload.external_tracking_url

    if payload.interview_date:
        try:
            saved.interview_date = datetime.fromisoformat(payload.interview_date.replace("Z", "+00:00"))
        except ValueError:
            pass
    elif payload.interview_date == "":
        saved.interview_date = None

    if payload.follow_up_date:
        try:
            saved.follow_up_date = datetime.fromisoformat(payload.follow_up_date.replace("Z", "+00:00"))
        except ValueError:
            pass
    elif payload.follow_up_date == "":
        saved.follow_up_date = None

    saved.updated_at = utcnow()

    db.add(AuditLog(
        user_id=current_user.id,
        action="opportunity.status_updated",
        details={"saved_id": saved.id, "status": saved.status},
    ))
    db.commit()
    db.refresh(saved)

    return {
        "message": "Status updated successfully.",
        "id": saved.id,
        "status": saved.status,
        "notes": saved.notes,
        "interview_date": saved.interview_date.isoformat() if saved.interview_date else None,
    }


@router.delete("/saved/{saved_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_opportunity(
    saved_id: int,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Remove an opportunity from tracking dashboard."""
    saved = (
        db.query(SavedOpportunity)
        .filter(SavedOpportunity.id == saved_id, SavedOpportunity.user_id == current_user.id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Tracked opportunity not found.")

    db.delete(saved)
    db.add(AuditLog(
        user_id=current_user.id,
        action="opportunity.unsaved",
        details={"saved_id": saved_id},
    ))
    db.commit()

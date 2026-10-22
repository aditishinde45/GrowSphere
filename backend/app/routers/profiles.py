"""
User Profiles & Skill Evidence router — student/employee profile management,
skill evidence logging, secure PDF/DOCX resume extraction, and privacy controls.
"""

import os
import io
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, UserRole, StudentProfile, EmployeeProfile, Skill, SkillEvidence,
    EvidenceType, SkillLevel, CareerRole, Resume, AuditLog, utcnow
)
from app.schemas import (
    StudentProfileOut, StudentProfileCreate,
    EmployeeProfileOut, EmployeeProfileCreate,
    SkillEvidenceOut, SkillEvidenceCreate,
    ResumeConfirmSkills, ResumeOut
)
from app.dependencies import get_current_user, require_learner, require_student, require_employee
from app.data_pipeline.ml_experiment import extract_skills_explainable

router = APIRouter(prefix="/profiles", tags=["Profiles & Evidence"])


# ─── Resume Text Extraction Helper ────────────────────────────────────
def extract_text_from_upload(filename: str, content: bytes) -> str:
    """Extract raw text from PDF, DOCX, or TXT file bytes without inventing facts."""
    ext = os.path.splitext(filename)[1].lower()
    text = ""
    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        except Exception:
            try:
                from pdfminer.high_level import extract_text as pdfminer_extract
                text = pdfminer_extract(io.BytesIO(content))
            except Exception:
                text = ""
    elif ext in (".docx", ".doc"):
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                if "word/document.xml" in z.namelist():
                    xml_content = z.read("word/document.xml")
                    tree = ET.fromstring(xml_content)
                    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                    texts = [node.text for node in tree.iterfind(".//w:t", ns) if node.text]
                    text = " ".join(texts)
        except Exception:
            text = ""
    else:  # .txt or plain text
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="ignore")
    return text.strip()


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
    if data.location is not None:
        profile.location = data.location
    if data.learning_time_hours_per_week is not None:
        profile.learning_time_hours_per_week = data.learning_time_hours_per_week
    if data.preferred_languages is not None:
        profile.preferred_languages = data.preferred_languages
    if data.opportunity_preferences is not None:
        profile.opportunity_preferences = data.opportunity_preferences
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
    Career goal is returned to the authenticated employee themselves,
    and kept strictly confidential from employers/sellers/mentors.
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
    # Scoped to authenticated employee owner:
    out.career_goal = profile.career_goal
    return out


@router.put("/employee", response_model=EmployeeProfileOut)
def update_employee_profile(
    data: EmployeeProfileCreate,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    """
    Update employee profile details.
    Career goal is stored privately and never exposed to employers.
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
    if data.industry is not None:
        profile.industry = data.industry
    if data.career_goal is not None:
        profile.career_goal = data.career_goal  # Private
    if data.goal_mode is not None:
        profile.goal_mode = data.goal_mode
    if data.career_change_intent is not None:
        profile.career_change_intent = data.career_change_intent
    if data.learning_schedule is not None:
        profile.learning_schedule = data.learning_schedule
    if data.preferences is not None:
        profile.preferences = data.preferences
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
    out.career_goal = profile.career_goal
    return out


# ─── Skill Evidences ──────────────────────────────────────────────────
@router.get("/skills", response_model=List[SkillEvidenceOut])
def get_user_skills(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """List all skill evidences for current user (verified, self-reported, resume, project)."""
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


@router.put("/skills/{evidence_id}", response_model=SkillEvidenceOut)
def update_skill_evidence(
    evidence_id: int,
    payload: dict,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Learner updates level or notes for eligible self-reported evidence."""
    evidence = db.query(SkillEvidence).filter(
        SkillEvidence.id == evidence_id,
        SkillEvidence.user_id == current_user.id,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Skill evidence not found")

    if evidence.evidence_type == EvidenceType.ASSESSED:
        raise HTTPException(status_code=400, detail="Verified assessment evidence cannot be manually modified.")

    if "level" in payload and payload["level"]:
        evidence.level = SkillLevel(payload["level"])
    if "source_description" in payload:
        evidence.source_description = payload["source_description"]
    evidence.updated_at = utcnow()

    db.commit()
    db.refresh(evidence)

    out = SkillEvidenceOut.model_validate(evidence)
    out.skill_name = evidence.skill.canonical_name if evidence.skill else "Unknown"
    return out


@router.delete("/skills/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_skill_evidence(
    evidence_id: int,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Remove self-reported, resume-extracted, or project evidence. Assessed proof is protected."""
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


# ─── Resume Tools: Upload, Scan, List, Delete ─────────────────────────
@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form(None),
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Securely upload PDF/DOCX/TXT resume, extract text without inventing facts,
    and analyze against target career role.
    """
    allowed_exts = {".pdf", ".docx", ".doc", ".txt"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Please upload a PDF, DOCX, or TXT document.",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    extracted_text = extract_text_from_upload(file.filename or "resume.txt", content)
    if not extracted_text:
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded file.")

    # Storage directory
    upload_dir = os.path.join("storage", "resumes", str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = f"{utcnow().strftime('%Y%m%d%H%M%S')}_{os.path.basename(file.filename or 'resume')}"
    file_path = os.path.join(upload_dir, safe_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    # Explainable skill extraction
    extraction_result = extract_skills_explainable(extracted_text)

    # ATS analysis against target role
    target = target_role or "Data Analyst"
    from app.services.ai_service import ai_provider
    ats_results = ai_provider.analyze_resume_ats(extracted_text, target)

    resume_record = Resume(
        user_id=current_user.id,
        filename=file.filename or "resume",
        file_path=file_path,
        file_size_bytes=len(content),
        extracted_text=extracted_text,
        extracted_skills=extraction_result.get("extracted_skills", []),
        processing_status="completed",
        uploaded_at=utcnow(),
    )
    db.add(resume_record)
    db.add(AuditLog(
        user_id=current_user.id,
        action="resume.uploaded",
        details={"filename": file.filename, "size": len(content), "skills_found": len(extraction_result.get("extracted_skills", []))},
    ))
    db.commit()
    db.refresh(resume_record)

    return {
        "id": resume_record.id,
        "filename": resume_record.filename,
        "file_size_bytes": resume_record.file_size_bytes,
        "extracted_text_preview": extracted_text[:400] + ("..." if len(extracted_text) > 400 else ""),
        "extracted_skills": extraction_result.get("extracted_skills", []),
        "ats_analysis": ats_results,
        "uploaded_at": resume_record.uploaded_at.isoformat(),
        "message": "Resume uploaded and scanned. Review and confirm extracted skills to add them to your profile.",
    }


@router.get("/resume")
def list_user_resumes(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """List all uploaded resumes for the current learner."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "file_size_bytes": r.file_size_bytes,
            "extracted_text_preview": (r.extracted_text[:200] + "...") if r.extracted_text else "",
            "extracted_skills": r.extracted_skills or [],
            "processing_status": r.processing_status,
            "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None,
        }
        for r in resumes
    ]


@router.delete("/resume/{resume_id}")
def delete_user_resume(
    resume_id: int,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Securely delete an uploaded resume and remove stored file."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except OSError:
            pass

    db.delete(resume)
    db.add(AuditLog(
        user_id=current_user.id,
        action="resume.deleted",
        details={"resume_id": resume_id, "filename": resume.filename},
    ))
    db.commit()
    return {"message": "Resume securely deleted."}


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


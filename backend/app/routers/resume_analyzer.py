"""
GrowSphere — ATS Resume Analyzer Router.

Provides endpoints for:
- Uploading and analyzing resumes (PDF/DOCX) against a target role
- Retrieving analysis history for authenticated users
- Fetching individual analysis reports
- Generating PDF reports of analysis results
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, ResumeAnalysis
from app.services.resume_parser import extract_resume_text, compute_ats_analysis
from app.services.ai_service import ai_provider

router = APIRouter(prefix="/resume-analyzer", tags=["ATS Resume Analyzer"])

# Maximum upload size: 5MB
MAX_FILE_SIZE = 5 * 1024 * 1024

SUPPORTED_ROLES = [
    "Software Developer",
    "Full-Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Data Analyst",
    "Data Scientist",
    "AI/ML Engineer",
    "DevOps Engineer",
    "Cybersecurity Analyst",
    "Product Manager",
    "UI/UX Designer",
]


@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a resume (PDF or DOCX) and receive a comprehensive ATS analysis
    with category-wise scoring, role suitability assessment, and improvement suggestions.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")
    
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("pdf", "docx", "doc"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Please upload a PDF or DOCX file."
        )
    
    # Read and validate file size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(file_bytes) / 1024 / 1024:.1f}MB). Maximum allowed: 5MB."
        )
    
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    # Extract text from the resume
    try:
        resume_text = extract_resume_text(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    
    # Validate target role
    if not target_role.strip():
        raise HTTPException(status_code=400, detail="Please select a target role.")
    
    # Run ATS analysis
    analysis = compute_ats_analysis(resume_text, target_role.strip())
    
    # Enhance with AI provider (Gemini or Sandbox)
    try:
        ai_result = ai_provider.analyze_resume_ats(resume_text, target_role.strip())
        if ai_result.get("provider") == "google_gemini_live":
            # Merge AI suggestions into the analysis
            if ai_result.get("suggestions"):
                ai_suggestions = ai_result["suggestions"]
                for suggestion in ai_suggestions[:3]:
                    analysis["suggestions"].append({
                        "priority": "medium",
                        "category": "AI Insight",
                        "text": suggestion if isinstance(suggestion, str) else str(suggestion),
                        "detail": "Powered by AI analysis for deeper insights.",
                    })
            analysis["ai_enhanced"] = True
            analysis["ai_provider"] = "google_gemini_live"
        else:
            analysis["ai_enhanced"] = False
            analysis["ai_provider"] = "sandbox_deterministic"
    except Exception:
        analysis["ai_enhanced"] = False
        analysis["ai_provider"] = "sandbox_deterministic"
    
    # Save analysis to database
    record = ResumeAnalysis(
        user_id=current_user.id,
        filename=file.filename,
        target_role=target_role.strip(),
        resume_text=resume_text[:10000],  # Cap stored text at 10k chars
        ats_score=analysis["ats_score"],
        role_suitability=analysis["role_suitability"],
        analysis_json=analysis,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return {
        "id": record.id,
        "filename": file.filename,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        **analysis,
    }


@router.get("/history")
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all past resume analyses for the authenticated user."""
    analyses = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .limit(50)
        .all()
    )
    
    return [
        {
            "id": a.id,
            "filename": a.filename,
            "target_role": a.target_role,
            "ats_score": a.ats_score,
            "role_suitability": a.role_suitability,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]


@router.get("/report/{analysis_id}")
def get_analysis_report(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the full analysis report for a specific analysis."""
    analysis = (
        db.query(ResumeAnalysis)
        .filter(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == current_user.id,
        )
        .first()
    )
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    
    return {
        "id": analysis.id,
        "filename": analysis.filename,
        "target_role": analysis.target_role,
        "ats_score": analysis.ats_score,
        "role_suitability": analysis.role_suitability,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        **analysis.analysis_json,
    }


@router.get("/roles")
def get_supported_roles():
    """Return the list of supported target roles for ATS analysis."""
    return {"roles": SUPPORTED_ROLES}

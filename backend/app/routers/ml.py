"""
ML & Career Intelligence API Router.

Exposes endpoints for:
1. Multi-label skill extraction & taxonomy inference (trained on 39,130+ multi-source postings)
2. Career readiness & competency benchmarking (trained on 25,000 student profiles)
3. Compensation & market demand estimation (trained on 101,500 active records)
4. Model architecture & dataset provenance metadata card
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.models import User
from app.dependencies import get_current_user
from app.services.ml_service import ml_service

router = APIRouter(prefix="/ml", tags=["ML & Career Intelligence"])


# ─── Pydantic Request & Response Schemas ──────────────────────────────
class SkillExtractionRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Resume text, job description, or project snippet")
    threshold: Optional[float] = Field(0.35, ge=0.1, le=0.9, description="Confidence threshold for ML suggestions")


class SkillDetectionItem(BaseModel):
    skill: str
    confidence: float
    detection_method: str
    matched_span: Optional[str] = None
    start_pos: Optional[int] = None
    end_pos: Optional[int] = None
    requires_user_confirmation: Optional[bool] = False


class SkillExtractionResponse(BaseModel):
    text_snippet: str
    total_detected: int
    extracted_skills: List[SkillDetectionItem]
    training_scale: str


class CareerReadinessRequest(BaseModel):
    cgpa: Optional[float] = Field(7.5, ge=0.0, le=10.0)
    DSA_problems_solved: Optional[int] = Field(50, ge=0)
    GitHub_repos: Optional[int] = Field(5, ge=0)
    hackathons_participated: Optional[int] = Field(1, ge=0)
    development_projects_count: Optional[int] = Field(2, ge=0)
    AI_ML_projects: Optional[int] = Field(1, ge=0)
    internships_completed: Optional[int] = Field(0, ge=0)
    resume_score: Optional[float] = Field(70.0, ge=0.0, le=100.0)
    communication_skills: Optional[float] = Field(7.0, ge=0.0, le=10.0)
    aptitude_score: Optional[float] = Field(70.0, ge=0.0, le=100.0)
    mock_interview_score: Optional[float] = Field(70.0, ge=0.0, le=100.0)
    study_hours_daily: Optional[float] = Field(3.0, ge=0.0)
    self_learning_hours: Optional[float] = Field(2.0, ge=0.0)
    adaptability_score: Optional[float] = Field(7.5, ge=0.0, le=10.0)


class MarketValuationRequest(BaseModel):
    skills: List[str] = Field(..., min_length=1)
    experience_level: Optional[str] = Field("entry", description="entry / mid / senior")


# ─── Endpoints ────────────────────────────────────────────────────────
@router.post("/extract-skills", response_model=SkillExtractionResponse)
def extract_skills_endpoint(
    req: SkillExtractionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Extracts canonical skills from input text using high-precision deterministic
    spans alongside TF-IDF + Logistic Regression calibrated inference.
    """
    result = ml_service.predict_skills(req.text, threshold=req.threshold)
    return result


@router.post("/career-readiness")
def career_readiness_endpoint(
    req: CareerReadinessRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates candidate career readiness and benchmark competency index using
    the Gradient Boosting model trained on 25,000 empirical learner profiles.
    """
    candidate_dict = req.model_dump()
    result = ml_service.evaluate_readiness(candidate_dict)
    return result


@router.post("/market-valuation")
def market_valuation_endpoint(
    req: MarketValuationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Estimates market compensation range (INR) and demand growth index based
    on empirical distributions across 101,500 active industry records.
    """
    result = ml_service.estimate_market_valuation(req.skills, req.experience_level)
    return result


@router.get("/model-card")
def get_model_card(current_user: User = Depends(get_current_user)):
    """
    Returns full model metadata, training corpus provenance across 16 raw data sources,
    and evaluation metrics.
    """
    return ml_service.model_metadata or {
        "status": "active_models_operational",
        "taxonomy_size": len(ml_service.skills_list),
        "canonical_skills": ml_service.skills_list,
    }

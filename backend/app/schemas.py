"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List, Union, Any
from pydantic import BaseModel, EmailStr, Field


# ─── Auth ─────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., pattern="^(student|employee|seller|mentor)$")


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class EmailVerificationConfirm(BaseModel):
    token: str


class OnboardingData(BaseModel):
    target_role_id: Optional[int] = None
    education: Optional[str] = None
    college: Optional[str] = None
    location: Optional[str] = None
    graduation_year: Optional[int] = None
    learning_time_hours_per_week: Optional[float] = None
    preferred_languages: Optional[List[str]] = None
    opportunity_preferences: Optional[List[str]] = None
    initial_skills: Optional[List[int]] = None
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    years_experience: Optional[float] = None
    industry: Optional[str] = None
    career_goal: Optional[str] = None
    goal_mode: Optional[str] = None
    career_change_intent: Optional[str] = None
    learning_schedule: Optional[str] = None
    preferences: Optional[dict] = None


# ─── Student Profile ─────────────────────────────────────────────────
class StudentProfileCreate(BaseModel):
    target_role_id: Optional[int] = None
    education: Optional[str] = None
    college: Optional[str] = None
    graduation_year: Optional[int] = None
    location: Optional[str] = None
    learning_time_hours_per_week: Optional[float] = None
    preferred_languages: Optional[List[str]] = None
    opportunity_preferences: Optional[List[str]] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class StudentProfileOut(StudentProfileCreate):
    id: int
    user_id: int
    created_at: datetime
    target_role_title: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Employee Profile ────────────────────────────────────────────────
class EmployeeProfileCreate(BaseModel):
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    target_role_id: Optional[int] = None
    years_experience: Optional[float] = None
    industry: Optional[str] = None
    career_goal: Optional[str] = None
    goal_mode: Optional[str] = Field(None, pattern="^(promotion|reskill|career_switch)$")
    career_change_intent: Optional[str] = None
    learning_schedule: Optional[str] = None
    preferences: Optional[dict] = None
    bio: Optional[str] = None


class EmployeeProfileOut(BaseModel):
    id: int
    user_id: int
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    target_role_id: Optional[int] = None
    years_experience: Optional[float] = None
    industry: Optional[str] = None
    career_goal: Optional[str] = None  # Returned to authenticated owner only; omitted when shared
    goal_mode: Optional[str] = None
    career_change_intent: Optional[str] = None
    learning_schedule: Optional[str] = None
    preferences: Optional[dict] = None
    bio: Optional[str] = None
    created_at: datetime
    target_role_title: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Seller Profile ──────────────────────────────────────────────────
class SellerProfileCreate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None


class SellerProfileOut(SellerProfileCreate):
    id: int
    user_id: int
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Mentor Profile ──────────────────────────────────────────────────
class MentorProfileCreate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    bio: Optional[str] = None
    expertise: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    hourly_rate: Optional[float] = None


class MentorProfileOut(MentorProfileCreate):
    id: int
    user_id: int
    is_verified: bool
    is_available: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Skills ───────────────────────────────────────────────────────────
class SkillOut(BaseModel):
    id: int
    canonical_name: str
    category: Optional[str] = None
    description: Optional[str] = None
    aliases: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class CareerRoleOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    industry: Optional[str] = None
    level: Optional[str] = None
    required_skills: List[SkillOut] = []

    model_config = {"from_attributes": True}


# ─── Gap Analysis ────────────────────────────────────────────────────
class SkillGapItem(BaseModel):
    skill: SkillOut
    required: bool = True
    user_evidence_type: Optional[str] = None  # None means gap
    user_level: Optional[str] = None
    confidence: Optional[float] = None
    status: str  # "verified" / "self_reported" / "gap"


class GapAnalysisOut(BaseModel):
    career_role: CareerRoleOut
    total_required: int
    verified_count: int
    self_reported_count: int
    gap_count: int
    readiness_score: float  # 0.0-1.0
    skill_details: List[SkillGapItem]
    explanation: str  # Why this score


# ─── Roadmap ──────────────────────────────────────────────────────────
class RoadmapTopicOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    title: str
    description: Optional[str] = None
    order: int
    is_completed: bool
    is_locked: bool
    assessment_id: Optional[int] = None
    recommended_resources: Optional[list] = None
    estimated_hours: Optional[int] = None
    prerequisites: List[str] = []
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RoadmapOut(BaseModel):
    id: int
    career_role_id: int
    career_role_title: str
    title: str
    overall_progress: float
    is_active: bool
    topics: List[RoadmapTopicOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Assessment ───────────────────────────────────────────────────────
class AssessmentOut(BaseModel):
    id: int
    skill_id: int
    title: str
    description: Optional[str] = None
    assessment_type: str
    pass_threshold: float
    max_attempts: int
    time_limit_minutes: Optional[int] = None

    model_config = {"from_attributes": True}


class AssessmentDetailOut(AssessmentOut):
    questions: list = []  # List of questions with options, without correct_answer


class AssessmentSubmit(BaseModel):
    answers: dict  # question_id -> selected_option_or_answer
    time_taken_seconds: Optional[int] = None


class AttemptOut(BaseModel):
    id: int
    assessment_id: int
    attempt_number: int
    score: float
    passed: bool
    feedback: Optional[dict] = None
    weak_areas: Optional[list] = None
    revision_resources: Optional[list] = None
    time_taken_seconds: Optional[int] = None
    completed_at: datetime

    model_config = {"from_attributes": True}


# ─── Evidence & Resume ───────────────────────────────────────────────
class SkillEvidenceCreate(BaseModel):
    skill_id: int
    level: Optional[str] = "beginner"
    source_description: Optional[str] = "Self-reported"


class SkillEvidenceOut(BaseModel):
    id: int
    user_id: int
    skill_id: int
    skill_name: Optional[str] = None
    evidence_type: str
    level: Optional[str] = None
    confidence_score: Optional[float] = None
    confidence_explanation: Optional[str] = None
    source_description: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeOut(BaseModel):
    id: int
    filename: str
    file_size_bytes: Optional[int] = None
    extracted_skills: Optional[list] = None
    user_confirmed_skills: Optional[list] = None
    processing_status: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ResumeConfirmSkills(BaseModel):
    confirmed_skills: List[str]


class ResumeOut(BaseModel):
    id: int
    user_id: int
    filename: str
    file_size_bytes: Optional[int] = None
    extracted_text_preview: Optional[str] = None
    extracted_skills: Optional[list] = None
    user_confirmed_skills: Optional[list] = None
    processing_status: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


# ─── Courses ──────────────────────────────────────────────────────────
class CourseCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    description: Optional[str] = None
    url: Optional[str] = None
    level: Optional[str] = "beginner"
    price: float = 0.0
    is_free: bool = True
    subject: Optional[str] = None
    duration_hours: Optional[float] = None
    skill_ids: List[int] = []


class CourseOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    platform: Optional[str] = None
    level: Optional[str] = None
    price: float
    is_free: bool
    subject: Optional[str] = None
    institution: Optional[str] = None
    rating: Optional[float] = None
    num_enrolled: Optional[int] = None
    is_demo_data: bool
    skills: List[SkillOut] = []

    model_config = {"from_attributes": True}


class CourseRecommendation(BaseModel):
    course: CourseOut
    relevance_score: float
    matched_skills: List[str]
    explanation: str  # Why this course is recommended


# ─── Jobs ─────────────────────────────────────────────────────────────
class JobPostingOut(BaseModel):
    id: int
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    source: str
    source_url: Optional[str] = None
    source_date: Optional[datetime] = None
    last_verified: Optional[datetime] = None
    is_remote: Optional[bool] = None
    experience_required: Optional[str] = None
    salary_range: Optional[str] = None
    category: Optional[str] = None
    deadline: Optional[datetime] = None
    required_skills: List[SkillOut] = []

    model_config = {"from_attributes": True}


class JobMatchOut(BaseModel):
    job: JobPostingOut
    match_score: float  # 0.0-1.0
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: str  # Transparent breakdown


# ─── Mentor Offerings & Bookings ─────────────────────────────────────
class MentorOfferingCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    offering_type: str = "one_on_one"
    duration_minutes: int = 45
    price: float = 0.0


class MentorOfferingOut(BaseModel):
    id: int
    mentor_id: int
    title: str
    description: Optional[str] = None
    offering_type: str
    duration_minutes: int
    price: float

    model_config = {"from_attributes": True}


class BookingCreate(BaseModel):
    offering_id: int
    scheduled_at: datetime
    learner_notes: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(accepted|confirmed|declined|cancelled|completed)$")
    mentor_notes: Optional[str] = None
    session_link: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    learner_id: int
    mentor_id: int
    offering_id: int
    status: str
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    session_link: Optional[str] = None
    learner_notes: Optional[str] = None
    mentor_notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Dashboard ────────────────────────────────────────────────────────
class StudentDashboard(BaseModel):
    user: UserOut
    profile: Optional[StudentProfileOut] = None
    target_role: Optional[CareerRoleOut] = None
    gap_analysis: Optional[GapAnalysisOut] = None
    active_roadmap: Optional[RoadmapOut] = None
    recent_attempts: List[AttemptOut] = []
    recommended_courses: List[CourseRecommendation] = []
    job_matches: List[JobMatchOut] = []
    upcoming_sessions: List[BookingOut] = []
    saved_opportunities: List[dict] = []
    next_action: Optional[dict] = None
    real_time_market_demand: Optional[dict] = None


class EmployeeDashboard(BaseModel):
    user: UserOut
    profile: Optional[EmployeeProfileOut] = None
    target_role: Optional[CareerRoleOut] = None
    gap_analysis: Optional[GapAnalysisOut] = None
    active_roadmap: Optional[RoadmapOut] = None
    recent_attempts: List[AttemptOut] = []
    recommended_courses: List[CourseRecommendation] = []
    job_matches: List[JobMatchOut] = []
    upcoming_sessions: List[BookingOut] = []
    transferable_summary: Optional[dict] = None
    next_action: Optional[dict] = None


class SellerDashboard(BaseModel):
    user: UserOut
    profile: Optional[SellerProfileOut] = None
    courses: List[CourseOut] = []
    total_enrollments: int = 0
    published_count: int = 0


class MentorDashboard(BaseModel):
    user: UserOut
    profile: Optional[MentorProfileOut] = None
    offerings: List[MentorOfferingOut] = []
    upcoming_bookings: List[BookingOut] = []
    total_completed_sessions: int = 0


# ─── Auth Extensions & Onboarding ─────────────────────────────────────
class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)





class PrivacySettingsUpdate(BaseModel):
    share_evidence_with_mentors: Optional[bool] = None
    public_passport: Optional[bool] = None
    hide_private_goals: Optional[bool] = None


# ─── Skill Passport ───────────────────────────────────────────────────
class SkillPassportOut(BaseModel):
    slug: str
    is_public: bool
    is_revoked: bool
    verified_at: datetime
    share_url: str
    custom_title: Optional[str] = None
    user_name: str
    evidence_breakdown: List[dict] = []

    model_config = {"from_attributes": True}


# ─── Credit Ledger & Payments ─────────────────────────────────────────
class CreditBalanceOut(BaseModel):
    balance: int
    transactions: List[dict] = []


class CreditGrantRequest(BaseModel):
    user_id: Optional[int] = None
    amount: int
    description: str
    idempotency_key: str


class CheckoutRequest(BaseModel):
    item_type: str = "course"  # course / mentorship
    item_id: Optional[int] = None
    course_id: Optional[int] = None
    amount: float
    payment_method: Optional[str] = "sandbox_card"
    idempotency_key: str


class CourseCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    description: Optional[str] = None
    price: float = 0.0
    level: Optional[str] = "beginner"
    duration_hours: Optional[float] = 10.0
    subject: Optional[str] = "Data & AI"
    skill_ids: List[int] = []


class CourseReviewCreate(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)
    review_text: Optional[str] = None


class MentorAvailabilitySlotCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time_str: str = "09:00"
    end_time_str: str = "17:00"


class MentorEndorsementCreate(BaseModel):
    learner_id: int
    skill_id: int
    level: str = "intermediate"
    comment: Optional[str] = None


# ─── AI Mock Interview & Practice ─────────────────────────────────────
class MockInterviewStartRequest(BaseModel):
    role_id: Optional[int] = None
    target_role: Optional[str] = "Data Analyst"
    interview_type: Optional[str] = "technical"
    idempotency_key: Optional[str] = None


class MockInterviewSubmitRequest(BaseModel):
    responses: Optional[dict] = None  # {question_id: answer_text}
    question_id: Optional[Union[int, str]] = None
    learner_answer: Optional[str] = None


class CareerTransitionRequest(BaseModel):
    current_role: str
    target_role_id: Optional[int] = None
    target_role: Optional[str] = None


class RoleBasedTaskSubmit(BaseModel):
    submission_url: Optional[str] = None
    solution_url: Optional[str] = None
    submission_notes: Optional[str] = None


class SavedOpportunityCreate(BaseModel):
    job_id: int
    status: str = "saved"
    notes: Optional[str] = None


class UserReportCreate(BaseModel):
    reported_user_id: Optional[int] = None
    reported_listing_type: Optional[str] = None
    reported_listing_id: Optional[int] = None
    category: str = "other"
    details: str = Field(..., min_length=5)


class ListingModerationRequest(BaseModel):
    listing_type: str  # course / mentor
    listing_id: int
    action: str  # approve / reject / changes_requested
    reason: str = Field(..., min_length=3)  # Mandatory recorded reason



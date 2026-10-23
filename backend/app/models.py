"""
GrowSphere — SQLAlchemy ORM models (Phase 1 MVP entities).

Implements the MVP subset of the 32-entity data model:
  User, Role, StudentProfile, EmployeeProfile, SellerProfile, MentorProfile,
  Skill, SkillDependency, CareerRole, JobPosting, Resume, SkillEvidence,
  SkillAssessment, AssessmentAttempt, Roadmap, RoadmapTopic, Course,
  MentorOffering, Booking, AuditLog
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime,
    ForeignKey, Enum, JSON, UniqueConstraint, Index, Table,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# ─── Helpers ──────────────────────────────────────────────────────────
def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ─── Enums ────────────────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    STUDENT = "student"
    EMPLOYEE = "employee"
    SELLER = "seller"
    MENTOR = "mentor"
    ADMIN = "admin"


class ListingStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    PAUSED = "paused"
    ARCHIVED = "archived"


class BookingStatus(str, enum.Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class EvidenceType(str, enum.Enum):
    SELF_REPORTED = "self_reported"
    RESUME_EXTRACTED = "resume_extracted"
    ASSESSED = "assessed"
    PROJECT = "project"
    MENTOR_ENDORSED = "mentor_endorsed"


class SkillLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


# ─── Association tables ───────────────────────────────────────────────
# Many-to-many: CareerRole <-> Skill
career_role_skills = Table(
    "career_role_skills",
    Base.metadata,
    Column("career_role_id", Integer, ForeignKey("career_roles.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
    Column("importance", Float, default=1.0),  # 0.0-1.0 weight for the role
)

# Many-to-many: Course <-> Skill
course_skills = Table(
    "course_skills",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
)

# Many-to-many: JobPosting <-> Skill
job_posting_skills = Table(
    "job_posting_skills",
    Base.metadata,
    Column("job_posting_id", Integer, ForeignKey("job_postings.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
)


# ─── User & Auth ──────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=True, server_default="1", nullable=False)
    privacy_settings = Column(JSON, default=lambda: {"share_evidence_with_mentors": True, "public_passport": True, "hide_private_goals": True})
    notification_preferences = Column(JSON, default=lambda: {"email_notifications": True, "session_reminders": True, "weekly_digest": True})
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    employee_profile = relationship("EmployeeProfile", back_populates="user", uselist=False)
    seller_profile = relationship("SellerProfile", back_populates="user", uselist=False)
    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False)
    resumes = relationship("Resume", back_populates="user")
    skill_evidences = relationship("SkillEvidence", back_populates="user")
    roadmaps = relationship("Roadmap", back_populates="user")


# ─── Profiles ─────────────────────────────────────────────────────────
class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    target_role_id = Column(Integer, ForeignKey("career_roles.id"), nullable=True)
    education = Column(Text, nullable=True)
    college = Column(String(255), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    learning_time_hours_per_week = Column(Float, nullable=True)
    preferred_languages = Column(JSON, nullable=True)  # List of language strings, e.g. ["English"]
    opportunity_preferences = Column(JSON, nullable=True)  # e.g. ["internship", "job", "hackathon"]
    bio = Column(Text, nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="student_profile")
    target_role = relationship("CareerRole")


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    current_role = Column(String(255), nullable=True)
    current_company = Column(String(255), nullable=True)
    target_role_id = Column(Integer, ForeignKey("career_roles.id"), nullable=True)
    years_experience = Column(Float, nullable=True)
    industry = Column(String(255), nullable=True)
    career_goal = Column(Text, nullable=True)  # Private — never exposed without consent
    goal_mode = Column(String(50), nullable=True)  # promotion / reskill / career_switch
    career_change_intent = Column(String(255), nullable=True)  # e.g. actively_looking / internal_promotion
    learning_schedule = Column(String(255), nullable=True)  # e.g. "Evenings & weekends (8 hrs/week)"
    preferences = Column(JSON, nullable=True)  # e.g. {"remote_preference": "hybrid"}
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="employee_profile")
    target_role = relationship("CareerRole")


class SellerProfile(Base):
    __tablename__ = "seller_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    display_name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="seller_profile")
    courses = relationship("Course", back_populates="seller")


class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    display_name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    expertise = Column(JSON, nullable=True)  # List of skill areas
    languages = Column(JSON, nullable=True)  # List of languages
    hourly_rate = Column(Float, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="mentor_profile")
    offerings = relationship("MentorOffering", back_populates="mentor")
    bookings = relationship("Booking", back_populates="mentor")


# ─── Skill Taxonomy ──────────────────────────────────────────────────
class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    canonical_name = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=True)  # e.g. "programming", "analytics", "tools"
    description = Column(Text, nullable=True)
    aliases = Column(JSON, nullable=True)  # List of known synonyms
    taxonomy_version = Column(String(20), default="1.0")
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    career_roles = relationship("CareerRole", secondary=career_role_skills, back_populates="required_skills")
    dependencies_as_parent = relationship(
        "SkillDependency", foreign_keys="SkillDependency.skill_id", back_populates="skill"
    )
    dependencies_as_prereq = relationship(
        "SkillDependency", foreign_keys="SkillDependency.prerequisite_id", back_populates="prerequisite"
    )


class SkillDependency(Base):
    __tablename__ = "skill_dependencies"

    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    prerequisite_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    strength = Column(Float, default=1.0)  # How strongly required (0.0-1.0)

    __table_args__ = (
        UniqueConstraint("skill_id", "prerequisite_id", name="uq_skill_prereq"),
    )

    skill = relationship("Skill", foreign_keys=[skill_id], back_populates="dependencies_as_parent")
    prerequisite = relationship("Skill", foreign_keys=[prerequisite_id], back_populates="dependencies_as_prereq")


class CareerRole(Base):
    __tablename__ = "career_roles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    level = Column(String(50), nullable=True)  # entry / mid / senior
    source = Column(String(255), nullable=True)  # Where this role definition came from
    source_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    required_skills = relationship("Skill", secondary=career_role_skills, back_populates="career_roles")


# ─── Jobs & Opportunities ────────────────────────────────────────────
class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    company = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    source = Column(String(100), nullable=False)  # e.g. "naukri", "greenhouse", "demo"
    source_url = Column(String(1000), nullable=True)
    source_date = Column(DateTime, nullable=True)  # When the posting was originally seen
    last_verified = Column(DateTime, nullable=True)
    is_remote = Column(Boolean, nullable=True)
    experience_required = Column(String(100), nullable=True)
    salary_range = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)  # internship / job / hackathon / event
    eligibility = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    record_state = Column(String(50), default="active_verified", index=True)  # active_verified / historical / expired / incomplete / synthetic_demo / quarantined / duplicate_linked
    provenance = Column(JSON, nullable=True)  # source file, row index, hash, reconciliation notes
    duplicate_of_id = Column(Integer, ForeignKey("job_postings.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    required_skills = relationship("Skill", secondary=job_posting_skills)


# ─── Resume & Evidence ───────────────────────────────────────────────
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(1000), nullable=False)  # Storage path (not public)
    file_size_bytes = Column(Integer, nullable=True)
    extracted_text = Column(Text, nullable=True)  # Raw text extracted from PDF/DOCX
    extracted_skills = Column(JSON, nullable=True)  # ML-extracted skill suggestions
    user_confirmed_skills = Column(JSON, nullable=True)  # User-reviewed final skills
    extraction_model_version = Column(String(50), nullable=True)
    processing_status = Column(String(50), default="pending")  # pending / processing / completed / failed
    uploaded_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="resumes")


class SkillEvidence(Base):
    """
    Each record is one piece of evidence for a user's proficiency in a skill.
    Evidence types are kept distinct: self_reported, assessed, project, mentor_endorsed.
    """
    __tablename__ = "skill_evidences"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    evidence_type = Column(Enum(EvidenceType), nullable=False)
    level = Column(Enum(SkillLevel), nullable=True)
    confidence_score = Column(Float, nullable=True)  # 0.0-1.0, explainable
    confidence_explanation = Column(Text, nullable=True)
    source_description = Column(Text, nullable=True)  # e.g. "Naukri resume extraction", "Python quiz"
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="skill_evidences")
    skill = relationship("Skill")

    __table_args__ = (
        Index("ix_evidence_user_skill", "user_id", "skill_id"),
    )


# ─── Assessment ───────────────────────────────────────────────────────
class SkillAssessment(Base):
    """
    A defined assessment for a skill topic — contains questions/rubric.
    """
    __tablename__ = "skill_assessments"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assessment_type = Column(String(50), nullable=False)  # quiz / practical / simulation
    questions = Column(JSON, nullable=False)  # List of question objects
    rubric = Column(JSON, nullable=True)  # Scoring criteria
    rubric_version = Column(String(20), default="1.0")
    pass_threshold = Column(Float, default=0.7)  # 70% default, configurable
    max_attempts = Column(Integer, default=3)
    time_limit_minutes = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    skill = relationship("Skill")
    attempts = relationship("AssessmentAttempt", back_populates="assessment")


class AssessmentAttempt(Base):
    """
    One attempt at a SkillAssessment by a user.
    Records score, answers, feedback, and weak areas.
    """
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("skill_assessments.id"), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)  # 0.0-1.0
    passed = Column(Boolean, nullable=False)
    answers = Column(JSON, nullable=True)  # User's answers
    feedback = Column(JSON, nullable=True)  # Per-question feedback
    weak_areas = Column(JSON, nullable=True)  # List of specific weak skill areas
    revision_resources = Column(JSON, nullable=True)  # Suggested resources for retry
    time_taken_seconds = Column(Integer, nullable=True)
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, default=utcnow)

    assessment = relationship("SkillAssessment", back_populates="attempts")

    __table_args__ = (
        UniqueConstraint("user_id", "assessment_id", "attempt_number", name="uq_user_assessment_attempt"),
    )


# ─── Roadmap ──────────────────────────────────────────────────────────
class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    career_role_id = Column(Integer, ForeignKey("career_roles.id"), nullable=True)
    skill_name = Column(String(255), nullable=True, index=True)
    current_level = Column(String(50), default="Beginner")
    target_level = Column(String(50), default="Job-Ready / Advanced")
    desired_deadline = Column(String(100), nullable=True)
    estimated_duration = Column(String(100), nullable=True)
    hours_per_week = Column(Integer, default=10)
    status = Column(String(50), default="In Progress")
    is_accelerated = Column(Boolean, default=False)
    deadline_validation = Column(JSON, nullable=True)
    learning_plan = Column(JSON, nullable=True)
    completed_tasks = Column(JSON, default=list)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    overall_progress = Column(Float, default=0.0)  # 0.0-100.0 or 0.0-1.0
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="roadmaps")
    career_role = relationship("CareerRole")
    topics = relationship("RoadmapTopic", back_populates="roadmap", order_by="RoadmapTopic.order")


class RoadmapTopic(Base):
    __tablename__ = "roadmap_topics"

    id = Column(Integer, primary_key=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)  # Sequence position
    is_completed = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=True)  # Locked until prerequisites are met
    assessment_id = Column(Integer, ForeignKey("skill_assessments.id"), nullable=True)
    recommended_resources = Column(JSON, nullable=True)  # Course/resource suggestions
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    roadmap = relationship("Roadmap", back_populates="topics")
    skill = relationship("Skill")
    assessment = relationship("SkillAssessment")


# ─── Courses ──────────────────────────────────────────────────────────
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("seller_profiles.id"), nullable=True)  # Null for external courses
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(1000), nullable=True)
    platform = Column(String(100), nullable=True)  # udemy / mooc / edx / internal
    level = Column(String(50), nullable=True)  # beginner / intermediate / advanced
    price = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    is_free = Column(Boolean, default=True)
    subject = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=True)
    duration_hours = Column(Float, nullable=True)
    rating = Column(Float, nullable=True)
    num_reviews = Column(Integer, nullable=True)
    num_enrolled = Column(Integer, nullable=True)
    listing_status = Column(Enum(ListingStatus), default=ListingStatus.PUBLISHED)
    record_state = Column(String(50), default="active_verified", index=True)  # active_verified / historical / expired / incomplete / synthetic_demo / quarantined / duplicate_linked
    provenance = Column(JSON, nullable=True)  # source file, row index, hash, reconciliation notes
    source_last_checked = Column(DateTime, nullable=True)
    is_demo_data = Column(Boolean, default=False)  # Explicitly labeled
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    seller = relationship("SellerProfile", back_populates="courses")
    skills = relationship("Skill", secondary=course_skills)


# ─── Mentor Offerings & Bookings ─────────────────────────────────────
class MentorOffering(Base):
    __tablename__ = "mentor_offerings"

    id = Column(Integer, primary_key=True)
    mentor_id = Column(Integer, ForeignKey("mentor_profiles.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    offering_type = Column(String(50), nullable=False)  # one_on_one / mock_interview / resume_review / group
    duration_minutes = Column(Integer, nullable=False)
    price = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    mentor = relationship("MentorProfile", back_populates="offerings")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True)
    learner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mentor_id = Column(Integer, ForeignKey("mentor_profiles.id"), nullable=False, index=True)
    offering_id = Column(Integer, ForeignKey("mentor_offerings.id"), nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.REQUESTED, nullable=False)
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    learner_notes = Column(Text, nullable=True)
    mentor_notes = Column(Text, nullable=True)
    cancel_reason = Column(Text, nullable=True)
    session_link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    mentor = relationship("MentorProfile", back_populates="bookings")
    offering = relationship("MentorOffering")

    __table_args__ = (
        Index("ix_booking_mentor_schedule", "mentor_id", "scheduled_at"),
    )


# ─── Audit ────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # e.g. "user.login", "course.approve", "booking.cancel"
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)


# ─── Data Usage Register ─────────────────────────────────────────────
class DataUsageRecord(Base):
    """
    Mandatory Data Usage Register entity for platform governance.
    Tracks every raw dataset, file hash, row counts, assigned role, deduplication, and restrictions.
    """
    __tablename__ = "data_usage_register"

    id = Column(Integer, primary_key=True)
    source_filename = Column(String(255), unique=True, nullable=False, index=True)
    file_type = Column(String(50), nullable=False)  # dataset / reference_doc / architecture
    sha256_hash = Column(String(64), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    raw_row_count = Column(Integer, nullable=True)
    processed_row_count = Column(Integer, nullable=True)
    distinct_count = Column(Integer, nullable=True)
    excluded_count = Column(Integer, nullable=True)
    deduplication_method = Column(Text, nullable=True)
    quality_issues = Column(Text, nullable=True)
    assigned_use = Column(Text, nullable=False)
    restrictions = Column(Text, nullable=True)
    status = Column(String(50), default="processed")  # processed / archived / quarantined / reference
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)


# ─── Skill Passport & Public Verification ─────────────────────────────
class SkillPassport(Base):
    __tablename__ = "skill_passports"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    custom_title = Column(String(255), nullable=True)
    is_public = Column(Boolean, default=True)
    is_revoked = Column(Boolean, default=False)
    share_token = Column(String(64), nullable=True)
    verified_at = Column(DateTime, default=utcnow)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User")


# ─── Course Marketplace Extensions ────────────────────────────────────
class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    progress_percentage = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    enrolled_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_enrollment"),
    )

    user = relationship("User")
    course = relationship("Course")


class CourseReview(Base):
    __tablename__ = "course_reviews"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    rating = Column(Float, nullable=False)
    review_text = Column(Text, nullable=True)
    is_verified_purchase = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_review"),
    )

    user = relationship("User")
    course = relationship("Course")


# ─── Mentor Availability & Endorsements ──────────────────────────────
class MentorAvailabilitySlot(Base):
    __tablename__ = "mentor_availability_slots"

    id = Column(Integer, primary_key=True)
    mentor_id = Column(Integer, ForeignKey("mentor_profiles.id"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time_str = Column(String(10), nullable=False)  # "09:00"
    end_time_str = Column(String(10), nullable=False)  # "17:00"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    mentor = relationship("MentorProfile")


class MentorEndorsement(Base):
    __tablename__ = "mentor_endorsements"

    id = Column(Integer, primary_key=True)
    mentor_id = Column(Integer, ForeignKey("mentor_profiles.id"), nullable=False, index=True)
    learner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    level = Column(Enum(SkillLevel), default=SkillLevel.INTERMEDIATE)
    comment = Column(Text, nullable=True)
    evidence_url = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    mentor = relationship("MentorProfile")
    learner = relationship("User", foreign_keys=[learner_id])
    skill = relationship("Skill")


# ─── Credit Ledger & Monetization ─────────────────────────────────────
class CreditLedger(Base):
    """
    Auditable, idempotent ledger for grants, reservations, consumption, refunds, and adjustments.
    """
    __tablename__ = "credit_ledger"

    id = Column(Integer, primary_key=True)
    idempotency_key = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # Positive for grant/refund, negative for consumption
    balance_after = Column(Integer, nullable=False)
    transaction_type = Column(String(50), nullable=False)  # grant, reserve, consume, refund, adjustment
    description = Column(String(255), nullable=True)
    reference_type = Column(String(50), nullable=True)  # mock_interview, payment, course, admin_grant
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)

    user = relationship("User")


class PaymentOrder(Base):
    """
    Monetization order supporting sandbox provider, commission calculation, and payouts.
    """
    __tablename__ = "payment_orders"

    id = Column(Integer, primary_key=True)
    idempotency_key = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="pending", index=True)  # pending, completed, failed, refunded
    provider = Column(String(50), default="sandbox")  # sandbox / stripe / razorpay
    provider_payment_id = Column(String(100), nullable=True)
    commission_amount = Column(Float, default=0.0)  # Platform commission
    seller_payout_amount = Column(Float, default=0.0)
    items_json = Column(JSON, nullable=True)
    receipt_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User")


class PayoutRecord(Base):
    __tablename__ = "payout_records"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user_role = Column(String(50), nullable=False)  # seller / mentor
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="completed", index=True)  # pending, processing, completed, failed
    notes = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User")


# ─── Mock Interview & Learning Materials ──────────────────────────────
class MockInterviewSession(Base):
    __tablename__ = "mock_interview_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("career_roles.id"), nullable=False)
    title = Column(String(255), nullable=False)
    credit_cost = Column(Integer, default=10)
    status = Column(String(50), default="completed")  # scheduled, in_progress, completed, cancelled
    consent_given = Column(Boolean, default=True)
    questions = Column(JSON, nullable=True)
    responses = Column(JSON, nullable=True)
    interview_mode = Column(String(50), default="voice")  # voice, text_rubric
    duration_minutes = Column(Integer, default=15)
    resume_context = Column(Text, nullable=True)
    transcript = Column(JSON, nullable=True)  # List of {speaker, text, timestamp, is_followup, etc.}
    analytics = Column(JSON, nullable=True)  # 5-pillar scores, fluency, metrics
    feedback_report = Column(JSON, nullable=True)
    overall_score = Column(Float, nullable=True)  # 0.0-1.0
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User")
    role = relationship("CareerRole")


class LearningMaterial(Base):
    __tablename__ = "learning_materials"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("roadmap_topics.id"), nullable=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    material_type = Column(String(50), nullable=False)  # notes, flashcards, practice_questions
    title = Column(String(255), nullable=False)
    content_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User")
    topic = relationship("RoadmapTopic")
    skill = relationship("Skill")


# ─── Career Transition & Practical Tasks ──────────────────────────────
class CareerTransitionAnalysis(Base):
    __tablename__ = "career_transition_analyses"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    current_role = Column(String(255), nullable=False)
    target_role_id = Column(Integer, ForeignKey("career_roles.id"), nullable=False)
    transferable_skills = Column(JSON, nullable=True)
    missing_skills = Column(JSON, nullable=True)
    match_score = Column(Float, nullable=False)
    estimated_effort_weeks = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User")
    target_role = relationship("CareerRole")


class RoleBasedTask(Base):
    __tablename__ = "role_based_tasks"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("career_roles.id"), nullable=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    rubric = Column(JSON, nullable=True)
    submission_url = Column(String(1000), nullable=True)
    status = Column(String(50), default="pending")  # pending, submitted, evaluated
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User")
    skill = relationship("Skill")


# ─── Saved Opportunities & Tracking ───────────────────────────────────
class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False, index=True)
    status = Column(String(50), default="saved")  # saved, applied, interviewing, offered, rejected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_job_saved"),
    )

    user = relationship("User")
    job = relationship("JobPosting")


# ─── Moderation, Trust & Support ──────────────────────────────────────
class UserReport(Base):
    __tablename__ = "user_reports"

    id = Column(Integer, primary_key=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reported_listing_type = Column(String(50), nullable=True)  # course / mentor
    reported_listing_id = Column(Integer, nullable=True)
    category = Column(String(100), nullable=False)  # spam, abuse, misleading, copyright, other
    details = Column(Text, nullable=False)
    status = Column(String(50), default="open")  # open, in_review, resolved
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])


class ListingModerationReview(Base):
    __tablename__ = "listing_moderation_reviews"

    id = Column(Integer, primary_key=True)
    listing_type = Column(String(50), nullable=False)  # course / mentor
    listing_id = Column(Integer, nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)  # approve, reject, changes_requested
    reason = Column(Text, nullable=False)  # Mandatory recorded reason
    created_at = Column(DateTime, default=utcnow)

    reviewer = relationship("User")


# ─── Auth Tokens ──────────────────────────────────────────────────────
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User")

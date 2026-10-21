"""
Role-Specific Dashboards router — aggregates personalized views for
Students, Employees, Course Sellers, and Mentors.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, UserRole, StudentProfile, EmployeeProfile, SellerProfile,
    MentorProfile, CareerRole, AssessmentAttempt, Course, MentorOffering,
    Booking, BookingStatus
)
from app.schemas import (
    StudentDashboard, EmployeeDashboard, SellerDashboard, MentorDashboard,
    UserOut, StudentProfileOut, EmployeeProfileOut, SellerProfileOut,
    MentorProfileOut, CareerRoleOut, AttemptOut, CourseOut, MentorOfferingOut,
    BookingOut
)
from app.dependencies import (
    get_current_user, require_student, require_employee, require_seller, require_mentor
)
from app.routers.skills import get_gap_analysis
from app.routers.roadmap import get_active_roadmap
from app.routers.courses import get_recommended_courses
from app.routers.jobs import get_job_matches

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])


@router.get("/student", response_model=StudentDashboard)
def get_student_dashboard(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Aggregate personalized dashboard for student learners."""
    profile = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.target_role))
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )

    target_role = None
    gap_analysis = None
    active_roadmap = None

    if profile and profile.target_role:
        target_role = CareerRoleOut.model_validate(profile.target_role)
        try:
            gap_analysis = get_gap_analysis(current_user=current_user, db=db)
        except Exception:
            gap_analysis = None

        try:
            active_roadmap = get_active_roadmap(current_user=current_user, db=db)
        except Exception:
            active_roadmap = None

    recent_attempts = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.user_id == current_user.id)
        .order_by(AssessmentAttempt.completed_at.desc())
        .limit(5)
        .all()
    )

    recommended_courses = get_recommended_courses(limit=4, current_user=current_user, db=db)
    job_matches = get_job_matches(limit=4, current_user=current_user, db=db)

    student_profile_out = StudentProfileOut.model_validate(profile) if profile else None
    if profile and profile.target_role and student_profile_out:
        student_profile_out.target_role_title = profile.target_role.title

    return StudentDashboard(
        user=UserOut.model_validate(current_user),
        profile=student_profile_out,
        target_role=target_role,
        gap_analysis=gap_analysis,
        active_roadmap=active_roadmap,
        recent_attempts=[AttemptOut.model_validate(a) for a in recent_attempts],
        recommended_courses=recommended_courses,
        job_matches=job_matches,
    )


@router.get("/employee", response_model=EmployeeDashboard)
def get_employee_dashboard(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    """
    Aggregate personalized dashboard for employee upskilling/reskilling.
    Career goal is omitted from public responses (privacy first).
    """
    profile = (
        db.query(EmployeeProfile)
        .options(joinedload(EmployeeProfile.target_role))
        .filter(EmployeeProfile.user_id == current_user.id)
        .first()
    )

    target_role = None
    gap_analysis = None
    active_roadmap = None

    if profile and profile.target_role:
        target_role = CareerRoleOut.model_validate(profile.target_role)
        try:
            gap_analysis = get_gap_analysis(current_user=current_user, db=db)
        except Exception:
            gap_analysis = None

        try:
            active_roadmap = get_active_roadmap(current_user=current_user, db=db)
        except Exception:
            active_roadmap = None

    recent_attempts = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.user_id == current_user.id)
        .order_by(AssessmentAttempt.completed_at.desc())
        .limit(5)
        .all()
    )

    recommended_courses = get_recommended_courses(limit=4, current_user=current_user, db=db)

    emp_profile_out = EmployeeProfileOut.model_validate(profile) if profile else None
    if profile and profile.target_role and emp_profile_out:
        emp_profile_out.target_role_title = profile.target_role.title

    return EmployeeDashboard(
        user=UserOut.model_validate(current_user),
        profile=emp_profile_out,
        target_role=target_role,
        gap_analysis=gap_analysis,
        active_roadmap=active_roadmap,
        recent_attempts=[AttemptOut.model_validate(a) for a in recent_attempts],
        recommended_courses=recommended_courses,
    )


@router.get("/seller", response_model=SellerDashboard)
def get_seller_dashboard(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """Aggregate dashboard metrics for course sellers."""
    profile = db.query(SellerProfile).filter(SellerProfile.user_id == current_user.id).first()
    if not profile:
        profile = SellerProfile(user_id=current_user.id, display_name=current_user.full_name)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    courses = db.query(Course).options(joinedload(Course.skills)).filter(Course.seller_id == profile.id).all()
    total_enrolled = sum(c.num_enrolled or 0 for c in courses)

    return SellerDashboard(
        user=UserOut.model_validate(current_user),
        profile=SellerProfileOut.model_validate(profile),
        courses=[CourseOut.model_validate(c) for c in courses],
        total_enrollments=total_enrolled,
        published_count=len(courses),
    )


@router.get("/mentor", response_model=MentorDashboard)
def get_mentor_dashboard(
    current_user: User = Depends(require_mentor),
    db: Session = Depends(get_db),
):
    """Aggregate dashboard metrics for mentors."""
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if not profile:
        profile = MentorProfile(user_id=current_user.id, display_name=current_user.full_name)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    offerings = db.query(MentorOffering).filter(MentorOffering.mentor_id == profile.id).all()
    bookings = (
        db.query(Booking)
        .filter(Booking.mentor_id == profile.id)
        .order_by(Booking.scheduled_at.desc())
        .limit(10)
        .all()
    )

    completed_count = db.query(Booking).filter(
        Booking.mentor_id == profile.id,
        Booking.status == BookingStatus.COMPLETED,
    ).count()

    return MentorDashboard(
        user=UserOut.model_validate(current_user),
        profile=MentorProfileOut.model_validate(profile),
        offerings=[MentorOfferingOut.model_validate(o) for o in offerings],
        upcoming_bookings=[BookingOut.model_validate(b) for b in bookings],
        total_completed_sessions=completed_count,
    )

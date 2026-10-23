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
    from app.models import SavedOpportunity

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

    # Upcoming bookings as learner
    upcoming_bookings = (
        db.query(Booking)
        .filter(Booking.learner_id == current_user.id)
        .order_by(Booking.scheduled_at.desc())
        .limit(5)
        .all()
    )

    # Saved opportunities
    saved_records = (
        db.query(SavedOpportunity)
        .options(joinedload(SavedOpportunity.job))
        .filter(SavedOpportunity.user_id == current_user.id)
        .order_by(SavedOpportunity.updated_at.desc())
        .limit(5)
        .all()
    )
    saved_ops = [
        {
            "id": s.id,
            "job_id": s.job_id,
            "title": s.job.title if s.job else "Saved Opportunity",
            "company": s.job.company if s.job else "",
            "location": s.job.location if s.job else "Remote",
            "status": s.status,
            "notes": s.notes,
        }
        for s in saved_records
    ]

    # Next action determination
    next_action = None
    if not profile or not profile.target_role_id:
        next_action = {
            "type": "onboarding",
            "title": "Select your target career role",
            "description": "Choose a career path to unlock your personalized curriculum and gap analysis.",
            "cta": "Set Target Role",
        }
    elif not active_roadmap or not active_roadmap.topics:
        next_action = {
            "type": "roadmap",
            "title": "Generate your personalized roadmap",
            "description": f"Generate a dependency-ordered learning roadmap for {profile.target_role.title if profile.target_role else 'your target role'}.",
            "cta": "Generate Roadmap",
        }
    else:
        uncompleted = [t for t in active_roadmap.topics if not t.is_completed and not t.is_locked]
        if uncompleted:
            first_t = uncompleted[0]
            next_action = {
                "type": "learn",
                "title": f"Complete: {first_t.title}",
                "description": f"Review learning flashcards and take the practical quiz to verify {first_t.title}.",
                "topic_id": first_t.id,
                "assessment_id": first_t.assessment_id,
                "cta": "Take Assessment" if first_t.assessment_id else "Study Topic",
            }
        else:
            next_action = {
                "type": "opportunities",
                "title": "Roadmap complete! Explore matched opportunities",
                "description": "Your verified skills qualify you for open internships and job postings.",
                "cta": "View Opportunities",
            }

    student_profile_out = StudentProfileOut.model_validate(profile) if profile else None
    if profile and profile.target_role and student_profile_out:
        student_profile_out.target_role_title = profile.target_role.title

    # Compute real-time market demand intelligence from raw Naukri data
    from app.services.market_intelligence import get_student_market_demand_insights
    target_role_name = profile.target_role.title if (profile and profile.target_role) else "Data Analyst"
    real_time_market_demand = get_student_market_demand_insights(
        db=db,
        user_id=current_user.id,
        target_role_title=target_role_name,
    )

    return StudentDashboard(
        user=UserOut.model_validate(current_user),
        profile=student_profile_out,
        target_role=target_role,
        gap_analysis=gap_analysis,
        active_roadmap=active_roadmap,
        recent_attempts=[AttemptOut.model_validate(a) for a in recent_attempts],
        recommended_courses=recommended_courses,
        job_matches=job_matches,
        upcoming_sessions=[BookingOut.model_validate(b) for b in upcoming_bookings],
        saved_opportunities=saved_ops,
        next_action=next_action,
        real_time_market_demand=real_time_market_demand,
    )


@router.get("/employee", response_model=EmployeeDashboard)
def get_employee_dashboard(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    """
    Aggregate personalized dashboard for employee upskilling/reskilling.
    Private goals are exposed ONLY to the authenticated owner.
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
    job_matches = get_job_matches(limit=4, current_user=current_user, db=db)

    # Upcoming bookings
    upcoming_bookings = (
        db.query(Booking)
        .filter(Booking.learner_id == current_user.id)
        .order_by(Booking.scheduled_at.desc())
        .limit(5)
        .all()
    )

    # Transferable skills summary
    transferable_summary = None
    if profile and profile.current_role and profile.target_role:
        from app.routers.career_transition import analyze_career_transition
        from app.schemas import CareerTransitionRequest
        try:
            transferable_summary = analyze_career_transition(
                CareerTransitionRequest(current_role=profile.current_role, target_role_id=profile.target_role_id),
                current_user=current_user,
                db=db,
            )
        except Exception:
            transferable_summary = None

    # Next action determination
    next_action = None
    if not profile or not profile.current_role or not profile.target_role_id:
        next_action = {
            "type": "profile",
            "title": "Set up your professional profile",
            "description": "Specify current role, organization, target role, and private career goal.",
            "cta": "Update Profile",
        }
    elif transferable_summary and transferable_summary.get("missing_skills"):
        missing = transferable_summary["missing_skills"]
        next_action = {
            "type": "upskill",
            "title": f"Focus on {missing[0]} competency",
            "description": f"Close this key gap to advance toward your {profile.goal_mode or 'career'} milestone.",
            "cta": "View Practical Tasks",
        }
    elif active_roadmap:
        uncompleted = [t for t in active_roadmap.topics if not t.is_completed and not t.is_locked]
        if uncompleted:
            first_t = uncompleted[0]
            next_action = {
                "type": "learn",
                "title": f"Advance in {first_t.title}",
                "description": "Demonstrate proficiency via practical assessment.",
                "topic_id": first_t.id,
                "assessment_id": first_t.assessment_id,
                "cta": "Take Assessment",
            }
        else:
            next_action = {
                "type": "mentors",
                "title": "Roadmap mastered! Consult an executive mentor",
                "description": "Book a 1-on-1 advisory session to strategize your internal promotion or transition.",
                "cta": "Book Mentor",
            }

    emp_profile_out = EmployeeProfileOut.model_validate(profile) if profile else None
    if profile and emp_profile_out:
        if profile.target_role:
            emp_profile_out.target_role_title = profile.target_role.title
        # Owner is authorized to view their own private career goal:
        emp_profile_out.career_goal = profile.career_goal

    return EmployeeDashboard(
        user=UserOut.model_validate(current_user),
        profile=emp_profile_out,
        target_role=target_role,
        gap_analysis=gap_analysis,
        active_roadmap=active_roadmap,
        recent_attempts=[AttemptOut.model_validate(a) for a in recent_attempts],
        recommended_courses=recommended_courses,
        job_matches=job_matches,
        upcoming_sessions=[BookingOut.model_validate(b) for b in upcoming_bookings],
        transferable_summary=transferable_summary,
        next_action=next_action,
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

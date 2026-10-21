"""
Courses router — catalog browsing, seller course management, and content-based gap recommendations.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, UserRole, Course, Skill, SkillEvidence, CareerRole,
    SellerProfile, ListingStatus, AuditLog, course_skills
)
from app.schemas import (
    CourseOut, CourseRecommendation, CourseCreate, SkillOut
)
from app.dependencies import get_current_user, require_learner, require_seller

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("/", response_model=List[CourseOut])
def list_courses(
    platform: Optional[str] = None,
    level: Optional[str] = None,
    is_free: Optional[bool] = None,
    skill_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Browse the course catalog with search and filters."""
    q = (
        db.query(Course)
        .options(joinedload(Course.skills))
        .filter(Course.listing_status == ListingStatus.PUBLISHED)
    )

    if platform:
        q = q.filter(Course.platform == platform.lower())
    if level:
        q = q.filter(Course.level == level.lower())
    if is_free is not None:
        q = q.filter(Course.is_free == is_free)
    if search:
        q = q.filter(Course.title.ilike(f"%{search}%") | Course.description.ilike(f"%{search}%"))
    if skill_id:
        q = q.filter(Course.skills.any(Skill.id == skill_id))

    # Free first, then highest rating
    return q.order_by(Course.is_free.desc(), Course.rating.desc().nullslast()).offset(offset).limit(limit).all()


@router.get("/recommendations", response_model=List[CourseRecommendation])
def get_recommended_courses(
    limit: int = Query(10, le=50),
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Recommend courses tailored to the learner's skill gaps.
    Prioritizes free courses first, followed by relevance and user rating.
    """
    target_role_id = None
    if current_user.role == UserRole.STUDENT and current_user.student_profile:
        target_role_id = current_user.student_profile.target_role_id
    elif current_user.role == UserRole.EMPLOYEE and current_user.employee_profile:
        target_role_id = current_user.employee_profile.target_role_id

    # If no target role, fetch general highly-rated courses
    if not target_role_id:
        popular_courses = (
            db.query(Course)
            .options(joinedload(Course.skills))
            .filter(Course.listing_status == ListingStatus.PUBLISHED)
            .order_by(Course.is_free.desc(), Course.rating.desc().nullslast())
            .limit(limit)
            .all()
        )
        return [
            CourseRecommendation(
                course=CourseOut.model_validate(c),
                relevance_score=0.5,
                matched_skills=[s.canonical_name for s in c.skills],
                explanation="Popular course in catalog. Set your target role for personalized gap matching.",
            )
            for c in popular_courses
        ]

    # Find required skills for target role
    role = db.query(CareerRole).options(joinedload(CareerRole.required_skills)).filter(CareerRole.id == target_role_id).first()
    if not role:
        return []

    # Find user's verified skills
    user_evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == current_user.id).all()
    verified_skill_ids = {
        ev.skill_id for ev in user_evidences
        if ev.evidence_type.value in ("assessed", "project", "mentor_endorsed")
    }

    # Gap skill IDs
    gap_skill_ids = {s.id for s in role.required_skills if s.id not in verified_skill_ids}
    gap_skill_names = {s.id: s.canonical_name for s in role.required_skills if s.id not in verified_skill_ids}

    # Query courses covering at least one gap skill
    candidate_courses = (
        db.query(Course)
        .options(joinedload(Course.skills))
        .filter(
            Course.listing_status == ListingStatus.PUBLISHED,
            Course.skills.any(Skill.id.in_(gap_skill_ids)),
        )
        .all()
    )

    scored_recommendations = []
    for course in candidate_courses:
        course_skill_ids = {s.id for s in course.skills}
        matched_ids = course_skill_ids.intersection(gap_skill_ids)
        matched_names = [gap_skill_names[sid] for sid in matched_ids if sid in gap_skill_names]

        if not matched_names:
            continue

        # Heuristic scoring:
        # +0.4 * fraction of course skills that address user's gaps
        # +0.3 * bonus if course is free (Free-resource-first mandate)
        # +0.3 * normalized rating (rating / 5.0)
        relevance = len(matched_ids) / len(course_skill_ids) if course_skill_ids else 0.5
        free_bonus = 0.3 if course.is_free else 0.0
        rating_score = ((course.rating or 4.0) / 5.0) * 0.3
        total_score = round(min(1.0, (relevance * 0.4) + free_bonus + rating_score), 3)

        explanation = (
            f"Directly addresses your skill gap{'s' if len(matched_names) > 1 else ''}: "
            f"{', '.join(matched_names)}."
        )
        if course.is_free:
            explanation += " Free resource priority."

        scored_recommendations.append((
            total_score,
            CourseRecommendation(
                course=CourseOut.model_validate(course),
                relevance_score=total_score,
                matched_skills=matched_names,
                explanation=explanation,
            )
        ))

    # Sort descending by score
    scored_recommendations.sort(key=lambda x: x[0], reverse=True)
    return [rec for _, rec in scored_recommendations[:limit]]


@router.get("/seller/my-courses", response_model=List[CourseOut])
def get_seller_courses(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """List all courses created by the authenticated seller."""
    seller_profile = db.query(SellerProfile).filter(SellerProfile.user_id == current_user.id).first()
    if not seller_profile:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    return (
        db.query(Course)
        .options(joinedload(Course.skills))
        .filter(Course.seller_id == seller_profile.id)
        .all()
    )


@router.post("/", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """Allow course sellers to upload a new course listing."""
    seller_profile = db.query(SellerProfile).filter(SellerProfile.user_id == current_user.id).first()
    if not seller_profile:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    course = Course(
        seller_id=seller_profile.id,
        title=data.title,
        description=data.description,
        url=data.url,
        platform="internal",
        level=data.level,
        price=data.price,
        is_free=data.is_free or (data.price == 0.0),
        subject=data.subject,
        duration_hours=data.duration_hours,
        listing_status=ListingStatus.PUBLISHED,
    )

    if data.skill_ids:
        skills = db.query(Skill).filter(Skill.id.in_(data.skill_ids)).all()
        course.skills = skills

    db.add(course)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        action="course.create",
        entity_type="Course",
        entity_id=course.id,
    ))

    db.commit()
    db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get single course details."""
    course = (
        db.query(Course)
        .options(joinedload(Course.skills))
        .filter(Course.id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

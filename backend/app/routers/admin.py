"""
Admin & Operations Console Router.
Provides restricted management of users, listing moderation with recorded reasons,
support tickets, platform metrics, and administrative audit history.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.models import (
    User, UserRole, Course, ListingStatus, MentorProfile,
    UserReport, ListingModerationReview, AuditLog, PaymentOrder,
    SkillAssessment, AssessmentAttempt, utcnow
)
from app.schemas import ListingModerationRequest, UserReportCreate
from app.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Admin & Operations"])


@router.get("/users")
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all registered platform users with role filters."""
    q = db.query(User)
    if role:
        q = q.filter(User.role == UserRole(role))
    if search:
        q = q.filter(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))

    users = q.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: dict,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update user role or verification status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = payload.get("role")
    if new_role:
        user.role = UserRole(new_role)
    if "is_verified" in payload:
        user.is_verified = bool(payload["is_verified"])

    db.add(AuditLog(
        user_id=current_admin.id,
        action="admin.user_role_updated",
        details={"target_user_id": user.id, "new_role": new_role},
    ))
    db.commit()
    return {"message": "User updated successfully", "user_id": user.id, "role": user.role.value}


# ─── Listing Moderation ───────────────────────────────────────────────
@router.get("/moderation/pending")
def list_pending_moderation(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all courses or profiles awaiting administrative moderation."""
    courses = (
        db.query(Course)
        .options(joinedload(Course.seller))
        .filter(Course.listing_status.in_([ListingStatus.PENDING_REVIEW, ListingStatus.DRAFT]))
        .all()
    )

    return [
        {
            "listing_type": "course",
            "listing_id": c.id,
            "title": c.title,
            "seller_name": c.seller.display_name if c.seller else "External",
            "price": c.price,
            "level": c.level,
            "status": c.listing_status.value,
            "created_at": c.created_at.isoformat(),
        }
        for c in courses
    ]


@router.post("/moderation/review")
def review_listing(
    data: ListingModerationRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Approve, reject, or request changes for a listing with a mandatory recorded reason.
    """
    if data.listing_type == "course":
        course = db.query(Course).filter(Course.id == data.listing_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if data.action == "approve":
            course.listing_status = ListingStatus.PUBLISHED
        elif data.action == "reject":
            course.listing_status = ListingStatus.REJECTED
        elif data.action == "changes_requested":
            course.listing_status = ListingStatus.DRAFT
        else:
            raise HTTPException(status_code=400, detail="Invalid moderation action")

        # Record moderation review entry
        review_entry = ListingModerationReview(
            listing_type="course",
            listing_id=course.id,
            reviewer_id=current_admin.id,
            action=data.action,
            reason=data.reason,
            created_at=utcnow(),
        )
        db.add(review_entry)
        db.add(AuditLog(
            user_id=current_admin.id,
            action=f"moderation.{data.action}",
            details={"listing_type": "course", "listing_id": course.id, "reason": data.reason},
        ))
        db.commit()

        return {
            "message": f"Course {data.action} successfully",
            "course_id": course.id,
            "new_status": course.listing_status.value,
            "recorded_reason": data.reason,
        }

    raise HTTPException(status_code=400, detail=f"Unsupported listing type '{data.listing_type}'")


# ─── Reports & Support ────────────────────────────────────────────────
@router.get("/reports")
def list_reports(
    status_filter: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List user support requests and policy enforcement reports."""
    q = db.query(UserReport)
    if status_filter:
        q = q.filter(UserReport.status == status_filter)
    reports = q.order_by(UserReport.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "reporter_id": r.reporter_id,
            "category": r.category,
            "details": r.details,
            "status": r.status,
            "resolution_notes": r.resolution_notes,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.patch("/reports/{report_id}/status")
def resolve_report(
    report_id: int,
    payload: dict,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Resolve user report with administrative notes."""
    report = db.query(UserReport).filter(UserReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = payload.get("status", "resolved")
    report.resolution_notes = payload.get("resolution_notes", "Resolved by Operations Administrator.")
    report.updated_at = utcnow()

    db.add(AuditLog(
        user_id=current_admin.id,
        action="report.resolved",
        details={"report_id": report.id, "status": report.status},
    ))
    db.commit()
    return {"message": "Report status updated", "status": report.status}


# ─── Platform Operational Metrics ─────────────────────────────────────
@router.get("/metrics")
def get_platform_metrics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Operational metrics: learning activity, marketplace volume, revenue, trust."""
    total_users = db.query(User).count()
    student_count = db.query(User).filter(User.role == UserRole.STUDENT).count()
    employee_count = db.query(User).filter(User.role == UserRole.EMPLOYEE).count()
    mentor_count = db.query(User).filter(User.role == UserRole.MENTOR).count()
    seller_count = db.query(User).filter(User.role == UserRole.SELLER).count()

    total_attempts = db.query(AssessmentAttempt).count()
    passed_attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.passed == True).count()

    total_courses = db.query(Course).count()
    published_courses = db.query(Course).filter(Course.listing_status == ListingStatus.PUBLISHED).count()

    orders_count = db.query(PaymentOrder).filter(PaymentOrder.status == "completed").count()
    total_revenue = db.query(func.sum(PaymentOrder.amount)).filter(PaymentOrder.status == "completed").scalar() or 0.0
    commission_earned = db.query(func.sum(PaymentOrder.commission_amount)).filter(PaymentOrder.status == "completed").scalar() or 0.0

    return {
        "total_users": total_users,
        "published_courses": published_courses,
        "pending_moderation_listings": db.query(Course).filter(Course.listing_status == ListingStatus.PENDING_REVIEW).count(),
        "total_enrollments": total_attempts,
        "users": {
            "total": total_users,
            "students": student_count,
            "employees": employee_count,
            "mentors": mentor_count,
            "sellers": seller_count,
        },
        "learning": {
            "total_assessment_attempts": total_attempts,
            "passed_attempts": passed_attempts,
            "pass_rate": round(passed_attempts / max(total_attempts, 1), 3),
        },
        "marketplace": {
            "total_courses": total_courses,
            "published_courses": published_courses,
            "completed_orders": orders_count,
            "gross_marketplace_volume": float(total_revenue),
            "platform_commission_earned": float(commission_earned),
        },
        "trust_and_safety": {
            "pending_moderation": db.query(Course).filter(Course.listing_status == ListingStatus.PENDING_REVIEW).count(),
            "open_reports": db.query(UserReport).filter(UserReport.status == "open").count(),
        },
    }


@router.get("/audit-logs")
def list_audit_logs(
    limit: int = Query(50, le=200),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Retrieve chronologically ordered system audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "details": l.details,
            "timestamp": l.created_at.isoformat(),
        }
        for l in logs
    ]

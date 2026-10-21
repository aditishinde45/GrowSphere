"""
Payments and Marketplace Monetization Router.
Supports sandbox checkout, order receipt generation, platform commission, and seller/mentor payouts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, PaymentOrder, PayoutRecord, Course, AuditLog, CourseEnrollment, utcnow
from app.schemas import CheckoutRequest
from app.dependencies import get_current_user, require_seller
from app.services.payment_service import process_course_checkout, payment_provider

router = APIRouter(prefix="/payments", tags=["Payments & Payouts"])


@router.post("/checkout")
def checkout(
    data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Execute sandbox checkout for a course or mentorship offering.
    Calculates 15% platform commission and 85% creator payout.
    Creates enrollment upon successful purchase.
    """
    if data.item_type in ("course", None) or data.course_id:
        target_id = data.course_id or data.item_id
        course = db.query(Course).filter(Course.id == target_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        order = process_course_checkout(
            db=db,
            user_id=current_user.id,
            course_id=course.id,
            amount=data.amount,
            idempotency_key=data.idempotency_key,
        )

        # Ensure user is enrolled
        existing_enrollment = (
            db.query(CourseEnrollment)
            .filter(CourseEnrollment.user_id == current_user.id, CourseEnrollment.course_id == course.id)
            .first()
        )
        if not existing_enrollment:
            enrollment = CourseEnrollment(
                user_id=current_user.id,
                course_id=course.id,
                progress_percentage=0.0,
                enrolled_at=utcnow(),
            )
            db.add(enrollment)
            db.commit()

        db.add(AuditLog(
            user_id=current_user.id,
            action="payment.course_checkout",
            details={"order_id": order.id, "course_id": course.id, "amount": data.amount},
        ))
        db.commit()

        return {
            "order_id": order.id,
            "status": order.status,
            "provider_payment_id": order.provider_payment_id,
            "amount": order.amount,
            "commission_amount": order.commission_amount,
            "platform_fee": order.commission_amount,
            "seller_payout_amount": order.seller_payout_amount,
            "receipt_url": order.receipt_url,
        }

    raise HTTPException(status_code=400, detail=f"Unsupported item type '{data.item_type}'")


@router.get("/orders/{order_id}")
def get_order_receipt(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve verified order receipt details."""
    order = db.query(PaymentOrder).filter(PaymentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to view this order")

    return {
        "id": order.id,
        "amount": order.amount,
        "currency": order.currency,
        "status": order.status,
        "provider": order.provider,
        "commission_amount": order.commission_amount,
        "items": order.items_json,
        "created_at": order.created_at.isoformat(),
        "receipt_url": order.receipt_url,
    }


@router.get("/my-orders")
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List purchase history for current user."""
    orders = (
        db.query(PaymentOrder)
        .filter(PaymentOrder.user_id == current_user.id)
        .order_by(PaymentOrder.created_at.desc())
        .all()
    )
    return [
        {
            "id": o.id,
            "amount": o.amount,
            "status": o.status,
            "items": o.items_json,
            "created_at": o.created_at.isoformat(),
        }
        for o in orders
    ]


@router.get("/seller/payouts")
def get_seller_payouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List seller or mentor payouts."""
    payouts = (
        db.query(PayoutRecord)
        .filter(PayoutRecord.user_id == current_user.id)
        .order_by(PayoutRecord.created_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        }
        for p in payouts
    ]


@router.post("/seller/request-payout")
def request_payout(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit payout request for completed creator earnings."""
    amount = float(payload.get("amount", 1000.0))
    payout = PayoutRecord(
        user_id=current_user.id,
        user_role=current_user.role.value,
        amount=amount,
        currency="INR",
        status="completed",
        notes="Automated sandbox creator payout settlement.",
        created_at=utcnow(),
    )
    db.add(payout)
    db.add(AuditLog(
        user_id=current_user.id,
        action="payout.settled",
        details={"amount": amount},
    ))
    db.commit()
    return {"message": "Payout processed successfully", "payout_id": payout.id, "amount": amount}

"""
Mentors router — mentor profiles, session offerings, and booking management.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, UserRole, MentorProfile, MentorOffering, Booking, BookingStatus, AuditLog
)
from app.schemas import (
    MentorProfileOut, MentorOfferingOut, MentorOfferingCreate,
    BookingCreate, BookingOut, BookingStatusUpdate
)
from app.dependencies import get_current_user, require_mentor, require_learner

router = APIRouter(prefix="/mentors", tags=["Mentors & Bookings"])


@router.get("/", response_model=List[MentorProfileOut])
def list_mentors(
    is_available: bool = True,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List verified and available mentors."""
    q = db.query(MentorProfile).filter(MentorProfile.is_available == is_available)
    if search:
        q = q.filter(
            MentorProfile.display_name.ilike(f"%{search}%") |
            MentorProfile.bio.ilike(f"%{search}%")
        )
    return q.all()


@router.get("/{mentor_id}", response_model=MentorProfileOut)
def get_mentor(mentor_id: int, db: Session = Depends(get_db)):
    """Get mentor profile details."""
    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return mentor


@router.get("/{mentor_id}/offerings", response_model=List[MentorOfferingOut])
def get_mentor_offerings(mentor_id: int, db: Session = Depends(get_db)):
    """List active offerings for a mentor."""
    return db.query(MentorOffering).filter(
        MentorOffering.mentor_id == mentor_id,
        MentorOffering.is_active == True,
    ).all()


@router.post("/offerings", response_model=MentorOfferingOut, status_code=status.HTTP_201_CREATED)
def create_offering(
    data: MentorOfferingCreate,
    current_user: User = Depends(require_mentor),
    db: Session = Depends(get_db),
):
    """Create a new mentor service offering (1-on-1, mock interview, resume review)."""
    mentor_profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")

    offering = MentorOffering(
        mentor_id=mentor_profile.id,
        title=data.title,
        description=data.description,
        offering_type=data.offering_type,
        duration_minutes=data.duration_minutes,
        price=data.price,
    )
    db.add(offering)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        action="mentor.offering_created",
        entity_type="MentorOffering",
        entity_id=offering.id,
    ))

    db.commit()
    db.refresh(offering)
    return offering


@router.get("/offerings/my", response_model=List[MentorOfferingOut])
def get_my_offerings(
    current_user: User = Depends(require_mentor),
    db: Session = Depends(get_db),
):
    """Get offerings created by current mentor."""
    mentor_profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")

    return db.query(MentorOffering).filter(MentorOffering.mentor_id == mentor_profile.id).all()


@router.post("/bookings", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def book_session(
    data: BookingCreate,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Learners request a mentorship session."""
    offering = db.query(MentorOffering).filter(MentorOffering.id == data.offering_id).first()
    if not offering or not offering.is_active:
        raise HTTPException(status_code=404, detail="Offering not found or unavailable")

    booking = Booking(
        learner_id=current_user.id,
        mentor_id=offering.mentor_id,
        offering_id=offering.id,
        status=BookingStatus.REQUESTED,
        scheduled_at=data.scheduled_at,
        duration_minutes=offering.duration_minutes,
        learner_notes=data.learner_notes,
    )
    db.add(booking)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        action="booking.requested",
        entity_type="Booking",
        entity_id=booking.id,
    ))

    db.commit()
    db.refresh(booking)
    return booking


@router.get("/bookings/my", response_model=List[BookingOut])
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get bookings for the current user (as learner or mentor)."""
    if current_user.role == UserRole.MENTOR:
        mentor = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
        if not mentor:
            return []
        return db.query(Booking).filter(Booking.mentor_id == mentor.id).order_by(Booking.scheduled_at.desc()).all()
    else:
        return db.query(Booking).filter(Booking.learner_id == current_user.id).order_by(Booking.scheduled_at.desc()).all()


@router.patch("/bookings/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    data: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update booking status:
    - Mentors can accept, decline, or complete bookings
    - Learners can cancel bookings
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    mentor = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    is_mentor = mentor and booking.mentor_id == mentor.id
    is_learner = booking.learner_id == current_user.id

    if not is_mentor and not is_learner and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")

    new_status = BookingStatus(data.status)
    if is_learner and new_status != BookingStatus.CANCELLED:
        raise HTTPException(status_code=403, detail="Learners can only cancel bookings")

    booking.status = new_status
    if data.mentor_notes:
        booking.mentor_notes = data.mentor_notes
    if data.session_link:
        booking.session_link = data.session_link

    db.add(AuditLog(
        user_id=current_user.id,
        action=f"booking.{new_status.value}",
        entity_type="Booking",
        entity_id=booking.id,
    ))

    db.commit()
    db.refresh(booking)
    return booking

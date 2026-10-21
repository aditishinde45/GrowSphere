"""
Credits Router.
Provides idempotent credit ledger querying, bonus allocation, and balance management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, CreditLedger
from app.schemas import CreditBalanceOut, CreditGrantRequest
from app.dependencies import get_current_user
from app.services.payment_service import get_user_credit_balance, record_credit_transaction, PaymentServiceException

router = APIRouter(prefix="/credits", tags=["Credits & Wallet"])


@router.get("/balance")
def get_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve current user's valid credit balance and ledger history."""
    balance = get_user_credit_balance(db, current_user.id)
    history = (
        db.query(CreditLedger)
        .filter(CreditLedger.user_id == current_user.id)
        .order_by(CreditLedger.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "balance": balance,
        "history": [
            {
                "id": h.id,
                "amount": h.amount,
                "balance_after": h.balance_after,
                "transaction_type": h.transaction_type,
                "description": h.description,
                "timestamp": h.created_at.isoformat(),
            }
            for h in history
        ],
    }


@router.post("/grant")
def grant_credits(
    data: CreditGrantRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Grant credits to a user with strict idempotency."""
    # Allow self-grant of demo bonus (max 50 credits) or admin grant
    target_user_id = data.user_id if current_user.role.value == "admin" else current_user.id
    amount = min(data.amount, 50) if current_user.role.value != "admin" else data.amount

    try:
        tx = record_credit_transaction(
            db=db,
            user_id=target_user_id,
            amount=amount,
            transaction_type="grant",
            idempotency_key=data.idempotency_key,
            description=data.description,
            reference_type="bonus_grant",
        )
        return {
            "message": "Credits granted successfully",
            "transaction_id": tx.id,
            "new_balance": tx.balance_after,
            "balance": tx.balance_after,
        }
    except PaymentServiceException as e:
        raise HTTPException(status_code=400, detail=str(e))

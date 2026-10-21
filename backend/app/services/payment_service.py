"""
GrowSphere Monetization and Idempotent Credit Ledger Service.
Handles sandbox orders, receipts, commission splits, and credit balance invariants.
"""

import abc
import uuid
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import CreditLedger, PaymentOrder, PayoutRecord, utcnow

logger = logging.getLogger("growsphere.payments")


class PaymentServiceException(Exception):
    """Domain exception for payment and credit operations."""
    pass


class PaymentProvider(abc.ABC):
    """Abstract interface for payment gateways."""

    @abc.abstractmethod
    def create_checkout(self, user_id: int, amount: float, currency: str, items: list, idempotency_key: str) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def confirm_payment(self, order_id: int) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def refund_order(self, order_id: int, reason: str) -> Dict[str, Any]:
        pass


class SandboxPaymentProvider(PaymentProvider):
    """
    Sandbox payment gateway implementation with simulated webhook and order settlement.
    """

    COMMISSION_RATE = 0.15  # 15% platform commission

    def create_checkout(self, user_id: int, amount: float, currency: str, items: list, idempotency_key: str) -> Dict[str, Any]:
        commission = round(amount * self.COMMISSION_RATE, 2)
        seller_payout = round(amount - commission, 2)
        return {
            "idempotency_key": idempotency_key,
            "provider_payment_id": f"pay_sb_{uuid.uuid4().hex[:12]}",
            "amount": amount,
            "currency": currency,
            "commission_amount": commission,
            "seller_payout_amount": seller_payout,
            "status": "pending",
            "receipt_url": f"/receipts/{idempotency_key}",
        }

    def confirm_payment(self, order_id: int) -> Dict[str, Any]:
        return {
            "order_id": order_id,
            "status": "completed",
            "settled_at": utcnow().isoformat(),
        }

    def refund_order(self, order_id: int, reason: str) -> Dict[str, Any]:
        return {
            "order_id": order_id,
            "status": "refunded",
            "refund_reason": reason,
            "refunded_at": utcnow().isoformat(),
        }


# Global payment provider
payment_provider = SandboxPaymentProvider()


# ─── Idempotent Credit Ledger Functions ────────────────────────────────
def get_user_credit_balance(db: Session, user_id: int) -> int:
    """Calculate the user's current valid credit balance from the ledger."""
    latest_entry = (
        db.query(CreditLedger)
        .filter(CreditLedger.user_id == user_id)
        .order_by(CreditLedger.id.desc())
        .first()
    )
    return latest_entry.balance_after if latest_entry else 0


def record_credit_transaction(
    db: Session,
    user_id: int,
    amount: int,
    transaction_type: str,
    idempotency_key: str,
    description: Optional[str] = None,
    reference_type: Optional[str] = None,
    reference_id: Optional[str] = None,
) -> CreditLedger:
    """
    Idempotent ledger transaction execution.
    Guarantees:
      1. Duplicate idempotency keys return the existing transaction without double-charging or granting.
      2. Negative transactions check sufficient balance and prevent overdrafts.
      3. Sums and balance_after are strictly preserved in an append-only audit trail.
    """
    # Check for existing idempotency key
    existing = db.query(CreditLedger).filter(CreditLedger.idempotency_key == idempotency_key).first()
    if existing:
        logger.info(f"Idempotent hit for credit transaction {idempotency_key} — returning existing record.")
        return existing

    current_balance = get_user_credit_balance(db, user_id)
    new_balance = current_balance + amount

    if new_balance < 0:
        raise PaymentServiceException(
            f"Insufficient credits: Current balance is {current_balance}, but required is {abs(amount)}."
        )

    entry = CreditLedger(
        idempotency_key=idempotency_key,
        user_id=user_id,
        amount=amount,
        balance_after=new_balance,
        transaction_type=transaction_type,
        description=description,
        reference_type=reference_type,
        reference_id=str(reference_id) if reference_id else None,
        created_at=utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def process_course_checkout(
    db: Session,
    user_id: int,
    course_id: int,
    amount: float,
    idempotency_key: str,
) -> PaymentOrder:
    """
    Execute sandbox checkout for a course purchase, recording the order and seller payout.
    """
    existing_order = db.query(PaymentOrder).filter(PaymentOrder.idempotency_key == idempotency_key).first()
    if existing_order:
        return existing_order

    commission = round(amount * SandboxPaymentProvider.COMMISSION_RATE, 2)
    seller_payout = round(amount - commission, 2)

    order = PaymentOrder(
        idempotency_key=idempotency_key,
        user_id=user_id,
        amount=amount,
        currency="INR",
        status="completed",
        provider="sandbox",
        provider_payment_id=f"pay_sb_{uuid.uuid4().hex[:12]}",
        commission_amount=commission,
        seller_payout_amount=seller_payout,
        items_json=[{"type": "course", "course_id": course_id, "amount": amount}],
        receipt_url=f"/receipts/{idempotency_key}",
        created_at=utcnow(),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

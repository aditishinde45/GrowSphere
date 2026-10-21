"""
GrowSphere Email Service Abstraction.
Supports Sandbox (local development/testing) and SMTP providers.
"""

import abc
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

logger = logging.getLogger("growsphere.email")


class EmailProvider(abc.ABC):
    """Abstract interface for transactional emails."""

    @abc.abstractmethod
    def send_verification_email(self, to_email: str, token: str, user_name: str) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def send_password_reset_email(self, to_email: str, token: str, user_name: str) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def send_booking_notification(self, to_email: str, subject: str, message: str) -> Dict[str, Any]:
        pass


class SandboxEmailProvider(EmailProvider):
    """
    In-memory sandbox email provider for development, tests, and demo verification.
    Records all dispatched emails so tests and audits can inspect exact deliveries.
    """

    def __init__(self):
        self.sent_emails: List[Dict[str, Any]] = []

    def send_verification_email(self, to_email: str, token: str, user_name: str) -> Dict[str, Any]:
        record = {
            "id": str(uuid.uuid4()),
            "type": "email_verification",
            "to": to_email,
            "user_name": user_name,
            "token": token,
            "verification_url": f"/verify-email?token={token}",
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "status": "delivered_sandbox",
        }
        self.sent_emails.append(record)
        logger.info(f"[SANDBOX EMAIL] Verification email to {to_email} (Token: {token})")
        return record

    def send_password_reset_email(self, to_email: str, token: str, user_name: str) -> Dict[str, Any]:
        record = {
            "id": str(uuid.uuid4()),
            "type": "password_reset",
            "to": to_email,
            "user_name": user_name,
            "token": token,
            "reset_url": f"/reset-password?token={token}",
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "status": "delivered_sandbox",
        }
        self.sent_emails.append(record)
        logger.info(f"[SANDBOX EMAIL] Password reset email to {to_email} (Token: {token})")
        return record

    def send_booking_notification(self, to_email: str, subject: str, message: str) -> Dict[str, Any]:
        record = {
            "id": str(uuid.uuid4()),
            "type": "booking_notification",
            "to": to_email,
            "subject": subject,
            "message": message,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "status": "delivered_sandbox",
        }
        self.sent_emails.append(record)
        logger.info(f"[SANDBOX EMAIL] Booking notification to {to_email}: {subject}")
        return record


# Global singleton provider instance
_sandbox_instance = SandboxEmailProvider()


def get_email_provider() -> EmailProvider:
    """Return the active email provider based on configuration."""
    return _sandbox_instance

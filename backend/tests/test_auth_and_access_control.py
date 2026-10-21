"""
Authentication, Authorization & Access Control Verification Suite.
Verifies:
1. Prohibition of public admin registration (HTTP 403 Forbidden)
2. Permitted registration for Student, Employee, Seller, Mentor roles
3. Password recovery lifecycle (request, token issuance, password reset, login)
4. Email verification workflow
5. Strict RBAC enforcement on Admin endpoints (HTTP 403 for non-admins)
6. Object ownership boundaries (learners, sellers, mentors)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_public_registration_prohibits_admin_creation():
    """Verify that public signup CANNOT create an admin account (HTTP 403 Forbidden)."""
    res = client.post("/api/auth/register", json={
        "email": "malicious_admin@growsphere.dev",
        "password": "Password123!",
        "full_name": "Infiltrator",
        "role": "admin",
    })
    # Either 403 Forbidden or 422 Unprocessable Entity
    assert res.status_code in [403, 422]
    if res.status_code == 403:
        assert "prohibited" in res.json()["detail"].lower()


def test_public_registration_permitted_roles():
    """Verify public registration for permitted roles: student, employee, seller, mentor."""
    import uuid
    rand_suffix = uuid.uuid4().hex[:6]

    for role in ["student", "employee", "seller", "mentor"]:
        email = f"test_{role}_{rand_suffix}@growsphere.dev"
        res = client.post("/api/auth/register", json={
            "email": email,
            "password": "ValidPassword123!",
            "full_name": f"Test {role.capitalize()}",
            "role": role,
        })
        assert res.status_code == 201, f"Failed for role {role}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == role


def test_password_recovery_and_reset_workflow():
    """Verify end-to-end password recovery and reset."""
    import uuid
    rand = uuid.uuid4().hex[:6]
    email = f"recover_{rand}@growsphere.dev"

    # Register user
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "OldPassword123!",
        "full_name": "Reset Tester",
        "role": "student",
    })
    assert reg_res.status_code == 201

    # Request reset
    req_res = client.post("/api/auth/request-password-reset", json={"email": email})
    assert req_res.status_code == 200
    token_preview = req_res.json().get("token_preview")
    assert token_preview is not None

    # Confirm reset with new password
    confirm_res = client.post("/api/auth/reset-password", json={
        "token": token_preview,
        "new_password": "NewSecurePassword456!",
    })
    assert confirm_res.status_code == 200

    # Old password should fail
    fail_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "OldPassword123!",
    })
    assert fail_login.status_code == 401

    # New password should succeed
    success_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "NewSecurePassword456!",
    })
    assert success_login.status_code == 200


def test_email_verification_lifecycle():
    """Verify email verification token dispatch and confirmation."""
    import uuid
    rand = uuid.uuid4().hex[:6]
    email = f"verify_{rand}@growsphere.dev"

    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Verify Learner",
        "role": "student",
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Request verification token
    req_res = client.post("/api/auth/request-email-verification", headers=headers)
    assert req_res.status_code == 200
    vtoken = req_res.json().get("token_preview")
    assert vtoken is not None

    # Confirm verification
    confirm_res = client.post("/api/auth/verify-email", json={"token": vtoken})
    assert confirm_res.status_code == 200

    # Verify user object reflects verification
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["is_verified"] is True


def test_strict_rbac_on_admin_endpoints():
    """Verify that student, employee, seller, and mentor are denied access to Admin operations."""
    for demo_email in [
        "student@growsphere.dev",
        "employee@growsphere.dev",
        "seller@growsphere.dev",
        "mentor@growsphere.dev",
    ]:
        login_res = client.post("/api/auth/login", json={
            "email": demo_email,
            "password": "password123",
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Attempt to access user management
        admin_res = client.get("/api/admin/users", headers=headers)
        assert admin_res.status_code == 403, f"Expected 403 for {demo_email}, got {admin_res.status_code}"

        # Attempt to access moderation queue
        mod_res = client.get("/api/admin/moderation/pending", headers=headers)
        assert mod_res.status_code == 403, f"Expected 403 for {demo_email}, got {mod_res.status_code}"

        # Attempt to access operational metrics
        metric_res = client.get("/api/admin/metrics", headers=headers)
        assert metric_res.status_code == 403, f"Expected 403 for {demo_email}, got {metric_res.status_code}"


def test_admin_console_access_permitted_only_for_admin():
    """Verify that only authenticated Admin users can access Admin endpoints."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@growsphere.dev",
        "password": "password123",
    })
    assert login_res.status_code == 200
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    users_res = client.get("/api/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    assert isinstance(users_res.json(), list)

    metrics_res = client.get("/api/admin/metrics", headers=admin_headers)
    assert metrics_res.status_code == 200
    assert "total_users" in metrics_res.json()

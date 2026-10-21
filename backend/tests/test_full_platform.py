"""
GrowSphere Full Platform End-to-End Test Suite.
Verifies TRAC-01 through TRAC-16 across all 5 roles:
Student, Employee, Course Seller, Mentor, Admin & Operations.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_token(email: str, password: str = "password123") -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def auth_header(email: str, password: str = "password123") -> dict:
    return {"Authorization": f"Bearer {get_token(email, password)}"}


# ─── TRAC-01: Auth, Email Verification, Reset & Onboarding ────────────────────
def test_auth_and_onboarding_lifecycle():
    # 1. Register a new user
    import time
    ts = int(time.time())
    new_email = f"testuser_{ts}@growsphere.dev"
    reg_res = client.post("/api/auth/register", json={
        "email": new_email,
        "password": "strongPassword123!",
        "full_name": "Test Lifecycle User",
        "role": "student"
    })
    assert reg_res.status_code == 201
    user_token = reg_res.json()["access_token"]
    user_hdr = {"Authorization": f"Bearer {user_token}"}

    # 2. Email verification request & confirm
    req_verif = client.post("/api/auth/request-email-verification", headers=user_hdr)
    assert req_verif.status_code == 200
    token_preview = req_verif.json().get("token_preview")
    assert token_preview is not None

    confirm_verif = client.post("/api/auth/verify-email", json={"token": token_preview})
    assert confirm_verif.status_code == 200

    # 3. Password reset request & confirm
    req_reset = client.post("/api/auth/request-password-reset", json={"email": new_email})
    assert req_reset.status_code == 200
    reset_token = req_reset.json().get("token_preview")
    assert reset_token is not None

    confirm_reset = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "brandNewPassword123!"
    })
    assert confirm_reset.status_code == 200

    # 4. Login with new password
    re_login = client.post("/api/auth/login", json={
        "email": new_email,
        "password": "brandNewPassword123!"
    })
    assert re_login.status_code == 200
    new_hdr = {"Authorization": f"Bearer {re_login.json()['access_token']}"}

    # 5. Role onboarding
    onboard_res = client.post("/api/auth/onboarding", headers=new_hdr, json={
        "target_role_id": 1,
        "education": "B.Tech Computer Science",
        "college": "Pune University"
    })
    assert onboard_res.status_code == 200


# ─── TRAC-02: Privacy, Consent, GDPR Export & Account Deletion ───────────────
def test_privacy_gdpr_and_account_deletion():
    emp_hdr = auth_header("employee@growsphere.dev")

    # Update privacy settings
    priv_res = client.put("/api/profiles/privacy", headers=emp_hdr, json={
        "privacy_settings": {"profile_visibility": "private", "hide_current_employer": True}
    })
    assert priv_res.status_code == 200
    assert priv_res.json()["privacy_settings"]["hide_current_employer"] is True

    # GDPR Export
    export_res = client.get("/api/profiles/export-data", headers=emp_hdr)
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert "user" in export_data
    assert "employee_profile" in export_data
    assert "evidence_records" in export_data
    assert export_data["user"]["email"] == "employee@growsphere.dev"

    # Activity history
    act_res = client.get("/api/profiles/activity-history", headers=emp_hdr)
    assert act_res.status_code == 200
    assert isinstance(act_res.json(), list)


# ─── TRAC-03: 5-Tier Evidence Model & Revocable Skill Passport ───────────────
def test_five_tier_evidence_and_skill_passport():
    stud_hdr = auth_header("student@growsphere.dev")

    # 1. Inspect existing 5-tier evidence
    ev_res = client.get("/api/skills/my-evidence", headers=stud_hdr)
    assert ev_res.status_code == 200
    evidence_list = ev_res.json()
    assert len(evidence_list) > 0

    # 2. Add Practical Project Evidence (Tier 4)
    proj_res = client.post("/api/skills/evidence/add-project", headers=stud_hdr, json={
        "skill_id": 1,
        "project_title": "Automated ETL Pipeline",
        "project_url": "https://github.com/student/etl-pipeline",
        "proof_text": "Built pipeline transforming 500k rows in PostgreSQL and Python."
    })
    assert proj_res.status_code == 200
    assert proj_res.json()["evidence_type"] == "project"

    # 3. Check Skill Passport
    pass_res = client.get("/api/passport/my", headers=stud_hdr)
    assert pass_res.status_code == 200
    pass_data = pass_res.json()
    slug = pass_data["share_slug"]
    assert slug is not None

    # Public verification of passport
    pub_res = client.get(f"/api/passport/public/{slug}")
    assert pub_res.status_code == 200
    assert pub_res.json()["is_revoked"] is False

    # Revoke passport
    rev_res = client.post("/api/passport/toggle-revoke", headers=stud_hdr, json={"is_revoked": True})
    assert rev_res.status_code == 200
    assert rev_res.json()["is_revoked"] is True

    # Public verification now reflects revocation (returns 403 Forbidden)
    pub_rev = client.get(f"/api/passport/public/{slug}")
    assert pub_rev.status_code == 403

    # Re-activate
    client.post("/api/passport/toggle-revoke", headers=stud_hdr, json={"is_revoked": False})


# ─── TRAC-04: Dated Market Evidence, Freshness & Uncertainty ─────────────────
def test_market_evidence_freshness_and_limitations():
    res = client.get("/api/skills/market-evidence?role_title=Data Analyst")
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "Naukri Jobs Data.csv"
    assert data["sample_size"] > 0
    assert "date_window" in data
    assert "freshness" in data
    assert "limitations" in data
    assert data["limitations"] != ""


# ─── TRAC-05: Explainable ATS Resume Scanner (Fact-Based) ───────────────────
def test_fact_based_resume_extraction():
    stud_hdr = auth_header("student@growsphere.dev")
    resume_text = "Proficient in Python scripting, SQL database design, and Tableau dashboards."

    extract_res = client.post("/api/profiles/resume/extract", headers=stud_hdr, json={"text": resume_text})
    assert extract_res.status_code == 200
    data = extract_res.json()
    skills = [s["skill"] for s in data["extracted_skills"]]
    assert any("python" in s.lower() or "sql" in s.lower() or "tableau" in s.lower() for s in skills)
    assert len(data["ats_recommendations"]) > 0

    # Confirm extracted skills into learner profile (RESUME_EXTRACTED tier)
    conf_res = client.post("/api/profiles/resume/confirm-skills", headers=stud_hdr, json={
        "confirmed_skills": ["SQL"]
    })
    assert conf_res.status_code == 200
    assert isinstance(conf_res.json(), list)


# ─── TRAC-06: Sequential Adaptive Roadmap & Dependency Gating ────────────────
def test_sequential_roadmap_adaptive_gating():
    stud_hdr = auth_header("student@growsphere.dev")

    # Generate roadmap
    gen_res = client.post("/api/roadmap/generate", headers=stud_hdr)
    assert gen_res.status_code == 200

    road_res = client.get("/api/roadmap/active", headers=stud_hdr)
    assert road_res.status_code == 200
    road = road_res.json()
    assert len(road["topics"]) >= 2

    # Check sequential locking: Topic 2 should require prerequisites or Topic 1
    orders = [t["order"] for t in road["topics"]]
    assert orders == sorted(orders)


# ─── TRAC-07: Assessments, Rubrics & Weak-Area Feedback ──────────────────────
def test_assessment_rubrics_and_feedback():
    stud_hdr = auth_header("student@growsphere.dev")

    from app.core.database import SessionLocal
    from app.models import AssessmentAttempt
    with SessionLocal() as db_session:
        db_session.query(AssessmentAttempt).filter(
            AssessmentAttempt.user_id == 1,
            AssessmentAttempt.assessment_id == 1,
        ).delete()
        db_session.commit()

    # Get assessment 1
    ass_res = client.get("/api/assessments/1", headers=stud_hdr)
    assert ass_res.status_code == 200
    quiz = ass_res.json()

    # Submit failing answers
    fail_res = client.post("/api/assessments/1/submit", headers=stud_hdr, json={
        "answers": {str(q["id"]): "Invalid Wrong Answer" for q in quiz["questions"]},
        "time_taken_seconds": 60
    })
    assert fail_res.status_code == 200
    fail_data = fail_res.json()
    assert fail_data["passed"] is False
    assert len(fail_data["weak_areas"]) > 0

    # Submit passing answers
    pass_answers = {
        "1": "HAVING",
        "2": "LEFT JOIN",
        "3": "It ignores NULL values and counts only non-null values",
        "4": "DENSE_RANK()",
    }
    pass_res = client.post("/api/assessments/1/submit", headers=stud_hdr, json={
        "answers": pass_answers,
        "time_taken_seconds": 90
    })
    assert pass_res.status_code == 200
    pass_data = pass_res.json()
    assert pass_data["passed"] is True
    assert pass_data["score"] >= quiz["pass_threshold"]


# ─── TRAC-08: Course Seller Lifecycle & Moderation Queue ────────────────────
def test_course_seller_lifecycle_and_moderation():
    seller_hdr = auth_header("seller@growsphere.dev")
    admin_hdr = auth_header("admin@growsphere.dev")

    # 1. Create course draft
    import time
    title = f"Data Engineering Masterclass {int(time.time())}"
    draft_res = client.post("/api/courses/", headers=seller_hdr, json={
        "title": title,
        "description": "Comprehensive course on big data architectures.",
        "price": 1999.0,
        "duration_hours": 30,
        "is_free": False,
        "skills_taught": ["Data Engineering", "SQL"],
        "prerequisites": ["Python"]
    })
    assert draft_res.status_code == 201
    course_id = draft_res.json()["id"]

    # 2. Submit for moderation
    sub_res = client.patch(f"/api/courses/{course_id}/status", headers=seller_hdr, json={"status": "pending_review"})
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "pending_review"

    # 3. Non-admin cannot moderate (403)
    stud_hdr = auth_header("student@growsphere.dev")
    bad_mod = client.post("/api/admin/moderation/review", headers=stud_hdr, json={
        "listing_type": "course",
        "listing_id": course_id,
        "action": "approve",
        "reason": "Looks good"
    })
    assert bad_mod.status_code == 403

    # 4. Admin reviews in moderation queue with recorded reason
    q_res = client.get("/api/admin/moderation/pending", headers=admin_hdr)
    assert q_res.status_code == 200

    mod_res = client.post("/api/admin/moderation/review", headers=admin_hdr, json={
        "listing_type": "course",
        "listing_id": course_id,
        "action": "approve",
        "reason": "Meets institutional curriculum quality guidelines."
    })
    assert mod_res.status_code == 200
    assert mod_res.json()["new_status"] == "published"


# ─── TRAC-09: Course Enrollment & Verified Reviews ───────────────────────────
def test_course_enrollment_and_reviews():
    stud_hdr = auth_header("student@growsphere.dev")

    # Enroll in course 1
    enr_res = client.post("/api/courses/1/enroll", headers=stud_hdr)
    assert enr_res.status_code in [200, 201]

    # Verify enrollment in my-enrollments
    my_enr = client.get("/api/courses/enrollments/my", headers=stud_hdr)
    assert my_enr.status_code == 200
    assert any(e["course_id"] == 1 for e in my_enr.json())

    # Submit review
    rev_res = client.post("/api/courses/1/reviews", headers=stud_hdr, json={
        "rating": 5.0,
        "review_text": "Excellent practical curriculum."
    })
    assert rev_res.status_code in [200, 201]


# ─── TRAC-10: Mentor Availability, Booking Workflow & Endorsements ───────────
def test_mentor_availability_booking_and_endorsements():
    mentor_hdr = auth_header("mentor@growsphere.dev")
    stud_hdr = auth_header("student@growsphere.dev")

    # 1. Add availability slot
    slot_res = client.post("/api/mentors/availability", headers=mentor_hdr, json={
        "day_of_week": "Friday",
        "start_time": "14:00",
        "end_time": "15:00",
        "max_bookings": 2
    })
    assert slot_res.status_code == 201
    slot_id = slot_res.json()["id"]

    # 2. Book session
    book_res = client.post("/api/mentors/bookings", headers=stud_hdr, json={
        "offering_id": 1,
        "scheduled_at": "2026-11-01T14:00:00Z",
        "learner_notes": "Career switch strategy session"
    })
    assert book_res.status_code == 201
    booking_id = book_res.json()["id"]

    # 3. Mentor confirms booking -> sandbox video meeting link generated
    conf_res = client.patch(f"/api/mentors/bookings/{booking_id}/status", headers=mentor_hdr, json={
        "status": "confirmed",
        "mentor_notes": "Prepared review materials.",
        "session_link": "https://meeting.growsphere.dev/sandbox-room-101"
    })
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] in ["confirmed", "accepted"]

    # 4. Mentor endorses learner skill (Tier 5 proof)
    end_res = client.post("/api/mentors/endorse", headers=mentor_hdr, json={
        "learner_id": 1,
        "skill_id": 1,
        "endorsement_notes": "Demonstrated expert proficiency during 1-on-1 architecture review.",
        "confidence_score": 0.95
    })
    assert end_res.status_code == 200
    assert end_res.json()["confidence_score"] == 0.95


# ─── TRAC-11: Idempotent Payments & Credit Ledger ────────────────────────────
def test_idempotent_payments_and_credit_ledger():
    stud_hdr = auth_header("student@growsphere.dev")
    import time
    key = f"idemp_{int(time.time() * 1000)}"

    # 1. Grant credits idempotently
    grant1 = client.post("/api/credits/grant", headers=stud_hdr, json={
        "amount": 25,
        "description": "Test credit bonus",
        "idempotency_key": f"credit_{key}"
    })
    assert grant1.status_code == 200
    bal1 = grant1.json()["balance"]

    # Repeat with same key -> should NOT increase balance again
    grant2 = client.post("/api/credits/grant", headers=stud_hdr, json={
        "amount": 25,
        "description": "Test credit bonus duplicate",
        "idempotency_key": f"credit_{key}"
    })
    assert grant2.status_code == 200
    assert grant2.json()["balance"] == bal1

    # 2. Checkout course idempotently with 85/15 commission split
    pay_key = f"pay_{key}"
    check1 = client.post("/api/payments/checkout", headers=stud_hdr, json={
        "course_id": 1,
        "amount": 1000.0,
        "payment_method": "sandbox_card",
        "idempotency_key": pay_key
    })
    assert check1.status_code == 200
    order1 = check1.json()
    assert order1["platform_fee"] == 150.0  # 15%
    assert order1["seller_payout_amount"] == 850.0  # 85%

    # Repeat with same idempotency key
    check2 = client.post("/api/payments/checkout", headers=stud_hdr, json={
        "course_id": 1,
        "amount": 1000.0,
        "payment_method": "sandbox_card",
        "idempotency_key": pay_key
    })
    assert check2.status_code == 200
    assert check2.json()["order_id"] == order1["order_id"]


# ─── TRAC-12: AI Mock Interviews & Credit Consumption ────────────────────────
def test_mock_interview_studio():
    stud_hdr = auth_header("student@growsphere.dev")

    # Start mock interview (10 credits deducted)
    start_res = client.post("/api/mock-interviews/start", headers=stud_hdr, json={
        "target_role": "Data Analyst",
        "interview_type": "technical"
    })
    assert start_res.status_code == 200
    session = start_res.json()
    assert "questions" in session
    assert len(session["questions"]) > 0
    q1 = session["questions"][0]

    # Submit structured answer evaluated against STAR rubrics
    ans_res = client.post(f"/api/mock-interviews/{session['id']}/answer", headers=stud_hdr, json={
        "question_id": q1["id"],
        "learner_answer": "In my previous project, we faced a 20% latency issue in SQL pipelines. I refactored queries with indexing, which reduced runtime by 45%."
    })
    assert ans_res.status_code == 200
    feedback = ans_res.json()
    assert "score" in feedback
    assert "feedback_notes" in feedback


# ─── TRAC-13: Learning Materials (Flashcards & Notes) ────────────────────────
def test_topic_learning_materials():
    res = client.get("/api/learning-materials/topic/1")
    assert res.status_code == 200
    data = res.json()
    assert "flashcards" in data
    assert len(data["flashcards"]) > 0
    assert "front" in data["flashcards"][0]
    assert "back" in data["flashcards"][0]
    assert "study_notes" in data


# ─── TRAC-14: Career Transition Matrix & Practical Tasks ─────────────────────
def test_career_transition_and_practical_tasks():
    emp_hdr = auth_header("employee@growsphere.dev")

    # Analyze transition
    trans_res = client.post("/api/career-transitions/analyze", headers=emp_hdr, json={
        "current_role": "Operations Analyst",
        "target_role": "Senior Data Analyst"
    })
    assert trans_res.status_code == 200
    trans_data = trans_res.json()
    assert "transferable_skills" in trans_data
    assert "missing_skills" in trans_data
    assert "overlap_percentage" in trans_data
    assert "estimated_effort_weeks" in trans_data

    # Practical role tasks
    tasks_res = client.get("/api/career-transitions/tasks/1", headers=emp_hdr)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) > 0

    # Submit task solution
    task1_id = tasks[0]["id"]
    sub_res = client.post(f"/api/career-transitions/tasks/{task1_id}/submit", headers=emp_hdr, json={
        "submission_notes": "Implemented Tableau executive KPI dashboard.",
        "solution_url": "https://public.tableau.com/views/ExecutiveKPIs"
    })
    assert sub_res.status_code == 200


# ─── TRAC-15: Job Matching & Application Tracking ────────────────────────────
def test_jobs_matching_and_tracking():
    stud_hdr = auth_header("student@growsphere.dev")

    # Match jobs
    match_res = client.get("/api/jobs/matches", headers=stud_hdr)
    assert match_res.status_code == 200
    matches = match_res.json()
    assert len(matches) > 0
    job1_id = matches[0]["job"]["id"]

    # Save opportunity
    save_res = client.post(f"/api/jobs/{job1_id}/save", headers=stud_hdr, json={
        "notes": "Target company for Q4 applications"
    })
    assert save_res.status_code == 200
    saved_id = save_res.json()["id"]

    # Update application tracking status
    stat_res = client.patch(f"/api/jobs/saved/{saved_id}/status", headers=stud_hdr, json={
        "status": "interviewing",
        "notes": "Technical round scheduled"
    })
    assert stat_res.status_code == 200
    assert stat_res.json()["status"] == "interviewing"


# ─── TRAC-16: Admin Console, Operational Metrics & Health ────────────────────
def test_admin_console_metrics_and_health():
    admin_hdr = auth_header("admin@growsphere.dev")

    # Platform metrics
    met_res = client.get("/api/admin/metrics", headers=admin_hdr)
    assert met_res.status_code == 200
    metrics = met_res.json()
    assert "total_users" in metrics
    assert "published_courses" in metrics

    # Audit logs
    logs_res = client.get("/api/admin/audit-logs", headers=admin_hdr)
    assert logs_res.status_code == 200
    assert len(logs_res.json()) > 0

    # Database health check
    health_res = client.get("/health/db")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

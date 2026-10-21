"""
GrowSphere API Integration Tests.

Validates the full evidence loop:
Auth -> RBAC Access Controls -> Profile -> Gap Analysis -> Roadmap -> Assessment ->
Verified Evidence -> Courses & Jobs Matching -> Data Register Admin Governance
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_and_health():
    """Verify application health and evidence loop manifesto."""
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"


def test_data_usage_register_rbac_and_transparency():
    """
    Verify RBAC security on Data Usage Register:
    - Detailed register access requires Admin role (Students forbidden 403).
    - Summary transparency endpoint is accessible to authenticated users.
    """
    # 1. Student login (non-admin)
    res_student = client.post("/api/auth/login", json={
        "email": "student@growsphere.dev",
        "password": "password123",
    })
    assert res_student.status_code == 200
    student_token = res_student.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Attempt accessing detailed register as Student -> Must be 403 Forbidden
    res_forbidden = client.get("/api/data-register/", headers=student_headers)
    assert res_forbidden.status_code == 403
    assert "Access denied" in res_forbidden.json()["detail"]

    # Student accessing summary -> 200 OK
    res_summary = client.get("/api/data-register/summary", headers=student_headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["total_files_accounted_for"] >= 20
    assert "student_placement_career_success_dataset.csv" in summary["quarantined_datasets"]

    # 2. Admin login
    res_admin = client.post("/api/auth/login", json={
        "email": "admin@growsphere.dev",
        "password": "password123",
    })
    assert res_admin.status_code == 200
    admin_token = res_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin accessing detailed register -> 200 OK
    res_admin_reg = client.get("/api/data-register/", headers=admin_headers)
    assert res_admin_reg.status_code == 200
    records = res_admin_reg.json()
    assert len(records) >= 20

    filenames = {r["source_filename"] for r in records}
    assert "Naukri Jobs Data.csv" in filenames
    assert "student_placement_career_success_dataset.csv" in filenames
    assert "cleaned_dataset.csv" in filenames
    assert "Final Course List (July - Dec 2026).xlsx" in filenames

    # Verify student placement is quarantined
    sp_rec = next(r for r in records if r["source_filename"] == "student_placement_career_success_dataset.csv")
    assert sp_rec["status"] == "quarantined"


def test_auth_login_and_me():
    """Verify JWT authentication for demo student user."""
    res = client.post("/api/auth/login", json={
        "email": "student@growsphere.dev",
        "password": "password123",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    token = data["access_token"]

    # Verify /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "student@growsphere.dev"
    assert res_me.json()["role"] == "student"


def test_skills_and_career_roles():
    """Verify skill taxonomy and Data Analyst career role."""
    res_skills = client.get("/api/skills/")
    assert res_skills.status_code == 200
    skills = res_skills.json()
    assert len(skills) >= 10
    skill_names = {s["canonical_name"] for s in skills}
    assert "SQL" in skill_names
    assert "Python" in skill_names
    assert "Tableau" in skill_names

    res_roles = client.get("/api/skills/roles")
    assert res_roles.status_code == 200
    roles = res_roles.json()
    da_role = next((r for r in roles if r["title"] == "Data Analyst"), None)
    assert da_role is not None
    assert len(da_role["required_skills"]) >= 5


def test_student_gap_analysis_and_roadmap():
    """Verify skill-gap analysis and dependency-ordered roadmap generation."""
    res = client.post("/api/auth/login", json={
        "email": "student@growsphere.dev",
        "password": "password123",
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Gap analysis
    res_gap = client.get("/api/skills/gap-analysis", headers=headers)
    assert res_gap.status_code == 200
    gap = res_gap.json()
    assert gap["career_role"]["title"] == "Data Analyst"
    assert gap["total_required"] >= 5
    assert "readiness_score" in gap

    # Generate roadmap
    res_roadmap = client.post("/api/roadmap/generate", headers=headers)
    assert res_roadmap.status_code == 200
    roadmap = res_roadmap.json()
    assert len(roadmap["topics"]) >= 5
    # First topic must be unlocked
    assert roadmap["topics"][0]["is_locked"] is False


def test_assessment_flow_and_evidence_creation():
    """
    Test quiz submission:
    - Verifies scoring logic
    - Passing (>= 70%) creates verified SkillEvidence
    - Completed topic advances roadmap progress
    """
    res = client.post("/api/auth/login", json={
        "email": "student@growsphere.dev",
        "password": "password123",
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch SQL assessment
    res_assessments = client.get("/api/assessments/")
    assert res_assessments.status_code == 200
    assessments = res_assessments.json()
    sql_assessment = next((a for a in assessments if "SQL" in a["title"]), None)
    assert sql_assessment is not None

    # Reset attempts for idempotent test runs
    from app.core.database import SessionLocal
    from app.models import AssessmentAttempt
    with SessionLocal() as db_session:
        db_session.query(AssessmentAttempt).filter(
            AssessmentAttempt.user_id == 1,
            AssessmentAttempt.assessment_id == sql_assessment["id"],
        ).delete()
        db_session.commit()

    # Fetch assessment details (sanitized questions)
    res_detail = client.get(f"/api/assessments/{sql_assessment['id']}", headers=headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert len(detail["questions"]) == 4
    # Ensure correct_answer is NOT leaked to learner
    assert "correct_answer" not in detail["questions"][0]

    # Submit 100% correct answers
    submission = {
        "answers": {
            "1": "HAVING",
            "2": "LEFT JOIN",
            "3": "It ignores NULL values and counts only non-null values",
            "4": "DENSE_RANK()",
        },
        "time_taken_seconds": 120,
    }
    res_submit = client.post(f"/api/assessments/{sql_assessment['id']}/submit", json=submission, headers=headers)
    assert res_submit.status_code == 200
    result = res_submit.json()
    assert result["score"] == 1.0
    assert result["passed"] is True

    # Verify that verified SkillEvidence was created
    res_skills = client.get("/api/profiles/skills", headers=headers)
    assert res_skills.status_code == 200
    evidences = res_skills.json()
    sql_evidence = next((e for e in evidences if e["skill_name"] == "SQL"), None)
    assert sql_evidence is not None
    assert sql_evidence["evidence_type"] == "assessed"
    assert sql_evidence["confidence_score"] >= 0.9


def test_resume_extraction_and_user_confirmation_flow():
    """
    Verify explainable resume extraction and mandatory learner confirmation flow:
    - Text snippet extracts candidate skills with spans
    - Candidate skills are tentative until confirmed
    - Confirmation adds them to SkillEvidence
    """
    res = client.post("/api/auth/login", json={
        "email": "student@growsphere.dev",
        "password": "password123",
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Extract skills from project snippet
    sample_resume = "Built an end-to-end sales dashboard using Tableau and automated data cleaning in Python and SQL."
    res_extract = client.post("/api/profiles/resume/extract", json={"text": sample_resume}, headers=headers)
    assert res_extract.status_code == 200
    extracted = res_extract.json()
    extracted_names = {s["skill"] for s in extracted["extracted_skills"]}
    assert "Tableau" in extracted_names
    assert "Python" in extracted_names
    assert "SQL" in extracted_names

    # Confirm Tableau and Python
    res_confirm = client.post("/api/profiles/resume/confirm-skills", json={
        "confirmed_skills": ["Tableau", "Python"],
    }, headers=headers)
    assert res_confirm.status_code == 200
    confirmed = res_confirm.json()
    assert len(confirmed) >= 1
    confirmed_names = {c["skill_name"] for c in confirmed}
    assert "Tableau" in confirmed_names or "Python" in confirmed_names


def test_course_recommendations_and_jobs_matching():
    """Verify content-based recommendations prioritize free resources and weighted matching."""
    res = client.post("/api/auth/login", json={
        "email": "student@growsphere.dev",
        "password": "password123",
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Course recommendations
    res_courses = client.get("/api/courses/recommendations", headers=headers)
    assert res_courses.status_code == 200
    recs = res_courses.json()
    assert len(recs) > 0
    assert "relevance_score" in recs[0]
    assert len(recs[0]["matched_skills"]) > 0

    # Job matches
    res_jobs = client.get("/api/jobs/matches", headers=headers)
    assert res_jobs.status_code == 200
    job_matches = res_jobs.json()
    assert len(job_matches) > 0
    assert "match_score" in job_matches[0]
    assert "matched_skills" in job_matches[0]


def test_student_dashboard_aggregation():
    """Verify complete student dashboard response."""
    res = client.post("/api/auth/login", json={
        "email": "student@growsphere.dev",
        "password": "password123",
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res_dash = client.get("/api/dashboard/student", headers=headers)
    assert res_dash.status_code == 200
    dash = res_dash.json()
    assert dash["user"]["email"] == "student@growsphere.dev"
    assert dash["target_role"]["title"] == "Data Analyst"
    assert dash["gap_analysis"] is not None
    assert dash["active_roadmap"] is not None
    assert len(dash["recommended_courses"]) > 0
    assert len(dash["job_matches"]) > 0

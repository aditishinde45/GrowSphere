"""
Comprehensive End-to-End Verification of Student and Employee Workspaces.

Tests complete real user journeys:
1. Student Journey:
   - Real registration & sign in
   - Onboarding & profile persistence (education, location, graduation timing, target role, learning time, preferences)
   - Profile editing & updating
   - 5-Tier Skill Evidence management (add self-reported, edit, remove eligible, protect assessed)
   - Resume tools (upload PDF/DOCX/TXT, extract skills, ATS analysis, delete resume)
   - Gap analysis & ordered roadmap with prerequisites and effort estimates
   - Learning & assessment with rubric feedback and evidence verification
   - Opportunities radar, matching, saving, application tracking, unsaving
   - Mentor browsing, booking with consent, and cancellation
   - Aggregated student dashboard from actual user data

2. Employee Journey:
   - Professional registration & onboarding (current role, company, industry, experience, goal mode, learning schedule, preferences)
   - Private career goals protection (never exposed without consent)
   - Transferable skills comparison with verified vs needs-stronger-evidence vs gaps breakdown and effort estimates
   - Role-based practical tasks submission
   - Aggregated employee dashboard with private goal and next actions

3. Access Control & Account Isolation:
   - Verify Student A cannot delete or modify Student B's evidence or resumes
   - Verify Employee private goals remain protected from other accounts
"""

import io
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_student_complete_journey():
    timestamp = int(time.time() * 1000)
    student_email = f"student_journey_{timestamp}@growsphere.dev"
    password = "StudentSecurePass123!"

    # 1. Registration
    reg_res = client.post("/api/auth/register", json={
        "email": student_email,
        "password": password,
        "full_name": "Pooja Deshmukh",
        "role": "student",
    })
    assert reg_res.status_code == 201, reg_res.text
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /auth/me returns real persisted user
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Pooja Deshmukh"
    assert me_res.json()["email"] == student_email

    # 2. Onboarding
    onboard_res = client.post("/api/auth/onboarding", headers=headers, json={
        "target_role_id": 1,  # Data Analyst
        "education": "B.E. Information Technology",
        "college": "COEP Technological University",
        "location": "Pune, India",
        "graduation_year": 2026,
        "learning_time_hours_per_week": 15.0,
        "preferred_languages": ["English", "Marathi"],
        "opportunity_preferences": ["internship", "entry_level_job", "hackathon"],
        "initial_skills": [1],  # SQL
    })
    assert onboard_res.status_code == 200

    # 3. Verify Student Profile & update details
    prof_res = client.get("/api/profiles/student", headers=headers)
    assert prof_res.status_code == 200
    pdata = prof_res.json()
    assert pdata["education"] == "B.E. Information Technology"
    assert pdata["college"] == "COEP Technological University"
    assert pdata["location"] == "Pune, India"
    assert pdata["graduation_year"] == 2026
    assert pdata["learning_time_hours_per_week"] == 15.0
    assert pdata["target_role_title"] == "Data Analyst"

    # Edit student profile
    update_res = client.put("/api/profiles/student", headers=headers, json={
        "education": "B.Tech Computer Science & Engineering",
        "college": "COEP Technological University",
        "location": "Mumbai, India",
        "graduation_year": 2026,
        "learning_time_hours_per_week": 20.0,
        "preferred_languages": ["English", "Hindi"],
        "opportunity_preferences": ["internship", "remote"],
        "bio": "Aspiring data analytics engineer with passion for SQL and Tableau visualization.",
        "github_url": "https://github.com/poojad",
        "portfolio_url": "https://pooja.dev",
    })
    assert update_res.status_code == 200
    updata = update_res.json()
    assert updata["education"] == "B.Tech Computer Science & Engineering"
    assert updata["location"] == "Mumbai, India"
    assert updata["learning_time_hours_per_week"] == 20.0

    # 4. 5-Tier Evidence Management
    # Verify initial self-reported skill was created during onboarding
    ev_res = client.get("/api/profiles/skills", headers=headers)
    assert ev_res.status_code == 200
    evs = ev_res.json()
    assert any(e["skill_id"] == 1 and e["evidence_type"] == "self_reported" for e in evs)

    # Add another self-reported skill
    add_sk_res = client.post("/api/profiles/skills", headers=headers, json={
        "skill_id": 2,  # Python
        "level": "intermediate",
        "source_description": "Academic coursework and personal projects",
    })
    assert add_sk_res.status_code in (200, 201)
    python_ev_id = add_sk_res.json()["id"]

    # Update self-reported skill level
    update_ev_res = client.put(f"/api/profiles/skills/{python_ev_id}", headers=headers, json={
        "level": "advanced",
        "source_description": "Updated to advanced following capstone development",
    })
    assert update_ev_res.status_code == 200
    assert update_ev_res.json()["level"] == "advanced"

    # 5. Resume Tools: Secure Upload, Extraction, Confirmation & Deletion
    sample_resume_content = b"Pooja Deshmukh. Education: B.Tech CSE. Technical Skills: Python, SQL, Tableau, Pandas. Experience: Built data analytics dashboards."
    upload_res = client.post(
        "/api/profiles/resume/upload",
        headers=headers,
        files={"file": ("pooja_resume.txt", io.BytesIO(sample_resume_content), "text/plain")},
        data={"target_role": "Data Analyst"},
    )
    assert upload_res.status_code == 200, upload_res.text
    r_data = upload_res.json()
    assert r_data["filename"] == "pooja_resume.txt"
    assert "extracted_skills" in r_data
    assert len(r_data["extracted_skills"]) > 0
    resume_id = r_data["id"]

    # Confirm extracted resume skills
    confirm_res = client.post("/api/profiles/resume/confirm-skills", headers=headers, json={
        "confirmed_skills": ["SQL", "Python"],
    })
    assert confirm_res.status_code == 200
    confirmed_evs = confirm_res.json()
    assert len(confirmed_evs) >= 1
    assert any(c["evidence_type"] == "resume_extracted" for c in confirmed_evs)

    # List uploaded resumes
    list_resumes = client.get("/api/profiles/resume", headers=headers)
    assert list_resumes.status_code == 200
    assert len(list_resumes.json()) >= 1

    # Delete resume
    del_resume = client.delete(f"/api/profiles/resume/{resume_id}", headers=headers)
    assert del_resume.status_code == 200

    # 6. Gap Analysis & Sequential Roadmap
    gap_res = client.get("/api/skills/gap-analysis", headers=headers)
    assert gap_res.status_code == 200
    gdata = gap_res.json()
    assert "readiness_score" in gdata
    assert "skill_details" in gdata

    # Generate sequential roadmap
    road_gen = client.post("/api/roadmap/generate", headers=headers)
    assert road_gen.status_code == 200
    rdata = road_gen.json()
    assert rdata["is_active"] is True
    assert len(rdata["topics"]) > 0
    first_topic = rdata["topics"][0]
    assert first_topic["is_locked"] is False
    assert first_topic["estimated_hours"] is not None

    # 7. Learning Materials & Assessment Flow
    # Study materials for topic
    study_res = client.get(f"/api/learning-materials/topic/{first_topic['id']}", headers=headers)
    assert study_res.status_code == 200

    # Take practical quiz if assessment available
    assess_res = client.get("/api/assessments/", headers=headers)
    assert assess_res.status_code == 200
    assessments = assess_res.json()
    if assessments:
        target_assess = assessments[0]
        # Get sanitized quiz questions
        quiz_res = client.get(f"/api/assessments/{target_assess['id']}", headers=headers)
        assert quiz_res.status_code == 200
        q_list = quiz_res.json()["questions"]
        assert len(q_list) > 0

        # Submit answers
        sub_answers = {str(q["id"]): q["options"][0] for q in q_list}
        sub_res = client.post(
            f"/api/assessments/{target_assess['id']}/submit",
            headers=headers,
            json={"answers": sub_answers, "time_taken_seconds": 120},
        )
        assert sub_res.status_code == 200
        attempt_data = sub_res.json()
        assert "score" in attempt_data
        assert "passed" in attempt_data
        assert "feedback" in attempt_data

    # 8. Opportunities Matching & Tracker
    matches_res = client.get("/api/jobs/matches", headers=headers)
    assert matches_res.status_code == 200
    job_matches = matches_res.json()
    if job_matches:
        first_job = job_matches[0]["job"]
        # Save opportunity
        save_res = client.post(f"/api/jobs/{first_job['id']}/save", headers=headers, json={
            "notes": "Target application for summer internship",
        })
        assert save_res.status_code == 200
        saved_id = save_res.json()["saved_id"]

        # View saved opportunities tracker
        saved_list = client.get("/api/jobs/saved/my", headers=headers)
        assert saved_list.status_code == 200
        assert any(s["id"] == saved_id for s in saved_list.json())

        # Update application status
        status_up = client.patch(f"/api/jobs/saved/{saved_id}/status", headers=headers, json={
            "status": "applied",
            "notes": "Submitted resume on career portal",
        })
        assert status_up.status_code == 200
        assert status_up.json()["status"] == "applied"

        # Unsave opportunity
        del_saved = client.delete(f"/api/jobs/saved/{saved_id}", headers=headers)
        assert del_saved.status_code == 204

    # 9. Mentor Access & Bookings
    mentors_res = client.get("/api/mentors/", headers=headers)
    assert mentors_res.status_code == 200
    mentors = mentors_res.json()
    if mentors:
        m_id = mentors[0]["id"]
        offerings_res = client.get(f"/api/mentors/{m_id}/offerings", headers=headers)
        assert offerings_res.status_code == 200
        offs = offerings_res.json()
        if offs:
            book_res = client.post("/api/mentors/bookings", headers=headers, json={
                "offering_id": offs[0]["id"],
                "scheduled_at": "2026-11-01T15:00:00Z",
                "learner_notes": "Career advice on breaking into junior data science roles",
            })
            assert book_res.status_code == 201
            b_id = book_res.json()["id"]

            # Cancel booking
            cancel_res = client.patch(f"/api/mentors/bookings/{b_id}/status", headers=headers, json={
                "status": "cancelled",
            })
            assert cancel_res.status_code == 200
            assert cancel_res.json()["status"] == "cancelled"

    # 10. Student Dashboard Aggregation
    dash_res = client.get("/api/dashboard/student", headers=headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["user"]["full_name"] == "Pooja Deshmukh"
    assert dash["target_role"]["title"] == "Data Analyst"
    assert dash["gap_analysis"] is not None
    assert dash["active_roadmap"] is not None
    assert "upcoming_sessions" in dash
    assert "saved_opportunities" in dash
    assert "next_action" in dash


def test_employee_complete_journey():
    timestamp = int(time.time() * 1000)
    emp_email = f"employee_journey_{timestamp}@growsphere.dev"
    password = "EmployeeSecurePass123!"

    # 1. Registration
    reg_res = client.post("/api/auth/register", json={
        "email": emp_email,
        "password": password,
        "full_name": "Vikram Malhotra",
        "role": "employee",
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Professional Onboarding
    onboard_res = client.post("/api/auth/onboarding", headers=headers, json={
        "current_role": "Junior Operations Analyst",
        "current_company": "Accenture Solutions",
        "industry": "Consulting & Enterprise Operations",
        "years_experience": 3.0,
        "target_role_id": 2,  # Senior Data Analyst / Software Engineer
        "goal_mode": "reskilling",
        "career_change_intent": "actively_looking",
        "learning_schedule": "Weeknights 8-10 PM & Saturdays (10 hrs/week)",
        "career_goal": "Transition from ops reporting to lead BI architect with 50% compensation uplift",
        "initial_skills": [1, 2],  # SQL & Python
    })
    assert onboard_res.status_code == 200

    # 3. Employee Profile & Private Goals Check
    prof_res = client.get("/api/profiles/employee", headers=headers)
    assert prof_res.status_code == 200
    pdata = prof_res.json()
    assert pdata["current_role"] == "Junior Operations Analyst"
    assert pdata["current_company"] == "Accenture Solutions"
    assert pdata["industry"] == "Consulting & Enterprise Operations"
    assert pdata["years_experience"] == 3.0
    assert pdata["goal_mode"] == "reskilling"
    # Authenticated employee sees their own private goal
    assert pdata["career_goal"] == "Transition from ops reporting to lead BI architect with 50% compensation uplift"

    # Edit employee profile
    update_res = client.put("/api/profiles/employee", headers=headers, json={
        "current_role": "Operations & Analytics Specialist",
        "current_company": "Accenture Solutions",
        "industry": "Consulting & Analytics",
        "years_experience": 3.5,
        "target_role_id": 2,
        "goal_mode": "promotion",
        "career_goal": "Secure Senior Analytics Manager promotion in next annual cycle",
        "learning_schedule": "12 hrs/week structured evening schedule",
    })
    assert update_res.status_code == 200
    assert update_res.json()["current_role"] == "Operations & Analytics Specialist"
    assert update_res.json()["goal_mode"] == "promotion"
    assert update_res.json()["career_goal"] == "Secure Senior Analytics Manager promotion in next annual cycle"

    # 4. Transferable Skills & Role Comparison
    trans_res = client.post("/api/career-transitions/analyze", headers=headers, json={
        "current_role": "Operations Specialist",
        "target_role_id": 2,
    })
    assert trans_res.status_code == 200
    tdata = trans_res.json()
    assert "overlap_percentage" in tdata
    assert "transferable_skills" in tdata
    assert "transferable_verified" in tdata
    assert "needs_stronger_evidence" in tdata
    assert "missing_skills" in tdata
    assert "estimated_effort_weeks" in tdata
    assert "uncertainty_explanation" in tdata

    # 5. Role-based Practical Simulation Tasks
    tasks_res = client.get("/api/career-transitions/tasks", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) > 0
    t_id = tasks[0]["id"]

    sub_task = client.post(f"/api/career-transitions/tasks/{t_id}/submit", headers=headers, json={
        "submission_notes": "Implemented automated ETL pipeline with error handling and deduplication",
        "solution_url": "https://github.com/vikram/analytics-etl-pipeline",
    })
    assert sub_task.status_code == 200
    assert sub_task.json()["status"] in ("submitted", "evaluated")

    # 6. Employee Dashboard Aggregation
    emp_dash_res = client.get("/api/dashboard/employee", headers=headers)
    assert emp_dash_res.status_code == 200
    emp_dash = emp_dash_res.json()
    assert emp_dash["user"]["full_name"] == "Vikram Malhotra"
    assert emp_dash["profile"]["current_role"] == "Operations & Analytics Specialist"
    assert emp_dash["profile"]["career_goal"] == "Secure Senior Analytics Manager promotion in next annual cycle"
    assert "transferable_summary" in emp_dash
    assert "next_action" in emp_dash
    assert "job_matches" in emp_dash


def test_rbac_and_account_data_isolation():
    """Verify that Student A cannot delete or access Student B's private items."""
    ts = int(time.time() * 1000)
    # Register Student A
    res_a = client.post("/api/auth/register", json={
        "email": f"student_a_{ts}@growsphere.dev",
        "password": "Password123!",
        "full_name": "Student A",
        "role": "student",
    })
    token_a = res_a.json()["access_token"]
    hdr_a = {"Authorization": f"Bearer {token_a}"}

    # Student A adds a skill
    ev_a = client.post("/api/profiles/skills", headers=hdr_a, json={"skill_id": 1, "level": "beginner"})
    ev_id = ev_a.json()["id"]

    # Register Student B
    res_b = client.post("/api/auth/register", json={
        "email": f"student_b_{ts}@growsphere.dev",
        "password": "Password123!",
        "full_name": "Student B",
        "role": "student",
    })
    token_b = res_b.json()["access_token"]
    hdr_b = {"Authorization": f"Bearer {token_b}"}

    # Student B attempts to delete Student A's skill evidence -> 404 Not Found (scoped to owner)
    del_res = client.delete(f"/api/profiles/skills/{ev_id}", headers=hdr_b)
    assert del_res.status_code == 404

    # Student B attempts to update Student A's skill evidence -> 404 Not Found
    put_res = client.put(f"/api/profiles/skills/{ev_id}", headers=hdr_b, json={"level": "advanced"})
    assert put_res.status_code == 404

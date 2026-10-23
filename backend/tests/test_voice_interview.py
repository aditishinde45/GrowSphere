"""
Tests for Real-Time AI Voice Mock Interview Feature.
Validates pre-interview profiling & plan generation, real-time voice speech turns,
probing contextual follow-ups, and comprehensive 5-pillar performance diagnostics
with Senior/Principal Engineer model answers.
"""

import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def auth_header(email="student@growsphere.dev", password="password123"):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_voice_interview_plan_preview():
    stud_hdr = auth_header()
    res = client.post(
        "/api/mock-interviews/plan",
        headers=stud_hdr,
        json={
            "target_role": "Data Analyst",
            "duration_minutes": 15,
            "experience_level": "Mid-Level",
            "resume_text": "Built real-time SQL data pipelines in PostgreSQL, decreasing latency by 35% with composite indexes.",
        },
    )
    assert res.status_code == 200
    plan = res.json()
    assert "plan_id" in plan
    assert "greeting" in plan
    assert "Dr. Aris" in plan["greeting"]
    assert "agenda" in plan
    assert len(plan["agenda"]) > 0
    assert "candidate_summary" in plan
    assert "questions" in plan
    assert len(plan["questions"]) > 0


def test_voice_interview_lifecycle():
    stud_hdr = auth_header()

    # 1. Start voice session with 15 mins duration and custom resume context
    start_res = client.post(
        "/api/mock-interviews/start",
        headers=stud_hdr,
        json={
            "target_role": "Senior Backend Engineer",
            "interview_mode": "voice",
            "duration_minutes": 15,
            "experience_level": "Senior",
            "resume_text": "Architected distributed event streaming using Redis and Kafka with 99.99% uptime.",
        },
    )
    assert start_res.status_code == 200
    session = start_res.json()
    session_id = session["id"]
    assert session["interview_mode"] == "voice"
    assert session["duration_minutes"] == 15
    assert "greeting" in session
    assert len(session["questions"]) > 0

    # 2. Candidate gives a brief answer -> AI should ask a probing follow-up
    brief_turn = client.post(
        f"/api/mock-interviews/{session_id}/turn",
        headers=stud_hdr,
        json={
            "user_spoken_text": "I used Redis for caching.",
            "elapsed_seconds": 90,
            "question_index": 0,
        },
    )
    assert brief_turn.status_code == 200
    turn_data = brief_turn.json()
    assert turn_data["is_followup"] is True
    assert turn_data["next_question_index"] == 0
    assert len(turn_data["ai_response_text"]) > 10

    # 3. Candidate answers follow-up with deep technical and STAR methodology details
    detailed_turn = client.post(
        f"/api/mock-interviews/{session_id}/turn",
        headers=stud_hdr,
        json={
            "user_spoken_text": (
                "To optimize latency under high concurrent load, we implemented a cache-aside pattern with Redis. "
                "Because our read-to-write ratio was 9:1, we indexed composite keys and set strict 5-minute TTLs with "
                "jitter to avoid cache stampedes. As a result, our p99 query latency decreased from 420ms to 45ms."
            ),
            "elapsed_seconds": 210,
            "question_index": 0,
        },
    )
    assert detailed_turn.status_code == 200
    detailed_data = detailed_turn.json()
    assert detailed_data["is_followup"] is False
    assert detailed_data["next_question_index"] == 1
    assert "live_metrics" in detailed_data
    assert detailed_data["live_metrics"]["star_structure_detected"] is True

    # 4. Finalize the interview session and retrieve 5-pillar diagnostics
    finalize_res = client.post(
        f"/api/mock-interviews/{session_id}/finalize",
        headers=stud_hdr,
        json={"elapsed_seconds": 650},
    )
    assert finalize_res.status_code == 200
    report = finalize_res.json()
    assert "overall_score" in report
    assert report["overall_score"] >= 0.70
    assert "pillar_scores" in report
    assert "technical_knowledge" in report["pillar_scores"]
    assert "communication_articulation" in report["pillar_scores"]
    assert "problem_solving" in report["pillar_scores"]
    assert "strengths" in report
    assert len(report["strengths"]) > 0
    assert "weaknesses" in report
    assert len(report["weaknesses"]) > 0
    assert "question_reviews" in report
    assert len(report["question_reviews"]) > 0
    assert "principal_engineer_exemplar" in report["question_reviews"][0]
    assert "roadmap_recommendations" in report

    # 5. Verify session retrieval
    get_res = client.get(f"/api/mock-interviews/{session_id}", headers=stud_hdr)
    assert get_res.status_code == 200
    session_details = get_res.json()
    assert session_details["status"] == "completed"
    assert session_details["overall_score"] == report["overall_score"]
    assert len(session_details["transcript"]) >= 3

    # 6. Verify session appears in learner history
    hist_res = client.get("/api/mock-interviews/my-history", headers=stud_hdr)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert any(h["id"] == session_id for h in history)

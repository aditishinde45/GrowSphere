"""
Skill Assessments router — practical quizzes, grading, gating, and evidence recording.
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    User, SkillAssessment, AssessmentAttempt, SkillEvidence,
    EvidenceType, SkillLevel, Roadmap, RoadmapTopic, Skill, AuditLog
)
from app.schemas import (
    AssessmentOut, AssessmentDetailOut, AssessmentSubmit, AttemptOut
)
from app.dependencies import get_current_user, require_learner

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.get("/", response_model=List[AssessmentOut])
def list_assessments(
    skill_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List available active skill assessments."""
    q = db.query(SkillAssessment).filter(SkillAssessment.is_active == True)
    if skill_id:
        q = q.filter(SkillAssessment.skill_id == skill_id)
    return q.all()


@router.get("/{assessment_id}", response_model=AssessmentDetailOut)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get assessment details and questions for taking the quiz.
    Correct answers and rubrics are stripped out to prevent cheating.
    """
    assessment = db.query(SkillAssessment).filter(
        SkillAssessment.id == assessment_id,
        SkillAssessment.is_active == True,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found or inactive")

    # Sanitize questions: strip correct_answer / rubric
    sanitized_questions = []
    for q in (assessment.questions or []):
        sanitized_questions.append({
            "id": q.get("id"),
            "question": q.get("question"),
            "code_snippet": q.get("code_snippet"),
            "options": q.get("options", []),
            "topic": q.get("topic"),
        })

    return AssessmentDetailOut(
        id=assessment.id,
        skill_id=assessment.skill_id,
        title=assessment.title,
        description=assessment.description,
        assessment_type=assessment.assessment_type,
        pass_threshold=assessment.pass_threshold,
        max_attempts=assessment.max_attempts,
        time_limit_minutes=assessment.time_limit_minutes,
        questions=sanitized_questions,
    )


@router.get("/skill/{skill_id}", response_model=AssessmentDetailOut)
def get_assessment_by_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get active assessment for a given skill."""
    assessment = db.query(SkillAssessment).filter(
        SkillAssessment.skill_id == skill_id,
        SkillAssessment.is_active == True,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment available for this skill yet")

    return get_assessment(assessment.id, db, current_user)


@router.post("/{assessment_id}/submit", response_model=AttemptOut)
def submit_assessment(
    assessment_id: int,
    submission: AssessmentSubmit,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Grade assessment submission, record attempt, and if passed:
    - Grant verified SkillEvidence (evidence_type=assessed, confidence=0.9)
    - Mark corresponding roadmap topic completed
    - Unlock next topic in roadmap sequence
    """
    assessment = db.query(SkillAssessment).filter(
        SkillAssessment.id == assessment_id,
        SkillAssessment.is_active == True,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Check attempt count
    existing_attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id,
        AssessmentAttempt.assessment_id == assessment_id,
    ).count()

    if existing_attempts >= assessment.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum attempts ({assessment.max_attempts}) reached for this assessment.",
        )

    attempt_number = existing_attempts + 1
    questions = assessment.questions or []
    total_q = len(questions)
    if total_q == 0:
        raise HTTPException(status_code=400, detail="Assessment has no questions configured.")

    correct_count = 0
    feedback = {}
    weak_areas = []

    for q in questions:
        qid = str(q.get("id"))
        correct_opt = q.get("correct_answer")
        explanation = q.get("explanation", "")
        user_answer = submission.answers.get(qid) or submission.answers.get(int(qid) if qid.isdigit() else qid)

        is_correct = (str(user_answer).strip().lower() == str(correct_opt).strip().lower()) if user_answer is not None else False
        if is_correct:
            correct_count += 1
            feedback[qid] = {
                "correct": True,
                "explanation": explanation,
            }
        else:
            topic = q.get("topic", "General")
            if topic not in weak_areas:
                weak_areas.append(topic)
            feedback[qid] = {
                "correct": False,
                "user_answer": user_answer,
                "correct_answer": correct_opt,
                "explanation": explanation,
            }

    score = round(correct_count / total_q, 4)
    passed = score >= assessment.pass_threshold

    # Revision resources if not passed
    revision_resources = []
    if not passed:
        skill = db.query(Skill).filter(Skill.id == assessment.skill_id).first()
        revision_resources = [
            f"Review fundamental concepts in {skill.canonical_name if skill else 'this skill'}",
            f"Focus on weak topics: {', '.join(weak_areas) if weak_areas else 'core questions'}",
            "Complete practice exercises before attempting again",
        ]

    now = datetime.now(timezone.utc)
    attempt = AssessmentAttempt(
        user_id=current_user.id,
        assessment_id=assessment.id,
        attempt_number=attempt_number,
        score=score,
        passed=passed,
        answers=submission.answers,
        feedback=feedback,
        weak_areas=weak_areas,
        revision_resources=revision_resources,
        time_taken_seconds=submission.time_taken_seconds,
        started_at=now,
        completed_at=now,
    )
    db.add(attempt)
    db.flush()

    # If passed -> Record verified skill evidence & update roadmap
    if passed:
        evidence = db.query(SkillEvidence).filter(
            SkillEvidence.user_id == current_user.id,
            SkillEvidence.skill_id == assessment.skill_id,
        ).first()

        confidence_explanation = (
            f"Demonstrated proficiency on {assessment.title} with a score of "
            f"{int(score * 100)}% (pass threshold: {int(assessment.pass_threshold * 100)}%)."
        )

        if not evidence:
            evidence = SkillEvidence(
                user_id=current_user.id,
                skill_id=assessment.skill_id,
                evidence_type=EvidenceType.ASSESSED,
                level=SkillLevel.INTERMEDIATE,
                confidence_score=0.9,
                confidence_explanation=confidence_explanation,
                source_description=f"Assessment: {assessment.title}",
                verified_at=now,
            )
            db.add(evidence)
        else:
            # Upgrade evidence to assessed if was self-reported
            evidence.evidence_type = EvidenceType.ASSESSED
            evidence.confidence_score = max(evidence.confidence_score or 0.0, 0.9)
            evidence.confidence_explanation = confidence_explanation
            evidence.verified_at = now
            if not evidence.level or evidence.level == SkillLevel.BEGINNER:
                evidence.level = SkillLevel.INTERMEDIATE

        # Update active roadmap topics
        active_roadmap = db.query(Roadmap).filter(
            Roadmap.user_id == current_user.id,
            Roadmap.is_active == True,
        ).first()

        if active_roadmap:
            topics = db.query(RoadmapTopic).filter(
                RoadmapTopic.roadmap_id == active_roadmap.id
            ).order_by(RoadmapTopic.order).all()

            completed_topic_idx = None
            for idx, t in enumerate(topics):
                if t.skill_id == assessment.skill_id:
                    t.is_completed = True
                    t.is_locked = False
                    t.completed_at = now
                    completed_topic_idx = idx

            # Unlock next sequential topic
            if completed_topic_idx is not None and completed_topic_idx + 1 < len(topics):
                topics[completed_topic_idx + 1].is_locked = False

            # Recalculate roadmap overall progress
            completed_count = sum(1 for t in topics if t.is_completed)
            active_roadmap.overall_progress = round(completed_count / len(topics), 2) if topics else 0.0

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="assessment.submit",
        entity_type="SkillAssessment",
        entity_id=assessment.id,
        details={
            "score": score,
            "passed": passed,
            "attempt": attempt_number,
        },
    ))

    db.commit()
    db.refresh(attempt)
    return attempt


@router.get("/attempts/history", response_model=List[AttemptOut])
def get_attempt_history(
    assessment_id: Optional[int] = None,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Get all past assessment attempts by the current user."""
    q = db.query(AssessmentAttempt).filter(AssessmentAttempt.user_id == current_user.id)
    if assessment_id:
        q = q.filter(AssessmentAttempt.assessment_id == assessment_id)
    return q.order_by(AssessmentAttempt.completed_at.desc()).all()


@router.get("/attempts/{attempt_id}", response_model=AttemptOut)
def get_attempt_detail(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific attempt with feedback and weak areas."""
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this attempt")
    return attempt

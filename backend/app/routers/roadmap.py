"""
Roadmap router — generate and manage learning roadmaps.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, UserRole, Roadmap, RoadmapTopic, Skill, SkillDependency,
    CareerRole, SkillEvidence, SkillAssessment, StudentProfile, EmployeeProfile,
    career_role_skills,
)
from app.schemas import RoadmapOut, RoadmapTopicOut
from app.dependencies import get_current_user, require_learner

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


@router.post("/generate", response_model=RoadmapOut)
def generate_roadmap(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Generate (or regenerate) a dependency-aware roadmap for the user's target role.
    Topics are ordered by prerequisites, and locked until previous topics are completed.
    Only gap skills (not already verified) are included.
    """
    # Find target role
    target_role_id = None
    if current_user.role == UserRole.STUDENT and current_user.student_profile:
        target_role_id = current_user.student_profile.target_role_id
    elif current_user.role == UserRole.EMPLOYEE and current_user.employee_profile:
        target_role_id = current_user.employee_profile.target_role_id

    if not target_role_id:
        raise HTTPException(status_code=400, detail="Set a target role first.")

    role = (
        db.query(CareerRole)
        .options(joinedload(CareerRole.required_skills))
        .filter(CareerRole.id == target_role_id)
        .first()
    )
    if not role:
        raise HTTPException(status_code=404, detail="Career role not found")

    # Deactivate any existing active roadmap for this role
    db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.career_role_id == target_role_id,
        Roadmap.is_active == True,
    ).update({"is_active": False})

    # Get user's verified skills
    evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == current_user.id).all()
    verified_skill_ids = set()
    for ev in evidences:
        if ev.evidence_type.value in ("assessed", "project", "mentor_endorsed"):
            verified_skill_ids.add(ev.skill_id)

    # Get all dependencies
    deps = db.query(SkillDependency).all()
    dep_map = {}
    for d in deps:
        dep_map.setdefault(d.skill_id, []).append(d.prerequisite_id)

    # Build ordered topic list using topological sort
    role_skill_ids = [s.id for s in role.required_skills]
    gap_skill_ids = [sid for sid in role_skill_ids if sid not in verified_skill_ids]

    ordered_skills = _topological_sort(gap_skill_ids, dep_map)

    # Create roadmap
    roadmap = Roadmap(
        user_id=current_user.id,
        career_role_id=target_role_id,
        title=f"Roadmap: {role.title}",
        description=f"Personalized learning path for {role.title} based on your skill gaps.",
    )
    db.add(roadmap)
    db.flush()

    # Create topics
    completed_in_roadmap = set()
    for order, skill_id in enumerate(ordered_skills, 1):
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            continue

        # Check if prerequisites are met (either verified or already completed in roadmap)
        prereqs = dep_map.get(skill_id, [])
        prereqs_in_gap = [p for p in prereqs if p in set(gap_skill_ids)]
        is_locked = len(prereqs_in_gap) > 0 and not all(p in completed_in_roadmap for p in prereqs_in_gap)

        # The first topic is always unlocked
        if order == 1:
            is_locked = False

        # Find assessment for this skill
        assessment = db.query(SkillAssessment).filter(
            SkillAssessment.skill_id == skill_id,
            SkillAssessment.is_active == True,
        ).first()

        topic = RoadmapTopic(
            roadmap_id=roadmap.id,
            skill_id=skill_id,
            title=skill.canonical_name,
            description=f"Learn and demonstrate proficiency in {skill.canonical_name}",
            order=order,
            is_locked=is_locked,
            assessment_id=assessment.id if assessment else None,
        )
        db.add(topic)

    db.commit()
    db.refresh(roadmap)

    return _roadmap_to_out(roadmap, db)


@router.get("/active", response_model=RoadmapOut)
def get_active_roadmap(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Get the user's active roadmap."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == current_user.id, Roadmap.is_active == True)
        .options(joinedload(Roadmap.topics))
        .first()
    )
    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap. Generate one from your target role.")

    return _roadmap_to_out(roadmap, db)


@router.get("/", response_model=List[RoadmapOut])
def list_roadmaps(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """List all roadmaps for the current user."""
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == current_user.id).all()
    return [_roadmap_to_out(r, db) for r in roadmaps]


def _roadmap_to_out(roadmap: Roadmap, db: Session) -> RoadmapOut:
    """Convert a Roadmap ORM object to RoadmapOut schema."""
    role = db.query(CareerRole).filter(CareerRole.id == roadmap.career_role_id).first()
    topics = db.query(RoadmapTopic).filter(RoadmapTopic.roadmap_id == roadmap.id).order_by(RoadmapTopic.order).all()

    deps = db.query(SkillDependency).all()
    dep_map = {}
    for d in deps:
        dep_map.setdefault(d.skill_id, []).append(d.prerequisite_id)
    all_skills = {s.id: s.canonical_name for s in db.query(Skill).all()}

    topic_outs = []
    for t in topics:
        skill_name = all_skills.get(t.skill_id, "Unknown")
        prereq_ids = dep_map.get(t.skill_id, [])
        prereqs = [all_skills.get(pid, f"Skill #{pid}") for pid in prereq_ids]
        topic_outs.append(RoadmapTopicOut(
            id=t.id,
            skill_id=t.skill_id,
            skill_name=skill_name,
            title=t.title,
            description=t.description,
            order=t.order,
            is_completed=t.is_completed,
            is_locked=t.is_locked,
            assessment_id=t.assessment_id,
            recommended_resources=t.recommended_resources,
            estimated_hours=10,  # ~10 hours effort per topic
            prerequisites=prereqs,
            completed_at=t.completed_at,
        ))

    return RoadmapOut(
        id=roadmap.id,
        career_role_id=roadmap.career_role_id,
        career_role_title=role.title if role else "Unknown",
        title=roadmap.title,
        overall_progress=roadmap.overall_progress,
        is_active=roadmap.is_active,
        topics=topic_outs,
        created_at=roadmap.created_at,
    )


def _topological_sort(skill_ids: list, dep_map: dict) -> list:
    """
    Topological sort of skill_ids respecting prerequisites from dep_map.
    Skills with fewer/no prerequisites come first.
    """
    skill_set = set(skill_ids)
    in_degree = {sid: 0 for sid in skill_ids}

    for sid in skill_ids:
        for prereq in dep_map.get(sid, []):
            if prereq in skill_set:
                in_degree[sid] = in_degree.get(sid, 0) + 1

    # BFS — start with skills that have no prerequisites
    queue = sorted([sid for sid in skill_ids if in_degree.get(sid, 0) == 0])
    result = []

    while queue:
        current = queue.pop(0)
        result.append(current)

        # Find skills that depend on current
        for sid in skill_ids:
            if current in dep_map.get(sid, []) and sid not in result:
                in_degree[sid] -= 1
                if in_degree[sid] == 0 and sid not in queue:
                    queue.append(sid)
                    queue.sort()  # Stable ordering

    # Add any remaining (circular deps — shouldn't happen but be safe)
    for sid in skill_ids:
        if sid not in result:
            result.append(sid)

    return result

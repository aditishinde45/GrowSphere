"""
Roadmap router — generate, validate, customize, and track personalized learning roadmaps.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import (
    User, UserRole, Roadmap, RoadmapTopic, Skill, SkillDependency,
    CareerRole, SkillEvidence, SkillAssessment, StudentProfile, EmployeeProfile,
)
from app.schemas import (
    RoadmapOut, RoadmapTopicOut,
    PersonalizedRoadmapRequest,
    DeadlineValidationRequest,
    DeadlineValidationResponse,
    TaskToggleRequest,
)
from app.dependencies import get_current_user, require_learner
from app.services.roadmap_service import (
    validate_learning_deadline,
    generate_personalized_roadmap_data,
)

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


@router.post("/validate-deadline", response_model=DeadlineValidationResponse)
def validate_deadline_endpoint(
    req: DeadlineValidationRequest,
    current_user: User = Depends(require_learner),
):
    """
    Intelligently validates whether the user's requested learning timeline is achievable
    based on skill complexity, amount of content, user's current proficiency, and available hours.
    Returns feasibility status, warnings, realistic suggested timeline, and accelerated option details.
    """
    if not req.skill_name or len(req.skill_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please enter a valid skill name.")

    result = validate_learning_deadline(
        skill_name=req.skill_name,
        current_level=req.current_level,
        target_level=req.target_level or "Job-Ready / Advanced",
        deadline_str=req.deadline,
        hours_per_week=req.hours_per_week or 15,
    )
    return result


@router.post("/generate-personalized", response_model=RoadmapOut)
def generate_personalized_roadmap(
    req: PersonalizedRoadmapRequest,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Generates a realistic, structured, and personalized AI learning roadmap for a specific skill.
    Includes deadline validation, real course matching from database, practical exercises,
    projects, assessments, and milestones.
    Saves to the user's account and returns the complete roadmap.
    """
    if not req.skill_name or len(req.skill_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Skill name is required.")

    # 1. Validate deadline
    validation = validate_learning_deadline(
        skill_name=req.skill_name,
        current_level=req.current_level,
        target_level=req.target_level or "Job-Ready / Advanced",
        deadline_str=req.deadline or "30 days",
        hours_per_week=req.hours_per_week or 15,
    )

    # If timeline is unachievable and user has NOT confirmed accelerated mode, inform user
    if not validation["is_feasible"] and not req.force_accelerated:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "UNREALISTIC_DEADLINE",
                "message": validation["message"],
                "validation": validation,
            }
        )

    is_accelerated = bool(req.force_accelerated or (not validation["is_feasible"]))

    # 2. Generate roadmap learning plan
    plan_data = generate_personalized_roadmap_data(
        db=db,
        user=current_user,
        skill_name=req.skill_name,
        current_level=req.current_level,
        target_level=req.target_level or "Job-Ready / Advanced",
        deadline_str=req.deadline or "30 days",
        hours_per_week=req.hours_per_week or 15,
        is_accelerated=is_accelerated,
    )

    # 3. Save to database
    # Deactivate other active roadmaps if this is primary
    db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.is_active == True,
    ).update({"is_active": False})

    new_roadmap = Roadmap(
        user_id=current_user.id,
        career_role_id=None,
        skill_name=req.skill_name.strip(),
        current_level=req.current_level,
        target_level=req.target_level or "Job-Ready / Advanced",
        desired_deadline=req.deadline or "30 days",
        estimated_duration=plan_data["estimated_duration"],
        hours_per_week=req.hours_per_week or 15,
        status="Accelerated" if is_accelerated else "In Progress",
        is_accelerated=is_accelerated,
        deadline_validation=validation,
        learning_plan=plan_data,
        completed_tasks=[],
        title=plan_data["title"],
        description=plan_data["description"],
        overall_progress=0.0,
        is_active=True,
    )
    db.add(new_roadmap)
    db.commit()
    db.refresh(new_roadmap)

    return _roadmap_to_out(new_roadmap, db)


@router.post("/{roadmap_id}/toggle-task", response_model=RoadmapOut)
def toggle_roadmap_task(
    roadmap_id: int,
    req: TaskToggleRequest,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Marks a task as completed or uncompleted, recalculates overall roadmap progress,
    and updates learning status.
    """
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id,
    ).first()

    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found.")

    completed = list(roadmap.completed_tasks or [])
    task_id = req.task_id

    if req.is_completed:
        if task_id not in completed:
            completed.append(task_id)
    else:
        if task_id in completed:
            completed.remove(task_id)

    # Update in learning_plan tasks
    learning_plan = roadmap.learning_plan or {}
    total_tasks = 0
    phases = learning_plan.get("phases", [])
    for p in phases:
        for t in p.get("tasks", []):
            total_tasks += 1
            if t.get("id") == task_id:
                t["is_completed"] = req.is_completed

    # Recalculate progress percentage
    if total_tasks > 0:
        overall_progress = round((len(completed) / float(total_tasks)) * 100.0, 1)
    else:
        overall_progress = 0.0

    overall_progress = min(overall_progress, 100.0)

    # Update status
    if overall_progress >= 100.0:
        new_status = "Completed"
    elif roadmap.is_accelerated:
        new_status = "Accelerated"
    else:
        new_status = "In Progress"

    roadmap.completed_tasks = completed
    roadmap.overall_progress = overall_progress
    roadmap.status = new_status
    roadmap.learning_plan = learning_plan
    roadmap.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.commit()
    db.refresh(roadmap)

    return _roadmap_to_out(roadmap, db)


@router.post("/{roadmap_id}/regenerate", response_model=RoadmapOut)
def regenerate_existing_roadmap(
    roadmap_id: int,
    req: PersonalizedRoadmapRequest,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Regenerates and adjusts an existing roadmap with new deadline, pace, or target depth.
    """
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id,
    ).first()

    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found.")

    skill_name = req.skill_name or roadmap.skill_name
    current_level = req.current_level or roadmap.current_level or "Beginner"
    target_level = req.target_level or roadmap.target_level or "Job-Ready / Advanced"
    deadline_str = req.deadline or roadmap.desired_deadline or "30 days"
    hours_per_week = req.hours_per_week or roadmap.hours_per_week or 15

    validation = validate_learning_deadline(
        skill_name=skill_name,
        current_level=current_level,
        target_level=target_level,
        deadline_str=deadline_str,
        hours_per_week=hours_per_week,
    )

    is_accelerated = bool(req.force_accelerated or (not validation["is_feasible"]))

    plan_data = generate_personalized_roadmap_data(
        db=db,
        user=current_user,
        skill_name=skill_name,
        current_level=current_level,
        target_level=target_level,
        deadline_str=deadline_str,
        hours_per_week=hours_per_week,
        is_accelerated=is_accelerated,
    )

    roadmap.skill_name = skill_name
    roadmap.current_level = current_level
    roadmap.target_level = target_level
    roadmap.desired_deadline = deadline_str
    roadmap.estimated_duration = plan_data["estimated_duration"]
    roadmap.hours_per_week = hours_per_week
    roadmap.status = "Accelerated" if is_accelerated else "In Progress"
    roadmap.is_accelerated = is_accelerated
    roadmap.deadline_validation = validation
    roadmap.learning_plan = plan_data
    roadmap.completed_tasks = []
    roadmap.title = plan_data["title"]
    roadmap.description = plan_data["description"]
    roadmap.overall_progress = 0.0
    roadmap.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.commit()
    db.refresh(roadmap)

    return _roadmap_to_out(roadmap, db)


@router.get("/{roadmap_id}", response_model=RoadmapOut)
def get_roadmap_by_id(
    roadmap_id: int,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Get complete details for a specific roadmap."""
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id,
    ).first()

    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found.")

    return _roadmap_to_out(roadmap, db)


@router.delete("/{roadmap_id}")
def delete_roadmap(
    roadmap_id: int,
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Delete a roadmap from user's account."""
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id,
    ).first()

    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found.")

    db.query(RoadmapTopic).filter(RoadmapTopic.roadmap_id == roadmap_id).delete()
    db.delete(roadmap)
    db.commit()

    return {"status": "deleted", "roadmap_id": roadmap_id}


@router.get("/active", response_model=RoadmapOut)
def get_active_roadmap(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """Get the user's active roadmap."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == current_user.id, Roadmap.is_active == True)
        .order_by(Roadmap.updated_at.desc().nullslast(), Roadmap.created_at.desc())
        .first()
    )
    if not roadmap:
        # Fall back to latest roadmap
        roadmap = (
            db.query(Roadmap)
            .filter(Roadmap.user_id == current_user.id)
            .order_by(Roadmap.created_at.desc())
            .first()
        )

    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found. Create your first roadmap!")

    return _roadmap_to_out(roadmap, db)


@router.get("/", response_model=List[RoadmapOut])
def list_roadmaps(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """List all saved roadmaps for the current user."""
    roadmaps = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.is_active.desc(), Roadmap.created_at.desc())
        .all()
    )
    return [_roadmap_to_out(r, db) for r in roadmaps]


# ─── Legacy Role-Based Generator (Preserved) ──────────────────────────────────
@router.post("/generate", response_model=RoadmapOut)
def generate_role_roadmap(
    current_user: User = Depends(require_learner),
    db: Session = Depends(get_db),
):
    """
    Legacy generator for role-based gap roadmaps.
    """
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

    db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.career_role_id == target_role_id,
        Roadmap.is_active == True,
    ).update({"is_active": False})

    evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == current_user.id).all()
    verified_skill_ids = set()
    for ev in evidences:
        if ev.evidence_type.value in ("assessed", "project", "mentor_endorsed"):
            verified_skill_ids.add(ev.skill_id)

    deps = db.query(SkillDependency).all()
    dep_map = {}
    for d in deps:
        dep_map.setdefault(d.skill_id, []).append(d.prerequisite_id)

    role_skill_ids = [s.id for s in role.required_skills]
    gap_skill_ids = [sid for sid in role_skill_ids if sid not in verified_skill_ids]

    ordered_skills = _topological_sort(gap_skill_ids, dep_map)

    roadmap = Roadmap(
        user_id=current_user.id,
        career_role_id=target_role_id,
        skill_name=role.title,
        title=f"Roadmap: {role.title}",
        description=f"Personalized learning path for {role.title} based on your skill gaps.",
        status="In Progress",
        overall_progress=0.0,
        is_active=True,
    )
    db.add(roadmap)
    db.flush()

    for order, skill_id in enumerate(ordered_skills, 1):
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            continue
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
            is_locked=(order > 1),
            assessment_id=assessment.id if assessment else None,
        )
        db.add(topic)

    db.commit()
    db.refresh(roadmap)

    return _roadmap_to_out(roadmap, db)


# ─── Helper: ORM to Schema Converter ──────────────────────────────────────────
def _roadmap_to_out(roadmap: Roadmap, db: Session) -> RoadmapOut:
    """Convert Roadmap ORM to RoadmapOut schema."""
    role = None
    if roadmap.career_role_id:
        role = db.query(CareerRole).filter(CareerRole.id == roadmap.career_role_id).first()

    topics = db.query(RoadmapTopic).filter(RoadmapTopic.roadmap_id == roadmap.id).order_by(RoadmapTopic.order).all()

    topic_outs = []
    if topics:
        deps = db.query(SkillDependency).all()
        dep_map = {}
        for d in deps:
            dep_map.setdefault(d.skill_id, []).append(d.prerequisite_id)
        all_skills = {s.id: s.canonical_name for s in db.query(Skill).all()}

        for t in topics:
            sname = all_skills.get(t.skill_id, "Unknown")
            prereq_ids = dep_map.get(t.skill_id, [])
            prereqs = [all_skills.get(pid, f"Skill #{pid}") for pid in prereq_ids]
            topic_outs.append(RoadmapTopicOut(
                id=t.id,
                skill_id=t.skill_id,
                skill_name=sname,
                title=t.title,
                description=t.description,
                order=t.order,
                is_completed=t.is_completed,
                is_locked=t.is_locked,
                assessment_id=t.assessment_id,
                recommended_resources=t.recommended_resources,
                estimated_hours=10,
                prerequisites=prereqs,
                completed_at=t.completed_at,
            ))

    return RoadmapOut(
        id=roadmap.id,
        user_id=roadmap.user_id,
        career_role_id=roadmap.career_role_id,
        career_role_title=role.title if role else None,
        skill_name=roadmap.skill_name or (role.title if role else "Custom Skill"),
        current_level=roadmap.current_level or "Beginner",
        target_level=roadmap.target_level or "Job-Ready / Advanced",
        desired_deadline=roadmap.desired_deadline,
        estimated_duration=roadmap.estimated_duration,
        hours_per_week=roadmap.hours_per_week or 10,
        status=roadmap.status or "In Progress",
        is_accelerated=bool(roadmap.is_accelerated),
        deadline_validation=roadmap.deadline_validation,
        learning_plan=roadmap.learning_plan,
        completed_tasks=list(roadmap.completed_tasks or []),
        title=roadmap.title,
        description=roadmap.description,
        overall_progress=float(roadmap.overall_progress or 0.0),
        is_active=bool(roadmap.is_active),
        topics=topic_outs,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at,
    )


def _topological_sort(skill_ids: list, dep_map: dict) -> list:
    skill_set = set(skill_ids)
    in_degree = {sid: 0 for sid in skill_ids}
    for sid in skill_ids:
        for prereq in dep_map.get(sid, []):
            if prereq in skill_set:
                in_degree[sid] = in_degree.get(sid, 0) + 1

    queue = sorted([sid for sid in skill_ids if in_degree.get(sid, 0) == 0])
    result = []
    while queue:
        current = queue.pop(0)
        result.append(current)
        for sid in skill_ids:
            if current in dep_map.get(sid, []) and sid not in result:
                in_degree[sid] -= 1
                if in_degree[sid] == 0 and sid not in queue:
                    queue.append(sid)
                    queue.sort()

    for sid in skill_ids:
        if sid not in result:
            result.append(sid)
    return result

"""
Learning Materials & Flashcards Router.
Provides on-demand AI notes, flashcard study decks, and practice questions linked to roadmap topics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from typing import Optional
from app.models import User, RoadmapTopic, LearningMaterial, utcnow
from app.dependencies import get_current_user_optional
from app.services.ai_service import ai_provider

router = APIRouter(prefix="/learning-materials", tags=["Learning Materials & Flashcards"])


@router.get("/{topic_id}")
@router.get("/topic/{topic_id}")
def get_topic_materials(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Retrieve or dynamically generate practice flashcards, notes, and questions for a topic.
    """
    topic = (
        db.query(RoadmapTopic)
        .options(joinedload(RoadmapTopic.skill))
        .filter(RoadmapTopic.id == topic_id)
        .first()
    )
    if not topic:
        raise HTTPException(status_code=404, detail="Roadmap topic not found")

    skill_name = topic.skill.canonical_name if topic.skill else "Data Analysis"
    uid = current_user.id if current_user else 1

    # Check for existing persisted material
    existing = (
        db.query(LearningMaterial)
        .filter(LearningMaterial.user_id == uid, LearningMaterial.topic_id == topic_id)
        .first()
    )
    if existing:
        res = dict(existing.content_json)
        res["study_notes"] = res.get("study_notes") or res.get("notes")
        return res

    # Generate via AI provider
    material = ai_provider.generate_learning_material(skill_name, topic.title)
    material["study_notes"] = material.get("notes")

    record = LearningMaterial(
        user_id=uid,
        topic_id=topic.id,
        skill_id=topic.skill_id,
        material_type="composite_deck",
        title=f"Study Deck: {topic.title}",
        content_json=material,
        created_at=utcnow(),
    )
    db.add(record)
    db.commit()

    return material

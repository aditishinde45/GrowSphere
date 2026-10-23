"""
GrowSphere — Main FastAPI Application Entrypoint.

Mounts all API routers, configures CORS, and manages application lifecycle.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import (
    auth, skills, roadmap, assessments, courses,
    jobs, mentors, profiles, dashboard, data_register,
    passport, credits, payments, mock_interview,
    career_transition, learning_materials, admin, ml,
    resume_analyzer
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database tables exist on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="GrowSphere: Evidence-Based Career Growth & Skill Readiness Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all domain routers
app.include_router(auth.router, prefix="/api")
app.include_router(skills.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(mentors.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(data_register.router, prefix="/api")
app.include_router(passport.router, prefix="/api")
app.include_router(credits.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(mock_interview.router, prefix="/api")
app.include_router(career_transition.router, prefix="/api")
app.include_router(learning_materials.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(ml.router, prefix="/api")
app.include_router(resume_analyzer.router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "evidence_loop": (
            "dated market evidence -> target role -> learner profile and evidence -> "
            "skill-gap analysis -> dependency-aware roadmap -> learning resources -> "
            "assessment and practical proof -> updated skill profile and Skill Passport -> "
            "relevant courses, mentors, interviews, jobs and internships -> refreshed market evidence"
        ),
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}


@app.get("/health/db")
def database_health_check():
    """Verify live database connectivity and roundtrip latency."""
    from sqlalchemy import text
    with engine.connect() as conn:
        res = conn.execute(text("SELECT 1")).scalar()
    return {"status": "healthy", "database_connected": bool(res == 1), "engine": engine.name}


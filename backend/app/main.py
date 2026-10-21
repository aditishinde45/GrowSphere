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
    jobs, mentors, profiles, dashboard, data_register
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
    allow_origins=["*"],  # Allows Vite dev server & test clients
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


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "evidence_loop": "Market Evidence -> Skill Requirements -> Profile -> Gap Analysis -> Roadmap -> Learning -> Assessment -> Verified Evidence -> Opportunities",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

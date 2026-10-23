"""
GrowSphere — Personalized AI Learning Roadmap Engine.

Features:
- Intelligent deadline validation based on skill complexity, user proficiency, and study hours.
- Realistic timeline suggestions with weekly commitment breakdown.
- Accelerated Crash Course generation for tight deadlines with explicit scope trade-offs.
- Real course matching from the GrowSphere catalog (Coursera, Udemy, edX, NPTEL).
- Phase-wise learning plans with practical exercises, projects, assessments, and milestones.
- Dynamic task completion and progress recalculation.
"""

import math
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, text

from app.models import Course, Skill, SkillEvidence, User, UserRole, StudentProfile, EmployeeProfile
from app.services.ai_service import ai_provider

# ─── Skill Complexity Knowledge Base ─────────────────────────────────────────
SKILL_COMPLEXITY_MAP = {
    # Tier 4: Very High (140-180h needed for mastery from scratch)
    "machine learning": {"tier": 4, "base_hours": 150, "category": "AI / Data Science"},
    "deep learning": {"tier": 4, "base_hours": 160, "category": "AI / Data Science"},
    "artificial intelligence": {"tier": 4, "base_hours": 160, "category": "AI / Data Science"},
    "kubernetes": {"tier": 4, "base_hours": 130, "category": "DevOps & Cloud"},
    "distributed systems": {"tier": 4, "base_hours": 160, "category": "Software Architecture"},
    "cloud architecture": {"tier": 4, "base_hours": 140, "category": "DevOps & Cloud"},
    "cyber security": {"tier": 4, "base_hours": 140, "category": "Security"},
    "blockchain": {"tier": 4, "base_hours": 130, "category": "Web3"},
    "full-stack": {"tier": 4, "base_hours": 160, "category": "Web Development"},
    "full stack": {"tier": 4, "base_hours": 160, "category": "Web Development"},
    "system design": {"tier": 4, "base_hours": 120, "category": "Software Architecture"},
    "microservices": {"tier": 4, "base_hours": 120, "category": "Software Architecture"},
    "devops": {"tier": 4, "base_hours": 140, "category": "DevOps & Cloud"},

    # Tier 3: High (80-120h needed)
    "react": {"tier": 3, "base_hours": 90, "category": "Frontend Development"},
    "react native": {"tier": 3, "base_hours": 95, "category": "Mobile Development"},
    "python": {"tier": 3, "base_hours": 80, "category": "Programming Languages"},
    "fastapi": {"tier": 3, "base_hours": 75, "category": "Backend Development"},
    "node.js": {"tier": 3, "base_hours": 85, "category": "Backend Development"},
    "nodejs": {"tier": 3, "base_hours": 85, "category": "Backend Development"},
    "data structures": {"tier": 3, "base_hours": 100, "category": "Computer Science"},
    "algorithms": {"tier": 3, "base_hours": 100, "category": "Computer Science"},
    "postgresql": {"tier": 3, "base_hours": 75, "category": "Database Engineering"},
    "flutter": {"tier": 3, "base_hours": 90, "category": "Mobile Development"},
    "golang": {"tier": 3, "base_hours": 90, "category": "Programming Languages"},
    "rust": {"tier": 4, "base_hours": 150, "category": "Programming Languages"},
    "data science": {"tier": 3, "base_hours": 110, "category": "Data Science"},

    # Tier 2: Medium (40-60h needed)
    "sql": {"tier": 2, "base_hours": 45, "category": "Database & Querying"},
    "docker": {"tier": 2, "base_hours": 50, "category": "DevOps & Cloud"},
    "git": {"tier": 2, "base_hours": 30, "category": "Developer Tooling"},
    "pandas": {"tier": 2, "base_hours": 40, "category": "Data Analysis"},
    "data analysis": {"tier": 2, "base_hours": 55, "category": "Data Analysis"},
    "ui/ux": {"tier": 2, "base_hours": 50, "category": "Design"},
    "figma": {"tier": 2, "base_hours": 35, "category": "Design"},
    "rest api": {"tier": 2, "base_hours": 40, "category": "Backend Development"},
    "typescript": {"tier": 2, "base_hours": 45, "category": "Frontend Development"},

    # Tier 1: Fundamentals (20-30h needed)
    "html": {"tier": 1, "base_hours": 25, "category": "Web Fundamentals"},
    "css": {"tier": 1, "base_hours": 30, "category": "Web Fundamentals"},
    "prompt engineering": {"tier": 1, "base_hours": 25, "category": "AI Applications"},
    "excel": {"tier": 1, "base_hours": 30, "category": "Business Tools"},
    "linux": {"tier": 2, "base_hours": 45, "category": "Operating Systems"},
}


def _get_skill_complexity(skill_name: str) -> Dict[str, Any]:
    norm = skill_name.strip().lower()
    for key, val in SKILL_COMPLEXITY_MAP.items():
        if key in norm or norm in key:
            return val
    return {"tier": 3, "base_hours": 85, "category": "Technology & Engineering"}


def _parse_deadline_to_days(deadline_str: Optional[str]) -> int:
    """Parses date string or duration phrase into days."""
    if not deadline_str:
        return 30  # Default 1 month

    clean = deadline_str.strip().lower()

    # Match phrase like "3 days", "72 hours", "4 weeks", "2 months"
    match_days = re.search(r"(\d+)\s*(?:day|days|d)", clean)
    if match_days:
        return max(1, int(match_days.group(1)))

    match_hours = re.search(r"(\d+)\s*(?:hour|hours|hr|hrs|h)", clean)
    if match_hours:
        return max(1, math.ceil(int(match_hours.group(1)) / 24.0))

    match_weeks = re.search(r"(\d+)\s*(?:week|weeks|w)", clean)
    if match_weeks:
        return max(1, int(match_weeks.group(1)) * 7)

    match_months = re.search(r"(\d+)\s*(?:month|months|m)", clean)
    if match_months:
        return max(1, int(match_months.group(1)) * 30)

    # Try ISO date format: YYYY-MM-DD
    try:
        target_date = datetime.strptime(clean.split("t")[0], "%Y-%m-%d").date()
        today = datetime.now(timezone.utc).date()
        delta = (target_date - today).days
        return max(1, delta)
    except Exception:
        pass

    return 30


# ─── Deadline Validation Engine ──────────────────────────────────────────────
def validate_learning_deadline(
    skill_name: str,
    current_level: str,
    target_level: str,
    deadline_str: str,
    hours_per_week: int = 15,
) -> Dict[str, Any]:
    """
    Intelligent deadline evaluation mechanism.
    Evaluates requested timeline vs skill complexity and user proficiency.
    Never blindly generates unachievable plans.
    """
    complexity_info = _get_skill_complexity(skill_name)
    base_hours = complexity_info["base_hours"]
    tier = complexity_info["tier"]

    # Level multiplier
    level_lower = current_level.lower()
    if "adv" in level_lower:
        needed_hours = int(base_hours * 0.35)
    elif "inter" in level_lower:
        needed_hours = int(base_hours * 0.65)
    else:  # beginner / zero knowledge
        needed_hours = base_hours

    # Target multiplier
    target_lower = target_level.lower()
    if "master" in target_lower or "principal" in target_lower or "staff" in target_lower:
        needed_hours = int(needed_hours * 1.3)
    elif "fundament" in target_lower or "basic" in target_lower or "overview" in target_lower:
        needed_hours = int(needed_hours * 0.55)

    days_requested = _parse_deadline_to_days(deadline_str)
    weeks_requested = max(days_requested / 7.0, 0.14)
    hours_per_week = max(hours_per_week or 15, 5)

    # Realistic available study hours
    available_hours = int(weeks_requested * hours_per_week)

    # Calculate recommended realistic duration
    suggested_weeks = math.ceil(needed_hours / float(hours_per_week))
    suggested_weeks = max(suggested_weeks, 2)
    suggested_timeline_text = f"{suggested_weeks} weeks ({suggested_weeks * 7} days) at {hours_per_week} hrs/week"

    # Evaluation ratio
    coverage_ratio = available_hours / float(needed_hours)

    complexity_labels = {1: "Fundamental", 2: "Moderate", 3: "High", 4: "Very High / Deep Engineering"}
    complexity_label = complexity_labels.get(tier, "High")

    # UNREALISTIC / IMPOSSIBLE DEADLINE
    if coverage_ratio < 0.40 or (days_requested <= 4 and tier >= 3):
        is_feasible = False
        status = "unrealistic"
        message = (
            f"The requested timeline of {days_requested} day{'s' if days_requested != 1 else ''} "
            f"(~{available_hours} available study hours) is not realistically feasible for mastering {skill_name} "
            f"from {current_level} to {target_level}. {skill_name} has a {complexity_label.lower()} complexity tier "
            f"requiring roughly {needed_hours} hours of conceptual study, guided coding, and project debugging. "
            f"Blindly rushing through this subject in {days_requested} days leads to cognitive overload and superficial retention."
        )
        accelerated_scope = (
            f"Covers high-yield 20% of 80/20 concepts: essential syntax, running minimal working examples, "
            f"and high-level pipeline flow. OMITTED: architectural edge cases, production concurrency, deep debugging, "
            f"and comprehensive portfolio-grade deliverables."
        )
    # AMBITIOUS BUT ATTAINABLE
    elif coverage_ratio < 0.80:
        is_feasible = True
        status = "ambitious"
        message = (
            f"Your timeline of {days_requested} days is ambitious for {skill_name}. "
            f"You will need a focused, disciplined commitment of approximately "
            f"{math.ceil(needed_hours / weeks_requested)} hours/week to complete all learning objectives on time."
        )
        accelerated_scope = None
    # REALISTIC & HEALTHY
    else:
        is_feasible = True
        status = "realistic"
        message = (
            f"Your requested deadline of {days_requested} days is well-calibrated and realistic for {skill_name}. "
            f"This pace permits deep conceptual understanding, practical exercises, and realistic project milestones."
        )
        accelerated_scope = None

    return {
        "is_feasible": is_feasible,
        "status": status,
        "skill_name": skill_name,
        "complexity": complexity_label,
        "estimated_total_hours": needed_hours,
        "requested_days": days_requested,
        "available_hours": available_hours,
        "message": message,
        "suggested_duration_weeks": suggested_weeks,
        "suggested_timeline_text": suggested_timeline_text,
        "suggested_weekly_hours": hours_per_week,
        "accelerated_option_available": True,
        "accelerated_scope_summary": accelerated_scope,
    }


# ─── Relevant Course Matching Engine ─────────────────────────────────────────
def find_relevant_courses_for_skill(db: Session, skill_name: str, current_level: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Analyzes actual courses in the GrowSphere database (titles, descriptions, syllabi, level)
    to match the most relevant courses instead of inventing fake links.
    """
    clean_skill = skill_name.strip().lower()
    tokens = [t for t in re.split(r"[\s\-_/,]+", clean_skill) if len(t) > 2]

    # Search in database courses
    query = db.query(Course).filter(Course.listing_status == "PUBLISHED")

    filter_clauses = []
    for token in tokens:
        filter_clauses.append(Course.title.ilike(f"%{token}%"))
        filter_clauses.append(Course.description.ilike(f"%{token}%"))
        filter_clauses.append(Course.subject.ilike(f"%{token}%"))

    matched = []
    if filter_clauses:
        matched = query.filter(or_(*filter_clauses)).limit(limit * 2).all()

    # Fallback to top-rated courses if skill is novel
    if not matched:
        matched = db.query(Course).filter(Course.listing_status == "PUBLISHED").order_by(Course.rating.desc().nullslast()).limit(limit).all()

    # Rank and map
    results = []
    for c in matched[:limit]:
        # Formulate direct clean URL
        course_url = c.url
        if not course_url:
            if c.platform == "coursera":
                course_url = f"https://www.coursera.org/search?query={clean_skill.replace(' ', '%20')}"
            elif c.platform == "udemy":
                course_url = f"https://www.udemy.com/courses/search/?q={clean_skill.replace(' ', '%20')}"
            elif c.platform == "edx":
                course_url = f"https://www.edx.org/search?q={clean_skill.replace(' ', '%20')}"
            else:
                course_url = f"https://www.google.com/search?q={clean_skill.replace(' ', '+')}+course"

        results.append({
            "id": c.id,
            "title": c.title,
            "platform": (c.platform or "GrowSphere Academy").upper(),
            "institution": c.institution or "GrowSphere Certified Provider",
            "level": c.level or "All Levels",
            "duration_hours": c.duration_hours or 12.0,
            "rating": round(c.rating, 1) if c.rating else 4.7,
            "is_free": bool(c.is_free),
            "url": course_url,
            "description": (c.description[:180] + "...") if c.description and len(c.description) > 180 else (c.description or "Comprehensive structured curriculum with practical exercises."),
        })

    return results


# ─── Personalized Learning Roadmap Generator ─────────────────────────────────
def generate_personalized_roadmap_data(
    db: Session,
    user: User,
    skill_name: str,
    current_level: str,
    target_level: str,
    deadline_str: str,
    hours_per_week: int = 15,
    is_accelerated: bool = False,
) -> Dict[str, Any]:
    """
    Generates a realistic, structured, personalized learning roadmap divided into
    clearly defined phases, weeks, or days, with learning objectives, recommended topics,
    relevant courses, practical exercises, projects, assessments, and milestones.
    """
    validation = validate_learning_deadline(
        skill_name=skill_name,
        current_level=current_level,
        target_level=target_level,
        deadline_str=deadline_str,
        hours_per_week=hours_per_week,
    )

    # Check user existing verified skills for delta reduction
    evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == user.id).all()
    user_skills = {e.skill_id for e in evidences if e.evidence_type.value in ("assessed", "project", "mentor_endorsed")}

    # Retrieve real courses from GrowSphere DB
    db_courses = find_relevant_courses_for_skill(db, skill_name, current_level, limit=6)

    days_requested = validation["requested_days"]
    norm_skill = skill_name.strip()

    # Determine timeline mode: Days (if <= 14 days) or Weeks (if > 14 days)
    use_daily_units = days_requested <= 14 or is_accelerated

    phases = []
    milestones = []
    task_counter = 1

    if is_accelerated:
        # ACCELERATED CRASH ROADMAP (Essentials & High-Yield 80/20 Only)
        num_phases = 2 if days_requested <= 5 else 3
        duration_desc = f"{days_requested} Days (Accelerated Crash Mode)"

        # Phase 1: High-Yield Essentials
        p1_tasks = [
            {
                "id": f"task-{task_counter}",
                "title": f"Core Syntax, Architecture & Mental Models for {norm_skill}",
                "description": f"Master the non-negotiable mental models and foundational constructs of {norm_skill}.",
                "unit": "Day 1" if use_daily_units else "Week 1",
                "estimated_hours": 3,
                "is_completed": False,
                "learning_objectives": [
                    f"Understand core design principles and problem space solved by {norm_skill}",
                    "Set up development environment and write first working prototype",
                    "Identify top 5 frequent patterns and standard library conventions"
                ],
                "practical_exercises": [
                    {
                        "title": f"Hands-on {norm_skill} Sandbox Setup & Hello-World API",
                        "instructions": "Initialize a clean project repo, install dependencies, and run a benchmark test suite.",
                        "deliverable": "Working GitHub repository with passing unit tests.",
                        "estimated_minutes": 90,
                    }
                ],
                "recommended_courses": db_courses[:2],
                "assessment": {
                    "title": f"{norm_skill} Core Foundations Knowledge Check",
                    "type": "Concept Quiz & Code Interpretation",
                    "pass_threshold": "80%",
                    "questions_count": 5,
                }
            }
        ]
        task_counter += 1

        p1_tasks.append({
            "id": f"task-{task_counter}",
            "title": f"High-Impact Practical Patterns & Data Flow in {norm_skill}",
            "description": f"Learn the 20% of {norm_skill} tools and APIs that drive 80% of real-world workflows.",
            "unit": "Day 2" if use_daily_units else "Week 2",
            "estimated_hours": 4,
            "is_completed": False,
            "learning_objectives": [
                "Implement state/data lifecycle management without anti-patterns",
                "Handle asynchronous execution, error boundaries, and defensive validation",
                "Connect to live data sources or persistent storage"
            ],
            "practical_exercises": [
                {
                    "title": f"Mini-Module: State Transformation & Pipeline in {norm_skill}",
                    "instructions": "Create a service that ingests mock data, processes constraints, and exposes an endpoint.",
                    "deliverable": "Documented pull request with error handling test cases.",
                    "estimated_minutes": 120,
                }
            ],
            "recommended_courses": db_courses[2:4] if len(db_courses) >= 4 else db_courses[:2],
            "assessment": {
                "title": f"{norm_skill} Data Flow Diagnostic",
                "type": "Live Code Sandbox Review",
                "pass_threshold": "75%",
                "questions_count": 4,
            }
        })
        task_counter += 1

        phases.append({
            "phase_id": 1,
            "title": "Phase 1: High-Yield Fundamentals & 80/20 Core",
            "duration": f"Days 1-{min(days_requested // 2, 2)}" if use_daily_units else "Weeks 1-2",
            "objective": f"Acquire operational baseline fluency in {norm_skill} syntax and primary workflows.",
            "milestone": "Working prototype executed and verified in sandbox environment.",
            "tasks": p1_tasks,
        })
        milestones.append({
            "id": "ms-1",
            "title": f"Operational Fluency: {norm_skill} Core Setup",
            "timeline": "Phase 1 Completion",
            "achieved": False,
        })

        # Phase 2: Accelerated Capstone Execution
        p2_tasks = [
            {
                "id": f"task-{task_counter}",
                "title": f"Rapid Portfolio Deliverable in {norm_skill}",
                "description": f"Synthesize your learning into a working, demonstrable application showcasing {norm_skill}.",
                "unit": f"Day {days_requested}" if use_daily_units else "Final Week",
                "estimated_hours": 5,
                "is_completed": False,
                "learning_objectives": [
                    f"Integrate all {norm_skill} components into a unified project",
                    "Conduct automated smoke tests and verify zero critical vulnerabilities",
                    "Deploy to public demo URL or prepare technical walkthrough recording"
                ],
                "practical_exercises": [
                    {
                        "title": f"End-to-End {norm_skill} Capstone Project",
                        "instructions": "Build an end-to-end prototype featuring authentication/validation, core domain logic, and clean documentation.",
                        "deliverable": "Public repository link + README with architecture diagram.",
                        "estimated_minutes": 180,
                    }
                ],
                "recommended_courses": db_courses[4:6] if len(db_courses) >= 6 else db_courses[:2],
                "assessment": {
                    "title": f"{norm_skill} Capstone Code & Architecture Rubric",
                    "type": "Project Peer Review & Self-Assessment Rubric",
                    "pass_threshold": "85%",
                    "questions_count": 6,
                }
            }
        ]
        task_counter += 1

        phases.append({
            "phase_id": 2,
            "title": "Phase 2: Accelerated Capstone & Validation",
            "duration": f"Days {min(days_requested // 2 + 1, 3)}-{days_requested}" if use_daily_units else "Final Week",
            "objective": f"Demonstrate practical competence in {norm_skill} by shipping a verifiable deliverable.",
            "milestone": f"Complete functional {norm_skill} project pushed to GitHub with architecture documentation.",
            "tasks": p2_tasks,
        })
        milestones.append({
            "id": "ms-2",
            "title": f"Capstone Shipped: {norm_skill} Practical Proof",
            "timeline": f"Day {days_requested}",
            "achieved": False,
        })

    else:
        # COMPREHENSIVE ROADMAP (Full Structured Phases)
        duration_weeks = max(days_requested // 7, validation["suggested_duration_weeks"])
        duration_desc = f"{duration_weeks} Weeks ({duration_weeks * 7} Days)"

        # Phase 1: Foundations & Architecture
        p1_tasks = [
            {
                "id": f"task-{task_counter}",
                "title": f"Environment Setup & Foundations of {norm_skill}",
                "description": f"Master the architectural philosophy, core syntax, and tooling ecosystem of {norm_skill}.",
                "unit": "Weeks 1-2",
                "estimated_hours": 12,
                "is_completed": False,
                "learning_objectives": [
                    f"Understand the design paradigms and foundational runtime mechanics of {norm_skill}",
                    "Set up modern linting, debugging, and hot-reload development tooling",
                    "Implement clean, idiomatic code adhering to industry standards"
                ],
                "practical_exercises": [
                    {
                        "title": f"{norm_skill} Starter Lab: Baseline Tooling & Unit Tests",
                        "instructions": "Build a modular utility library implementing core algorithms and testing 100% of branch edge cases.",
                        "deliverable": "GitHub repository with automated GitHub Actions CI pipeline.",
                        "estimated_minutes": 150,
                    }
                ],
                "recommended_courses": db_courses[:2],
                "assessment": {
                    "title": f"{norm_skill} Foundations Milestone Quiz",
                    "type": "Objective Assessment & Syntax Debugging",
                    "pass_threshold": "80%",
                    "questions_count": 10,
                }
            }
        ]
        task_counter += 1

        p1_tasks.append({
            "id": f"task-{task_counter}",
            "title": f"Data Structures, Lifecycle & State Management in {norm_skill}",
            "description": f"Deep dive into state orchestration, async patterns, and error handling in {norm_skill}.",
            "unit": "Weeks 3-4",
            "estimated_hours": 15,
            "is_completed": False,
            "learning_objectives": [
                "Master unidirectional data flow and deterministic state mutations",
                "Structure modular components or micro-services with loose coupling",
                "Handle race conditions, timeouts, and network failure backoff gracefully"
            ],
            "practical_exercises": [
                {
                    "title": f"State Engine & Persistent Cache in {norm_skill}",
                    "instructions": "Implement a resilient caching layer with eviction policies (LRU/TTL) and integration tests.",
                    "deliverable": "Working code repository with benchmark throughput metrics.",
                    "estimated_minutes": 180,
                }
            ],
            "recommended_courses": db_courses[1:3] if len(db_courses) >= 3 else db_courses[:2],
            "assessment": {
                "title": f"{norm_skill} State Architecture Diagnostic",
                "type": "Code Review & Edge-Case Analysis",
                "pass_threshold": "75%",
                "questions_count": 8,
            }
        })
        task_counter += 1

        phases.append({
            "phase_id": 1,
            "title": "Phase 1: Foundations, Tooling & Core Architecture",
            "duration": "Weeks 1-4",
            "objective": f"Establish uncompromising baseline fluency in {norm_skill} idioms, patterns, and development environments.",
            "milestone": f"Clean development environment configured and 2 foundational projects passing CI test suites.",
            "tasks": p1_tasks,
        })
        milestones.append({
            "id": "ms-1",
            "title": f"Foundations & Tooling Mastery: {norm_skill}",
            "timeline": "Week 4 Checkpoint",
            "achieved": False,
        })

        # Phase 2: Advanced Applied Engineering
        p2_tasks = [
            {
                "id": f"task-{task_counter}",
                "title": f"Concurrency, Performance Optimization & Scale in {norm_skill}",
                "description": f"Profile execution bottlenecks, optimize memory footprint, and scale {norm_skill} applications.",
                "unit": "Weeks 5-6",
                "estimated_hours": 18,
                "is_completed": False,
                "learning_objectives": [
                    "Conduct flamegraph CPU and heap memory allocation profiling",
                    "Implement connection pooling, indexing, and asynchronous batching",
                    "Design for horizontal scale and zero-downtime rolling upgrades"
                ],
                "practical_exercises": [
                    {
                        "title": f"High-Throughput Performance Tuning Lab in {norm_skill}",
                        "instructions": "Simulate 5,000 concurrent requests; optimize p99 latency from >800ms down to <120ms.",
                        "deliverable": "Load testing report (k6 or Locust) with before/after latency charts.",
                        "estimated_minutes": 240,
                    }
                ],
                "recommended_courses": db_courses[2:4] if len(db_courses) >= 4 else db_courses[:2],
                "assessment": {
                    "title": f"{norm_skill} Concurrency & Performance Audit",
                    "type": "Scenario-Based Architecture Exam",
                    "pass_threshold": "80%",
                    "questions_count": 8,
                }
            }
        ]
        task_counter += 1

        p2_tasks.append({
            "id": f"task-{task_counter}",
            "title": f"Security Hardening, Observability & CI/CD for {norm_skill}",
            "description": f"Implement OWASP security defenses, structured logging, distributed tracing, and automated deployment.",
            "unit": "Weeks 7-8",
            "estimated_hours": 16,
            "is_completed": False,
            "learning_objectives": [
                "Protect against injection, token forgery, and privilege escalation vulnerabilities",
                "Configure OpenTelemetry tracing and Prometheus metrics monitoring",
                "Write Dockerfiles with multi-stage builds reducing container size by 60%+"
            ],
            "practical_exercises": [
                {
                    "title": f"Production Containerization & Security Pipeline",
                    "instructions": "Containerize the application, configure vulnerability scanning (Trivy), and write Kubernetes deployment manifests.",
                    "deliverable": "Hardened Dockerfile + GitHub Actions workflow with automated scanning.",
                    "estimated_minutes": 200,
                }
            ],
            "recommended_courses": db_courses[3:5] if len(db_courses) >= 5 else db_courses[:2],
            "assessment": {
                "title": f"{norm_skill} Production Readiness Assessment",
                "type": "Security & Architecture Review",
                "pass_threshold": "85%",
                "questions_count": 10,
            }
        })
        task_counter += 1

        phases.append({
            "phase_id": 2,
            "title": "Phase 2: Advanced Engineering, Performance & Production Readiness",
            "duration": "Weeks 5-8",
            "objective": f"Elevate skill level from intermediate coder to production-grade engineer capable of scaling {norm_skill}.",
            "milestone": f"Application load-tested under concurrent traffic with production observability and automated CI/CD.",
            "tasks": p2_tasks,
        })
        milestones.append({
            "id": "ms-2",
            "title": f"Production Readiness & Scale Certification: {norm_skill}",
            "timeline": "Week 8 Checkpoint",
            "achieved": False,
        })

        # Phase 3: Industry Capstone Project & Interview Defense
        p3_tasks = [
            {
                "id": f"task-{task_counter}",
                "title": f"Industry-Grade Capstone Architecture & Implementation in {norm_skill}",
                "description": f"Architect and deliver an authentic full-featured production system solving a non-trivial enterprise problem.",
                "unit": "Weeks 9-10",
                "estimated_hours": 25,
                "is_completed": False,
                "learning_objectives": [
                    "Design full system architecture using C4 model diagrams and ADRs (Architecture Decision Records)",
                    "Implement core domain logic with exhaustive test coverage (unit, integration, e2e)",
                    "Deploy to cloud infrastructure with SSL, domain configuration, and monitoring dashboards"
                ],
                "practical_exercises": [
                    {
                        "title": f"Full-Scale Portfolio Capstone Project in {norm_skill}",
                        "instructions": "Build and deploy an enterprise-grade platform featuring real-time capabilities, background worker queues, and third-party API webhooks.",
                        "deliverable": "Live production URL, complete GitHub repository with detailed documentation, and video demo.",
                        "estimated_minutes": 360,
                    }
                ],
                "recommended_courses": db_courses[4:6] if len(db_courses) >= 6 else db_courses[:2],
                "assessment": {
                    "title": f"{norm_skill} Capstone Final Defense & Code Audit",
                    "type": "Comprehensive Project Evaluation",
                    "pass_threshold": "90%",
                    "questions_count": 12,
                }
            }
        ]
        task_counter += 1

        phases.append({
            "phase_id": 3,
            "title": "Phase 3: Industry Capstone, Portfolio Proof & Technical Defense",
            "duration": f"Weeks 9-{duration_weeks}",
            "objective": f"Produce demonstrable, tamper-evident proof of competency in {norm_skill} suitable for Senior / Job-Ready evaluation.",
            "milestone": f"Live deployed capstone platform with public URL, technical documentation, and comprehensive test suite.",
            "tasks": p3_tasks,
        })
        milestones.append({
            "id": "ms-3",
            "title": f"Job-Ready Portfolio Capstone Defense: {norm_skill}",
            "timeline": f"Week {duration_weeks} Final Completion",
            "achieved": False,
        })

    # Summary description
    total_tasks_count = task_counter - 1
    total_study_hours = sum(t["estimated_hours"] for p in phases for t in p["tasks"])

    summary_text = (
        f"Personalized AI learning roadmap for mastering {norm_skill} "
        f"from {current_level} to {target_level}. "
        f"{'Generated in Accelerated Crash Mode due to tight deadline constraints.' if is_accelerated else 'Comprehensive phased curriculum calibrated for deep industry readiness.'} "
        f"Total structured effort: ~{total_study_hours} hours across {len(phases)} phases and {total_tasks_count} verifiable milestones."
    )

    return {
        "title": f"{norm_skill} Personalized Roadmap ({'Accelerated' if is_accelerated else 'Job-Ready'})",
        "description": summary_text,
        "skill_name": norm_skill,
        "current_level": current_level,
        "target_level": target_level,
        "desired_deadline": deadline_str,
        "estimated_duration": duration_desc,
        "hours_per_week": hours_per_week,
        "status": "In Progress",
        "is_accelerated": is_accelerated,
        "deadline_validation": validation,
        "total_tasks_count": total_tasks_count,
        "total_study_hours": total_study_hours,
        "phases": phases,
        "milestones": milestones,
        "matched_courses": db_courses,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

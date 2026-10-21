# GrowSphere — Evidence-Based Career Growth Platform

GrowSphere (historically referenced as LearnUP and SkillOrbit) is an evidence-based career growth platform connecting labor market skill requirements to demonstrated learner competencies. By continuously evaluating real-world market signals, assessing practical learner proficiency, and generating dependency-ordered roadmaps, GrowSphere bridges the gap between passive course completion and verified career readiness.

---

## 1. The Core GrowSphere Product Loop

```mermaid
graph TD
    A[Market Evidence Analysis] --> B[Target Career Role & Skill Requirements]
    B --> C[Learner Profile & Evidence Baseline]
    C --> D[Skill Gap Analysis & Readiness Scoring]
    D --> E[Dependency-Ordered Learning Roadmap]
    E --> F[Curated Course Recommendations]
    F --> G[Practical Assessment & Quiz Verification]
    G --> H[Verified SkillEvidence Credentialing]
    H --> I[Updated Market Match & Opportunity Pipeline]
    I --> A
```

1. **Market Evidence:** Ingestion and auditing of job postings, internships, and hackathons.
2. **Confirmed Skill Profile:** Self-reported or resume-extracted candidate skills requiring explicit learner confirmation.
3. **Skill Gap Analysis:** Mathematical readiness scoring against target role benchmarks (e.g., Data Analyst).
4. **Adaptive Roadmap:** Topological sorting enforcing prerequisite mastery before subsequent modules unlock.
5. **Practical Assessment:** Rubric-backed multi-attempt evaluations granting verified evidence upon reaching threshold ($\ge 70\%$).
6. **New Evidence:** Verified competencies update readiness scores, unlocking advanced opportunities and roadmap nodes.

---

## 2. User Roles & Access Architecture

GrowSphere enforces server-side Role-Based Access Control (RBAC) across five roles:

| Role | Scope | Key Capabilities & Restrictions |
|---|---|---|
| **Student** | External Learner | Target role selection, gap analysis, sequential roadmaps, interactive assessments, resume extraction, free-first course discovery, opportunity match. |
| **Employee** | External Upskilling | Career transition roadmaps, confidential target goal tracking (**`career_goal` is strictly private and never exposed to employers**). |
| **Course Seller** | External Provider | Course authoring, syllabus management, student enrollment tracking, earnings dashboard. |
| **Mentor** | External Advisor | 1-on-1 session availability scheduling, hourly rate management, mentorship booking oversight. |
| **Admin** | Internal Operations | Full governance access to the **Data Usage Register**, audit logging, pipeline reconciliation, and system health. |

*(Note: College and Employer dashboards belong to later expansion phases and are not part of Phase 1 launch scope).*

---

## 3. Technology Stack

- **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2, PassLib (BCrypt), PyJWT.
- **Frontend:** React 19, Vite 8, Lucide React, Modern CSS Design System (Glassmorphism, CSS Custom Properties).
- **Machine Learning & Pipeline:** scikit-learn, pandas, numpy, openpyxl, python-docx, PyPDF2.
- **Database:**
  - **Development:** Local SQLite (`backend/growsphere_dev.db`).
  - **Production:** PostgreSQL (configured via `POSTGRES_SERVER`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`).

---

## 4. Getting Started & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### Backend Setup
1. Open a terminal in `D:\GrowSphere\backend`:
   ```bash
   cd D:\GrowSphere\backend
   ```
2. Create and activate a virtual environment (optional if using Anaconda/global Python):
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations / seed script:
   ```bash
   python -m app.data_pipeline.ingest_all
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   API interactive documentation will be accessible at: `http://localhost:8000/docs`

### Frontend Setup
1. Open a terminal in `D:\GrowSphere\frontend`:
   ```bash
   cd D:\GrowSphere\frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be running at: `http://localhost:5173`
4. Build for production:
   ```bash
   npm run build
   ```

---

## 5. Database Configuration: PostgreSQL vs. SQLite

By default, GrowSphere runs with SQLite for frictionless local development. For production environments, set PostgreSQL environment variables:

```bash
# Production PostgreSQL Configuration
DATABASE_URL=postgresql://growsphere_admin:SecurePassword123@localhost:5432/growsphere_prod
# Alternatively, individual credentials:
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=growsphere_admin
POSTGRES_PASSWORD=SecurePassword123
POSTGRES_DB=growsphere_prod
```

When PostgreSQL connection parameters are provided, the SQLAlchemy engine automatically configures connection pooling (`pool_pre_ping=True`, `pool_size=10`, `max_overflow=20`).

---

## 6. Seed Credentials (Development & QA)

All pre-seeded demo accounts share the password: `password123`

- **Student:** `student@growsphere.dev`
- **Employee:** `employee@growsphere.dev`
- **Mentor:** `mentor@growsphere.dev`
- **Course Seller:** `seller@growsphere.dev`
- **Admin:** `admin@growsphere.dev`

---

## 7. Data Inventory & Reconciliation Summary

Every single file in the physical inventory (28 physical directory entries / 26 unique SHA-256 hashes) is completely accounted for and categorized under mutually exclusive row dispositions:

$$\text{Raw Rows} = \text{Within-File Exact Dupes} + \text{Unique Source Rows}$$
$$\text{Unique Source Rows} = \text{Canonical Insert} + \text{Cross-Source Linked} + \text{Excluded} + \text{Out of Scope} + \text{Source Only}$$

| Category | Count | Key Evidence & Disposition Rationale |
|---|---|---|
| **Physical Directory Entries** | **28** | 100% verified present in `_raw_data/` (26 prompt paths + extracted `Naukri Jobs Data.csv` + ASCII hyphen variant `LearnUP - Complete USP Document.pdf`). |
| **Unique Content Hashes** | **26** | Confirmed: (1) `codex-clipboard-fe40120d...jpg` is identical to `codex-clipboard-feb48df2...jpg` (`6e9e91a7...`); (2) `LearnUP - Complete USP Document.pdf` is identical to `LearnUP – Complete USP Document.pdf` (`017e3fd8...`). |
| **Naukri Postings** | 32,738 raw $\rightarrow$ 27,985 unique | 4,753 exact duplicates removed. 706 canonical Data Analyst postings; 17 near-duplicate DA postings linked; 27,262 remaining unique rows retained under `out_of_scope_retained` for future role models ($706 + 17 + 27,262 = 27,985$). |
| **Scraped Jobs Feed** | 30,072 raw $\rightarrow$ 1,613 unique | 28,459 within-file exact duplicates removed. 1,073 canonical unique URLs + 540 duplicate URL rows linked ($1,073 + 540 = 1,613$). |
| **Cleaned Jobs Feed** | 10,000 raw $\rightarrow$ 502 unique | 9,498 exact duplicates removed. 100% of its 500 unique URLs match scraped jobs; all 502 rows linked ($0 \text{ canonical} + 502 \text{ linked} = 502$). |
| **Scraped Internships Feed** | 19,536 raw $\rightarrow$ 1,192 unique | 18,344 within-file exact duplicates removed. 691 canonical unique URLs + 501 duplicate URL rows linked ($691 + 501 = 1,192$). |
| **Cleaned Internships Feed** | 19,536 raw $\rightarrow$ 1,202 unique | 18,334 within-file exact duplicates removed. 100% of its 691 unique URLs match scraped internships; all 1,202 rows linked ($0 \text{ canonical} + 1,202 \text{ linked} = 1,202$). |
| **Scraped Hackathons Feed** | 4,445 raw $\rightarrow$ 1,085 unique | 3,360 within-file exact duplicates removed. 586 canonical unique URLs + 499 duplicate URL rows linked ($586 + 499 = 1,085$). |
| **Cleaned Hackathons Feed** | 4,445 raw $\rightarrow$ 1,085 unique | 3,360 within-file exact duplicates removed. 100% of URLs match scraped hackathons; all 1,085 rows linked. Neutralized 2099 deadlines back to null/unknown. |
| **MOOC Courses Feed** | 3,785 raw $\rightarrow$ 3,687 unique | 98 exact duplicates removed. 3,687 canonical courses ($3,687 + 0 = 3,687$). |
| **EdX Courses Feed** | 975 raw $\rightarrow$ 974 unique | 1 exact duplicate removed. 974 canonical courses ($974 + 0 = 974$). |
| **Coursera Courses Feed** | 891 raw $\rightarrow$ 891 unique | 0 exact duplicates. 888 canonical courses + 3 linked duplicate variants ($888 + 3 = 891$). |
| **AICTE Internships** | 2,237 raw $\rightarrow$ 2,237 unique | 0 exact duplicates. 2,237 canonical internship records ($2,237 + 0 = 2,237$). |
| **LearnUP Opportunities** | 200 raw $\rightarrow$ 200 unique | 0 exact duplicates. 200 verified opportunities ($200 + 0 = 200$). |
| **NPTEL July-Dec 2026** | 1,054 raw $\rightarrow$ 1,054 unique | 0 exact duplicates among 1,054 course data rows (1,065 sheet rows total). All 1,054 courses ended before 2026-10-21. State: `historical`. |
| **Student Placement Dataset** | 25,000 raw $\rightarrow$ 25,000 unique | **Quarantined (`source_only`).** Massive target leakage (`offer_count == 0` strictly when unplaced) and 98.4% placed class imbalance. |
| **AI Jobs Market 2025-2026** | 1,500 raw $\rightarrow$ 1,500 unique | **Illustrative Unverified (`source_only`).** Unverified synthetic salary data; segregated for UI exploratory charts with demo badge. |
| **Cleaned Dataset** | 100,000 raw $\rightarrow$ 100,000 unique | **Synthetic Demo (`source_only`).** 100,000 synthetic permutations across 5 platforms used for UI load testing and pagination. |

Full documentation: [DATA_USAGE_REGISTER.md](file:///D:/GrowSphere/DATA_USAGE_REGISTER.md)  
Machine-readable manifest: [DATA_MANIFEST_AND_RECONCILIATION.json](file:///D:/GrowSphere/DATA_MANIFEST_AND_RECONCILIATION.json)

---

## 8. Machine Learning Audit: Naukri Data Analyst Model

- **Task Framing:** Title/short-text-to-expected-skills (100% of raw Naukri job descriptions are truncated to $\le 90$ characters).
- **Dataset Slice:** 706 distinct postings deduplicated on `(job_post, company, required_skills)`.
- **Evaluation Split:** Grouped company split (372 train companies / 94 test companies, 0 overlap; 580 train postings / 126 test postings, sum = 706 postings).
- **Feature Separation:** `required_skills` strictly excluded from input features.

### Reproducible Metrics
| Model | Micro Precision | Micro Recall | Micro F1 | Macro Precision | Macro Recall | Macro F1 |
|---|---|---|---|---|---|---|
| **Deterministic Baseline (Exact Phrase)** | **0.380** (19/50) | 0.092 (19/207) | 0.148 | **0.356** | 0.092 | 0.133 |
| **TF-IDF + One-vs-Rest Logistic Regression** | **0.251** (50/199) | **0.242** (50/207) | **0.246** | 0.182 | **0.171** | **0.173** |

### Key Audit Findings & Safeguards
1. **Resolution of Precision Conflict:** The previously cited "100% precision" refers exclusively to the internal lexical match fidelity of exact phrase detection against text spans. When evaluated against employer-tagged silver tags, baseline precision is 0.380 due to employer omissions and brief job titles.
2. **Experimental Designation:** Because training support is small (706 samples) and text is truncated, the ML model is classified as **experimental**. The deterministic baseline is served as the primary extractor.
3. **Mandatory Confirmation Safeguard:** Model predictions are served as candidate suggestions with evidence spans (`POST /api/profiles/resume/extract`). Extracted skills **never enter learner profiles without explicit user confirmation** (`POST /api/profiles/resume/confirm-skills`).

Full ML audit report: [NAUKRI_ML_EXPERIMENT.md](file:///D:/GrowSphere/NAUKRI_ML_EXPERIMENT.md)

---

## 9. Verification & Test Suites (31/31 Passed)

Run the comprehensive test suites:
```bash
cd D:\GrowSphere\backend
python -m pytest -v
```

**Results (31/31 Passed across 3 test suites in ~11s):**

1. **`tests/test_api.py` (9/9 Passed):**
   - Root & database health endpoints
   - Data register RBAC (403 for Student, 200 for Admin)
   - Auth login & token verification
   - Skill taxonomy & career role benchmark definitions
   - Student skill gap analysis & topological roadmap generation
   - Assessment submission & `SkillEvidence` creation
   - Resume extraction & candidate confirmation flow
   - Free-first course recommendations & opportunity matching
   - Student dashboard aggregation

2. **`tests/test_auth_and_access_control.py` (6/6 Passed):**
   - Prohibition of public admin registration (`HTTP 403 Forbidden`)
   - Permitted registration for Student, Employee, Seller, and Mentor roles
   - End-to-end password recovery & reset lifecycle
   - Email verification token dispatch and confirmation
   - Strict RBAC denial on Admin endpoints for non-admin roles
   - Admin console access permitted strictly for verified Admins

3. **`tests/test_full_platform.py` (16/16 Passed):**
   - TRAC-01: Auth & role-specific onboarding
   - TRAC-02: Privacy controls & GDPR data export/account deletion
   - TRAC-03: 5-tier evidence card & revocable Skill Passport
   - TRAC-04: Dated market evidence freshness & uncertainty
   - TRAC-05: Employee goal modes (`promotion`, `reskilling`, `career_switch`) & transferable skills
   - TRAC-06: Fact-based ATS resume extraction without invented credentials
   - TRAC-07: Diagnostic assessment gating & retry variants
   - TRAC-08: AI mock interview studio & practice decks
   - TRAC-09: Skill Passport revocation enforcement (`HTTP 403`)
   - TRAC-10: Course seller lifecycle & 85/15 revenue split
   - TRAC-11: Mentorship availability, conflict prevention & 0.95 endorsements
   - TRAC-12: Opportunity matching & application tracker
   - TRAC-13: Idempotent payment & credit ledger
   - TRAC-14: Admin listing moderation & platform metrics
   - TRAC-15: Data governance & quarantined datasets
   - TRAC-16: Production configuration & health checks

---

## 10. Requirement Traceability Matrix (RTM)

The complete requirement traceability matrix mapping all capabilities to models, endpoints, components, and tests is documented in [REQUIREMENTS_TRACEABILITY_MATRIX.md](REQUIREMENTS_TRACEABILITY_MATRIX.md).

---

## 11. Production Build & Deployment

### Frontend Production Build (0 Errors)
```bash
cd D:\GrowSphere\frontend
npm run build
```
Produces an optimized, production-ready bundle in `frontend/dist/` with LinkedIn-inspired light/dark themes and responsive views for all user roles.

### Docker Deployment
```bash
docker compose up --build
```
Spins up the FastAPI application connected to a production PostgreSQL database with Alembic migrations applied automatically.

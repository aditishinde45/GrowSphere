"""
GrowSphere — Resume Parser & ATS Analysis Service.

Extracts text from PDF/DOCX uploads, organizes structured information,
and performs comprehensive ATS scoring with role-suitability assessment.
Never fabricates credentials, metrics, or work experience.
"""

import re
import io
from typing import Dict, Any, List, Optional, Tuple


# ─── Text Extraction ──────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file using pdfplumber."""
    import pdfplumber
    text_parts = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as e:
        raise ValueError(f"Could not read PDF file: {str(e)}")
    
    if not text_parts:
        raise ValueError(
            "No readable text found in this PDF. It may be a scanned image. "
            "Please upload a text-based PDF or DOCX file."
        )
    return "\n\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract all text from a DOCX file using python-docx."""
    from docx import Document
    try:
        doc = Document(io.BytesIO(file_bytes))
        text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
    except Exception as e:
        raise ValueError(f"Could not read DOCX file: {str(e)}")
    
    if not text_parts:
        raise ValueError("No readable text found in this DOCX file.")
    return "\n".join(text_parts)


def extract_resume_text(file_bytes: bytes, filename: str) -> str:
    """Route file to the correct parser based on extension."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}. Please upload a PDF or DOCX file.")


# ─── Section Extraction ───────────────────────────────────────────────

SECTION_PATTERNS = {
    "contact": r"(?:contact|email|phone|address|linkedin|github|portfolio)",
    "summary": r"(?:summary|objective|profile|about\s*me|professional\s*summary|career\s*objective)",
    "education": r"(?:education|academic|qualification|degree|university|college)",
    "experience": r"(?:experience|work\s*experience|employment|professional\s*experience|work\s*history)",
    "skills": r"(?:skills|technical\s*skills|core\s*competencies|technologies|tools|proficiencies)",
    "projects": r"(?:projects|personal\s*projects|academic\s*projects|key\s*projects)",
    "certifications": r"(?:certifications?|certificates?|accreditations?|licenses?)",
    "achievements": r"(?:achievements?|accomplishments?|awards?|honors?|recognition)",
    "internships": r"(?:internships?|training|industrial\s*training)",
    "publications": r"(?:publications?|papers?|research)",
    "languages": r"(?:languages?|linguistic)",
    "hobbies": r"(?:hobbies|interests|extracurricular)",
}

def detect_sections(text: str) -> Dict[str, bool]:
    """Detect which standard resume sections are present."""
    text_lower = text.lower()
    return {
        section: bool(re.search(pattern, text_lower))
        for section, pattern in SECTION_PATTERNS.items()
    }


# ─── Contact Extraction ───────────────────────────────────────────────

def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    """Extract name, email, phone, LinkedIn, GitHub from resume text."""
    lines = text.strip().split("\n")
    
    # Email
    email_match = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    email = email_match.group(0) if email_match else None
    
    # Phone
    phone_match = re.search(r"(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}", text)
    phone = phone_match.group(0).strip() if phone_match else None
    
    # LinkedIn
    linkedin_match = re.search(r"(?:linkedin\.com/in/|linkedin:\s*)([a-zA-Z0-9\-_/]+)", text, re.I)
    linkedin = linkedin_match.group(0) if linkedin_match else None
    
    # GitHub
    github_match = re.search(r"(?:github\.com/|github:\s*)([a-zA-Z0-9\-_]+)", text, re.I)
    github = github_match.group(0) if github_match else None
    
    # Name: typically the first non-empty line
    name = None
    for line in lines[:5]:
        clean = line.strip()
        if clean and not re.search(r"@|http|linkedin|github|phone|\d{5,}", clean, re.I):
            if len(clean) < 60:
                name = clean
                break
    
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
    }


# ─── Skills Extraction ────────────────────────────────────────────────

TECH_SKILLS_DB = {
    # Programming Languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Dart", "Lua",
    # Web Frameworks
    "React", "Angular", "Vue.js", "Vue", "Next.js", "Node.js", "Express", "Django",
    "Flask", "FastAPI", "Spring Boot", "Spring", "ASP.NET", ".NET", "Rails",
    "Laravel", "Svelte", "Nuxt.js", "Gatsby",
    # Data & ML
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
    "DynamoDB", "Firebase", "Supabase", "SQLite",
    "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Keras",
    "OpenCV", "NLTK", "SpaCy", "Hugging Face", "LangChain",
    "Power BI", "Tableau", "Excel", "Data Visualization", "Data Analysis",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Data Engineering", "ETL", "Apache Spark", "Airflow", "Kafka",
    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform",
    "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI",
    "Linux", "Nginx", "Apache",
    # Tools
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence",
    "VS Code", "IntelliJ", "Postman", "Swagger",
    "Figma", "Adobe XD", "Photoshop",
    # APIs & Protocols
    "REST", "REST APIs", "GraphQL", "gRPC", "WebSocket", "OAuth",
    # Soft Skills
    "Leadership", "Communication", "Team Management", "Problem Solving",
    "Critical Thinking", "Agile", "Scrum", "Project Management",
}

def extract_skills(text: str) -> Tuple[List[str], List[str]]:
    """
    Extract technical and soft skills from resume text.
    Returns (technical_skills, soft_skills).
    """
    text_lower = text.lower()
    soft_keywords = {
        "leadership", "communication", "team management", "problem solving",
        "critical thinking", "agile", "scrum", "project management",
        "collaboration", "time management", "adaptability", "creativity",
    }
    
    found_tech = []
    found_soft = []
    
    for skill in TECH_SKILLS_DB:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            if skill.lower() in soft_keywords:
                found_soft.append(skill)
            else:
                found_tech.append(skill)
    
    return sorted(set(found_tech)), sorted(set(found_soft))


# ─── Role-Specific Keywords ───────────────────────────────────────────

ROLE_KEYWORDS = {
    "Software Developer": {
        "must_have": ["Python", "Java", "JavaScript", "Git", "SQL", "REST APIs", "Data Structures", "Algorithms", "OOP"],
        "good_to_have": ["Docker", "CI/CD", "AWS", "Microservices", "Unit Testing", "Agile", "Design Patterns", "System Design"],
        "domain": ["Backend", "Frontend", "Full-Stack", "API Development", "Database Design"],
    },
    "Full-Stack Developer": {
        "must_have": ["JavaScript", "React", "Node.js", "HTML", "CSS", "SQL", "REST APIs", "Git"],
        "good_to_have": ["TypeScript", "Next.js", "MongoDB", "Docker", "AWS", "GraphQL", "Redis", "CI/CD"],
        "domain": ["Frontend", "Backend", "Responsive Design", "Authentication", "Deployment"],
    },
    "Data Analyst": {
        "must_have": ["SQL", "Excel", "Python", "Data Visualization", "Statistics", "Data Analysis"],
        "good_to_have": ["Power BI", "Tableau", "Pandas", "R", "ETL", "A/B Testing", "Dashboards"],
        "domain": ["Business Intelligence", "Reporting", "Data Cleaning", "KPI Tracking"],
    },
    "AI/ML Engineer": {
        "must_have": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "SQL", "Statistics"],
        "good_to_have": ["NLP", "Computer Vision", "Scikit-learn", "Keras", "MLOps", "Docker", "AWS", "Data Engineering"],
        "domain": ["Model Training", "Feature Engineering", "Model Deployment", "Experimentation"],
    },
    "Data Scientist": {
        "must_have": ["Python", "SQL", "Machine Learning", "Statistics", "Pandas", "NumPy", "Data Visualization"],
        "good_to_have": ["Deep Learning", "NLP", "R", "Tableau", "Spark", "Hypothesis Testing", "A/B Testing"],
        "domain": ["Predictive Modeling", "Feature Engineering", "Statistical Analysis", "Research"],
    },
    "DevOps Engineer": {
        "must_have": ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Git", "Terraform"],
        "good_to_have": ["Jenkins", "Ansible", "Monitoring", "Python", "Bash", "Networking", "Security"],
        "domain": ["Infrastructure", "Automation", "Cloud Architecture", "Deployment Pipelines"],
    },
    "Frontend Developer": {
        "must_have": ["JavaScript", "React", "HTML", "CSS", "Git", "Responsive Design"],
        "good_to_have": ["TypeScript", "Next.js", "Vue.js", "Figma", "Tailwind CSS", "Testing", "Performance"],
        "domain": ["UI/UX", "Web Accessibility", "State Management", "Component Architecture"],
    },
    "Backend Developer": {
        "must_have": ["Python", "SQL", "REST APIs", "Git", "Database Design"],
        "good_to_have": ["Java", "Node.js", "Docker", "Redis", "Microservices", "AWS", "Message Queues"],
        "domain": ["API Design", "Authentication", "Scalability", "Database Optimization"],
    },
    "Cybersecurity Analyst": {
        "must_have": ["Networking", "Linux", "Security", "Firewalls", "SIEM", "Incident Response"],
        "good_to_have": ["Python", "Penetration Testing", "Cryptography", "Cloud Security", "SOC"],
        "domain": ["Threat Analysis", "Vulnerability Assessment", "Compliance", "Risk Management"],
    },
    "Product Manager": {
        "must_have": ["Product Strategy", "Agile", "User Research", "Roadmapping", "Stakeholder Management"],
        "good_to_have": ["SQL", "A/B Testing", "Jira", "Wireframing", "Data Analysis", "KPI Tracking"],
        "domain": ["Product Lifecycle", "Market Analysis", "Feature Prioritization", "Go-to-Market"],
    },
    "UI/UX Designer": {
        "must_have": ["Figma", "User Research", "Wireframing", "Prototyping", "Design Thinking"],
        "good_to_have": ["Adobe XD", "HTML", "CSS", "Usability Testing", "Design Systems"],
        "domain": ["Visual Design", "Interaction Design", "Accessibility", "User Flows"],
    },
}

# Default generic keywords for unlisted roles
DEFAULT_ROLE_KEYWORDS = {
    "must_have": ["Communication", "Problem Solving", "Team Management", "Technical Skills"],
    "good_to_have": ["Leadership", "Agile", "Project Management", "Data Analysis"],
    "domain": ["Industry Knowledge", "Cross-functional Collaboration"],
}


def get_role_keywords(role_title: str) -> Dict[str, List[str]]:
    """Get role-specific keywords, falling back to defaults for unknown roles."""
    # Try exact match first, then partial match
    if role_title in ROLE_KEYWORDS:
        return ROLE_KEYWORDS[role_title]
    
    for key in ROLE_KEYWORDS:
        if key.lower() in role_title.lower() or role_title.lower() in key.lower():
            return ROLE_KEYWORDS[key]
    
    return DEFAULT_ROLE_KEYWORDS


# ─── ATS Scoring Engine ───────────────────────────────────────────────

ACTION_VERBS = [
    "achieved", "administered", "analyzed", "architected", "automated",
    "built", "collaborated", "configured", "created", "delivered",
    "deployed", "designed", "developed", "drove", "engineered",
    "established", "evaluated", "executed", "generated", "implemented",
    "improved", "increased", "integrated", "launched", "led",
    "managed", "mentored", "migrated", "optimized", "orchestrated",
    "pioneered", "published", "redesigned", "reduced", "refactored",
    "resolved", "scaled", "spearheaded", "streamlined", "supervised",
    "tested", "trained", "transformed", "upgraded",
]


def compute_ats_analysis(
    resume_text: str,
    target_role: str,
) -> Dict[str, Any]:
    """
    Perform comprehensive ATS analysis with category-wise scoring.
    
    Categories (each scored 0-100):
    1. Keyword Relevance (20%)
    2. Technical Skills Coverage (15%)
    3. Experience & Project Relevance (15%)
    4. Education & Certifications (10%)
    5. Measurable Achievements (10%)
    6. Action Verbs & Language (10%)
    7. Section Organization & Formatting (10%)
    8. Clarity & Readability (10%)
    """
    text_lower = resume_text.lower()
    words = re.findall(r"\b\w+\b", resume_text)
    word_count = len(words)
    sentences = re.split(r"[.!?]+", resume_text)
    sentence_count = len([s for s in sentences if s.strip()])
    
    sections = detect_sections(resume_text)
    contact = extract_contact_info(resume_text)
    tech_skills, soft_skills = extract_skills(resume_text)
    role_kw = get_role_keywords(target_role)
    
    # ─── 1. Keyword Relevance (20%) ───
    must_have = role_kw.get("must_have", [])
    good_to_have = role_kw.get("good_to_have", [])
    domain_kw = role_kw.get("domain", [])
    
    all_role_kw = must_have + good_to_have + domain_kw
    matched_keywords = []
    missing_keywords = []
    
    for kw in all_role_kw:
        if re.search(r'\b' + re.escape(kw.lower()) + r'\b', text_lower):
            matched_keywords.append(kw)
        else:
            missing_keywords.append(kw)
    
    must_have_matched = [kw for kw in must_have if kw in matched_keywords]
    must_have_missing = [kw for kw in must_have if kw in missing_keywords]
    
    keyword_coverage = len(matched_keywords) / max(len(all_role_kw), 1)
    must_have_coverage = len(must_have_matched) / max(len(must_have), 1)
    keyword_score = int(keyword_coverage * 60 + must_have_coverage * 40)
    
    # ─── 2. Technical Skills Coverage (15%) ───
    skill_count = len(tech_skills) + len(soft_skills)
    skills_score = min(int((skill_count / 12) * 100), 100)
    
    # ─── 3. Experience & Project Relevance (15%) ───
    has_experience = sections.get("experience", False)
    has_projects = sections.get("projects", False)
    has_internships = sections.get("internships", False)
    
    exp_score = 40  # base
    if has_experience: exp_score += 30
    if has_projects: exp_score += 20
    if has_internships: exp_score += 10
    
    # Check for quantified experience
    exp_quantified = len(re.findall(r"\b\d+\+?\s*(?:years?|months?|yrs?)\b", text_lower))
    if exp_quantified > 0: exp_score = min(exp_score + 10, 100)
    
    # ─── 4. Education & Certifications (10%) ───
    has_education = sections.get("education", False)
    has_certs = sections.get("certifications", False)
    
    edu_score = 30  # base
    if has_education: edu_score += 40
    if has_certs: edu_score += 20
    
    # Check for degree mentions
    degree_patterns = r"\b(b\.?tech|b\.?e|b\.?sc|m\.?tech|m\.?s|m\.?sc|mba|ph\.?d|bachelor|master|diploma)\b"
    if re.search(degree_patterns, text_lower):
        edu_score = min(edu_score + 10, 100)
    
    # ─── 5. Measurable Achievements (10%) ───
    metrics_patterns = [
        r"\d+\s*%", r"\$\s*\d+", r"\d+[kKmM]\+?",
        r"\b\d+\s*(?:users?|customers?|clients?)\b",
        r"\breduced?\b.*\b\d+", r"\bimproved?\b.*\b\d+",
        r"\bincreased?\b.*\b\d+", r"\b\d+x\b",
    ]
    metrics_count = sum(1 for p in metrics_patterns if re.search(p, resume_text, re.I))
    achievements_score = min(int((metrics_count / 5) * 100), 100)
    
    # ─── 6. Action Verbs & Language (10%) ───
    found_action_verbs = [v for v in ACTION_VERBS if re.search(r'\b' + v + r'\b', text_lower)]
    action_verb_score = min(int((len(found_action_verbs) / 8) * 100), 100)
    
    # Check for weak/passive language
    weak_patterns = [
        r"\b(responsible\s+for|duties\s+included|helped\s+with|assisted\s+in)\b",
        r"\b(was\s+tasked|participated\s+in)\b",
    ]
    weak_count = sum(1 for p in weak_patterns if re.search(p, text_lower))
    if weak_count > 0:
        action_verb_score = max(action_verb_score - (weak_count * 10), 20)
    
    # ─── 7. Section Organization & Formatting (10%) ───
    expected_sections = ["contact", "summary", "education", "skills", "experience", "projects"]
    present_sections = [s for s in expected_sections if sections.get(s)]
    missing_sections = [s for s in expected_sections if not sections.get(s)]
    
    format_score = int((len(present_sections) / len(expected_sections)) * 80)
    
    # Penalize if too short or too long
    if word_count < 150:
        format_score = max(format_score - 20, 10)
    elif word_count > 1200:
        format_score = max(format_score - 10, 30)
    else:
        format_score = min(format_score + 20, 100)
    
    # ─── 8. Clarity & Readability (10%) ───
    avg_sentence_len = word_count / max(sentence_count, 1)
    readability_score = 70  # base
    
    if 10 <= avg_sentence_len <= 25:
        readability_score = 90
    elif avg_sentence_len > 40:
        readability_score = 50
    
    # Check for spelling red flags (common resume typos)
    typos = re.findall(r"\b(teh|recieved|acheived|managment|developement|expereince)\b", text_lower)
    readability_score = max(readability_score - (len(typos) * 10), 20)
    
    # ─── Overall ATS Score ───
    category_scores = {
        "keyword_relevance": {"score": keyword_score, "weight": 20, "label": "Keyword Relevance"},
        "technical_skills": {"score": skills_score, "weight": 15, "label": "Technical Skills Coverage"},
        "experience_projects": {"score": exp_score, "weight": 15, "label": "Experience & Projects"},
        "education_certs": {"score": edu_score, "weight": 10, "label": "Education & Certifications"},
        "achievements": {"score": achievements_score, "weight": 10, "label": "Measurable Achievements"},
        "action_verbs": {"score": action_verb_score, "weight": 10, "label": "Action Verbs & Language"},
        "formatting": {"score": format_score, "weight": 10, "label": "Section Organization"},
        "readability": {"score": readability_score, "weight": 10, "label": "Clarity & Readability"},
    }
    
    weighted_total = sum(
        cat["score"] * cat["weight"] for cat in category_scores.values()
    )
    ats_score = round(weighted_total / 100)
    
    # ─── Role Suitability ───
    role_suitability = round(
        must_have_coverage * 50 +
        keyword_coverage * 30 +
        (skills_score / 100) * 20
    )
    
    # ─── Strengths & Weaknesses ───
    strengths = []
    weaknesses = []
    
    if keyword_score >= 70:
        strengths.append("Strong keyword alignment with the target role.")
    else:
        weaknesses.append("Resume lacks several critical keywords for this role.")
    
    if skills_score >= 70:
        strengths.append(f"Good technical skills coverage ({skill_count} relevant skills detected).")
    else:
        weaknesses.append("Limited technical skills demonstrated. Consider adding more role-relevant technologies.")
    
    if achievements_score >= 60:
        strengths.append("Effective use of quantifiable metrics and measurable achievements.")
    else:
        weaknesses.append("Lacks quantifiable achievements. Add metrics like percentages, dollar amounts, or scale numbers.")
    
    if action_verb_score >= 70:
        strengths.append("Strong use of action verbs to describe accomplishments.")
    else:
        weaknesses.append("Weak or passive language detected. Replace 'responsible for' with action verbs like 'built', 'led', 'optimized'.")
    
    if format_score >= 70:
        strengths.append("Well-organized resume with clear section structure.")
    else:
        weaknesses.append(f"Missing important sections: {', '.join(s.title() for s in missing_sections[:3])}.")
    
    if has_experience or has_projects:
        strengths.append("Includes practical experience or project work.")
    else:
        weaknesses.append("No work experience or projects section detected.")
    
    # ─── Suggestions ───
    suggestions = []
    
    if must_have_missing:
        suggestions.append({
            "priority": "high",
            "category": "Keywords",
            "text": f"Add these critical keywords for {target_role}: {', '.join(must_have_missing[:5])}.",
            "detail": "These are commonly scanned by ATS systems for this role.",
        })
    
    if not sections.get("summary"):
        suggestions.append({
            "priority": "high",
            "category": "Structure",
            "text": "Add a Professional Summary section at the top of your resume.",
            "detail": "A 2-3 sentence summary highlighting your experience, key skills, and career goal significantly improves ATS matching.",
        })
    
    if achievements_score < 50:
        suggestions.append({
            "priority": "high",
            "category": "Impact",
            "text": "Add measurable achievements with numbers and percentages.",
            "detail": "Example: 'Reduced API response time by 40%' or 'Managed a team of 5 developers'. Quantified results are highly valued.",
        })
    
    if action_verb_score < 60:
        suggestions.append({
            "priority": "medium",
            "category": "Language",
            "text": "Use stronger action verbs to start bullet points.",
            "detail": f"Consider: {', '.join(ACTION_VERBS[:8])}. Avoid 'responsible for' or 'helped with'.",
        })
    
    if not contact.get("linkedin"):
        suggestions.append({
            "priority": "medium",
            "category": "Contact",
            "text": "Add your LinkedIn profile URL.",
            "detail": "Recruiters frequently check LinkedIn profiles for additional context.",
        })
    
    if not contact.get("github") and target_role in [
        "Software Developer", "Full-Stack Developer", "Frontend Developer",
        "Backend Developer", "AI/ML Engineer", "Data Scientist",
    ]:
        suggestions.append({
            "priority": "medium",
            "category": "Contact",
            "text": "Add your GitHub profile link for technical roles.",
            "detail": "A GitHub with active contributions demonstrates practical coding ability.",
        })
    
    if word_count < 200:
        suggestions.append({
            "priority": "high",
            "category": "Content",
            "text": "Resume is too short. Add more detail about your experience, projects, and skills.",
            "detail": f"Current word count: {word_count}. Aim for 400-800 words for an effective one-page resume.",
        })
    elif word_count > 1000:
        suggestions.append({
            "priority": "low",
            "category": "Length",
            "text": "Consider condensing your resume to focus on the most relevant information.",
            "detail": f"Current word count: {word_count}. For most candidates, a focused 1-page resume performs better with ATS.",
        })
    
    # Bullet point rewrite suggestions
    bullet_rewrites = []
    weak_bullets = re.findall(r"(?:responsible\s+for|duties\s+included|helped\s+with|assisted\s+in)[^.!?\n]+[.!?\n]", resume_text, re.I)
    for bullet in weak_bullets[:3]:
        bullet_clean = bullet.strip()
        bullet_rewrites.append({
            "original": bullet_clean,
            "suggestion": f"Rewrite using an action verb. For example, replace 'Responsible for managing...' with 'Managed and optimized...' to demonstrate ownership and impact.",
            "note": "Please provide the actual metrics/results to make this bullet point stronger.",
        })
    
    return {
        "ats_score": ats_score,
        "role_suitability": role_suitability,
        "target_role": target_role,
        "word_count": word_count,
        "category_scores": category_scores,
        "contact_info": contact,
        "sections_detected": sections,
        "missing_sections": missing_sections,
        "technical_skills": tech_skills,
        "soft_skills": soft_skills,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "must_have_matched": must_have_matched,
        "must_have_missing": must_have_missing,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "bullet_rewrites": bullet_rewrites,
        "action_verbs_found": found_action_verbs,
        "scoring_methodology": (
            "The ATS Readiness Score is calculated as a weighted average across 8 categories: "
            "Keyword Relevance (20%), Technical Skills (15%), Experience & Projects (15%), "
            "Education & Certifications (10%), Measurable Achievements (10%), Action Verbs (10%), "
            "Section Organization (10%), and Clarity & Readability (10%). "
            "Each category is scored 0-100 based on objective, pattern-based analysis of your resume content."
        ),
        "role_suitability_note": (
            f"The Role Suitability score ({role_suitability}%) estimates how closely your documented skills, "
            f"projects, and qualifications align with typical {target_role} job requirements. "
            "This is NOT a guarantee of passing any company's specific ATS or receiving an interview — "
            "it is a guideline to help you identify and close gaps."
        ),
        "factual_integrity_note": (
            "GrowSphere never fabricates credentials, metrics, or work experience. "
            "All scores are based solely on content found in your uploaded resume."
        ),
    }

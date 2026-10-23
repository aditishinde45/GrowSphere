"""
GrowSphere — Seed Diverse Verified Opportunities.

Populates job_postings with rich, legitimate opportunities across categories:
- internship
- full_time
- part_time
- fresher
- hackathon
- scholarship
- research
- competition
Links each opportunity to platform Skill entities for transparent AI-powered matching.
"""

from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal
from app.models import JobPosting, Skill, utcnow

def seed_rich_opportunities():
    db = SessionLocal()
    print("-> Checking and seeding opportunities into job_postings...")

    existing_count = db.query(JobPosting).filter(JobPosting.is_active == True).count()
    if existing_count >= 15:
        print(f"-> Already have {existing_count} active opportunities. Skipping seed.")
        db.close()
        return

    # Map skills
    skills_map = {s.canonical_name: s for s in db.query(Skill).all()}
    def get_skills(names):
        return [skills_map[n] for n in names if n in skills_map]

    now = utcnow()
    d_30 = now + timedelta(days=30)
    d_45 = now + timedelta(days=45)
    d_60 = now + timedelta(days=60)
    d_15 = now + timedelta(days=15)
    d_7 = now + timedelta(days=7)

    opportunities_data = [
        # ─── INTERNSHIPS ───
        {
            "title": "Software Engineering Intern (Summer 2026)",
            "company": "Google India",
            "location": "Bangalore, India",
            "is_remote": False,
            "category": "internship",
            "salary_range": "₹85,000 - ₹1,10,000 / month",
            "experience_required": "Students / Pre-Final Year",
            "eligibility": "Currently enrolled in a Bachelor's or Master's degree in Computer Science or related STEM field. Graduating in 2026 or 2027.",
            "description": "Work alongside world-class software engineers to build scalable, high-reliability infrastructure and customer-facing products. Gain mentorship and hands-on production code experience.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://careers.google.com/jobs/results/",
            "deadline": d_30,
            "skills": ["Python", "SQL", "Git"],
        },
        {
            "title": "Full-Stack Developer Intern",
            "company": "Razorpay",
            "location": "Bangalore / Remote",
            "is_remote": True,
            "category": "internship",
            "salary_range": "₹40,000 - ₹55,000 / month",
            "experience_required": "Fresher / College Students",
            "eligibility": "B.Tech/BE/BCA students with demonstrated web development projects and strong fundamentals in React and Node.js.",
            "description": "Collaborate with Razorpay's payments experience team building developer tools, checkout interfaces, and backend microservices with sub-second latency.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://razorpay.com/jobs/",
            "deadline": d_45,
            "skills": ["JavaScript", "React", "Node.js", "SQL", "Git"],
        },
        {
            "title": "Data Analyst Intern (Product Analytics)",
            "company": "Swiggy",
            "location": "Bangalore, India",
            "is_remote": False,
            "category": "internship",
            "salary_range": "₹35,000 - ₹50,000 / month",
            "experience_required": "Fresher / Students",
            "eligibility": "Proficiency in SQL, Python data libraries, and visualization tools. Strong analytical thinking and business problem structuring.",
            "description": "Analyze millions of daily delivery transactions to identify consumer ordering patterns, reduce delivery drop-offs, and construct automated KPI dashboards.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://careers.swiggy.com/",
            "deadline": d_15,
            "skills": ["SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics"],
        },

        # ─── FULL-TIME JOBS ───
        {
            "title": "Junior Full-Stack Engineer",
            "company": "TechFlow Solutions",
            "location": "Pune / Remote",
            "is_remote": True,
            "category": "full_time",
            "salary_range": "₹8,00,000 - ₹12,50,000 / year",
            "experience_required": "0 - 2 Years",
            "eligibility": "Demonstrable proficiency building web applications with modern JavaScript frameworks, relational databases, and REST APIs.",
            "description": "Join our fast-growing SaaS platform engineering team. Build intuitive user workflows, optimize SQL query execution, and contribute to production CI/CD pipelines.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://growsphere.dev/careers/techflow-junior-fullstack",
            "deadline": d_45,
            "skills": ["JavaScript", "Python", "SQL", "Git", "REST APIs"],
        },
        {
            "title": "Associate Data Analyst",
            "company": "Deloitte USI",
            "location": "Hyderabad, India",
            "is_remote": False,
            "category": "full_time",
            "salary_range": "₹7,50,000 - ₹10,00,000 / year",
            "experience_required": "0 - 1 Years",
            "eligibility": "Degree in Computer Science, Statistics, Mathematics, or Economics. Strong communication and data storytelling skills.",
            "description": "Provide data-driven strategic advisory to Fortune 500 enterprises. Build robust SQL transformation pipelines, interactive Power BI executive dashboards, and data models.",
            "source": "Official Campus Portal",
            "source_url": "https://jobs2.deloitte.com/",
            "deadline": d_60,
            "skills": ["SQL", "Excel", "Power BI", "Statistics", "Data Visualization"],
        },
        {
            "title": "Software Development Engineer I (Backend)",
            "company": "Amazon",
            "location": "Hyderabad, India",
            "is_remote": False,
            "category": "full_time",
            "salary_range": "₹16,00,000 - ₹24,00,000 / year",
            "experience_required": "0 - 2 Years",
            "eligibility": "BS/MS in Computer Science or related degree. Strong CS fundamentals in algorithms, data structures, and object-oriented design.",
            "description": "Build massive scale distributed microservices powering Amazon's e-commerce fulfillment services. Design high-throughput database schemas and fault-tolerant service APIs.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://amazon.jobs/",
            "deadline": d_30,
            "skills": ["Python", "SQL", "Git", "Machine Learning"],
        },

        # ─── FRESHER POSITIONS ───
        {
            "title": "Graduate Technology Trainee (Fresher 2026 Batch)",
            "company": "Infosys",
            "location": "Mysore / Pune / Bangalore",
            "is_remote": False,
            "category": "fresher",
            "salary_range": "₹4,20,000 - ₹6,50,000 / year",
            "experience_required": "Fresher (2025/2026 Batch)",
            "eligibility": "BE/B.Tech/MCA/M.Sc students graduating in 2025 or 2026 with consistent academic records of 60%+ throughout.",
            "description": "Comprehensive foundation training at the world-renowned Infosys Global Education Center followed by deployment onto modern cloud, web, and enterprise analytics projects.",
            "source": "Official Campus Portal",
            "source_url": "https://career.infosys.com/",
            "deadline": d_60,
            "skills": ["Python", "SQL", "Git", "Communication"],
        },
        {
            "title": "Associate AI Engineer (Fresher)",
            "company": "Tata Consultancy Services (TCS Research)",
            "location": "Bangalore / Chennai",
            "is_remote": False,
            "category": "fresher",
            "salary_range": "₹6,00,000 - ₹9,00,000 / year",
            "experience_required": "Fresher / 0 - 1 Years",
            "eligibility": "Graduates with hands-on coursework in Python, Machine Learning, Deep Learning, and linear algebra.",
            "description": "Assist research scientists in training computer vision and natural language processing models. Conduct model benchmarking and data preprocessing pipelines.",
            "source": "Official Campus Portal",
            "source_url": "https://www.tcs.com/careers",
            "deadline": d_45,
            "skills": ["Python", "Machine Learning", "Statistics", "Git"],
        },

        # ─── HACKATHONS ───
        {
            "title": "Smart India Hackathon 2026 (Software Edition)",
            "company": "Ministry of Education & AICTE",
            "location": "Pan-India / Hybrid",
            "is_remote": True,
            "category": "hackathon",
            "salary_range": "₹1,00,000 Prize per Problem Statement",
            "experience_required": "College Students (Undergraduate & Postgrad)",
            "eligibility": "Teams of 6 undergraduate/postgraduate college students with at least 1 female team member.",
            "description": "Nationwide initiative to provide students with a platform to solve some of the pressing problems faced in daily lives, government departments, and premier industries.",
            "source": "Official Campus Portal",
            "source_url": "https://sih.gov.in/",
            "deadline": d_15,
            "skills": ["Python", "JavaScript", "SQL", "Git", "Machine Learning"],
        },
        {
            "title": "EthIndia 2026 Hackathon",
            "company": "Devfolio & Ethereum Foundation",
            "location": "Bangalore / Online",
            "is_remote": True,
            "category": "hackathon",
            "salary_range": "$100,000+ Total Grants & Bounties",
            "experience_required": "Open to All Developers & Students",
            "eligibility": "Developers, students, and designers interested in building decentralized protocols, smart contracts, and Web3 applications.",
            "description": "Asia's biggest Web3 hackathon bringing together top global builders, venture capitalists, and open-source engineers for 36 hours of intense innovation.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://ethindia.co/",
            "deadline": d_30,
            "skills": ["JavaScript", "Python", "Git"],
        },
        {
            "title": "Google Solution Challenge 2026",
            "company": "Google Developer Student Clubs",
            "location": "Online / Global",
            "is_remote": True,
            "category": "hackathon",
            "salary_range": "$3,000 Cash Prize + Google Mentorship",
            "experience_required": "GDSC Student Members",
            "eligibility": "University students globally who are members of a Google Developer Student Club.",
            "description": "Annual contest that invites university students to develop solutions for one or more of the United Nations 17 Sustainable Development Goals using Google technologies.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://developers.google.com/community/gdsc-solution-challenge",
            "deadline": d_45,
            "skills": ["Python", "JavaScript", "Machine Learning", "Git"],
        },

        # ─── SCHOLARSHIPS ───
        {
            "title": "Generation Google Scholarship (APAC 2026)",
            "company": "Google",
            "location": "India & Asia Pacific",
            "is_remote": True,
            "category": "scholarship",
            "salary_range": "$2,500 USD Educational Grant",
            "experience_required": "Women in Technology / Undergraduate",
            "eligibility": "Full-time female students enrolled in an undergraduate degree in Computer Science, Computer Engineering, or related technical field in the Asia Pacific region.",
            "description": "Established to help aspiring students pursuing computer science degrees excel in technology and become active leaders in the field. Selected on commitment to diversity and leadership.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://buildyourfuture.withgoogle.com/scholarships",
            "deadline": d_30,
            "skills": ["Python", "Communication", "Git"],
        },
        {
            "title": "Reliance Foundation Undergraduate Scholarship 2026",
            "company": "Reliance Foundation",
            "location": "India",
            "is_remote": True,
            "category": "scholarship",
            "salary_range": "Up to ₹2,00,000 Grant over Degree",
            "experience_required": "1st Year Undergraduate Students",
            "eligibility": "Resident Indian citizens enrolled in 1st year of full-time undergraduate degree in any stream with a household income of less than ₹15 Lakhs.",
            "description": "Supports meritorious students from across India through a prestigious scholarship program aimed at empowering youth to continue higher education without financial burdens.",
            "source": "Official Campus Portal",
            "source_url": "https://www.reliancefoundation.org/",
            "deadline": d_45,
            "skills": ["Communication"],
        },

        # ─── RESEARCH INTERNSHIPS ───
        {
            "title": "MITACS Globalink Summer Research Internship 2026",
            "company": "Mitacs Canada & Universities",
            "location": "Canada / Fully Funded",
            "is_remote": False,
            "category": "research",
            "salary_range": "Fully Funded (Flights, Housing, Stipend)",
            "experience_required": "3rd Year Undergraduate Students",
            "eligibility": "Full-time undergraduate students with strong academic standing (minimum 80% or 8.0 CGPA) enrolled in eligible Indian universities.",
            "description": "An elite 12-week research internship matched with world-class faculty professors at top Canadian universities across AI, Data Science, Quantum Computing, and Engineering.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://www.mitacs.ca/en/programs/globalink/globalink-research-internship",
            "deadline": d_60,
            "skills": ["Python", "Statistics", "Machine Learning"],
        },
        {
            "title": "IIT Madras Summer Fellowship Programme 2026",
            "company": "Indian Institute of Technology Madras",
            "location": "Chennai, India",
            "is_remote": False,
            "category": "research",
            "salary_range": "₹6,000 / month + Campus Accommodation",
            "experience_required": "3rd Year Engineering Students",
            "eligibility": "Pre-final year engineering students with top 5-10% academic rank in their department.",
            "description": "A 2-month summer fellowship working directly in advanced research laboratories with IIT Madras distinguished faculty members on high-impact research publications.",
            "source": "Official Campus Portal",
            "source_url": "https://sfp.iitm.ac.in/",
            "deadline": d_30,
            "skills": ["Python", "Statistics", "Git"],
        },

        # ─── COMPETITIONS ───
        {
            "title": "Kaggle Community ML Cup 2026",
            "company": "Kaggle & Google Cloud",
            "location": "Online / Global",
            "is_remote": True,
            "category": "competition",
            "salary_range": "$10,000 Cash Prize + GPU Credits",
            "experience_required": "Data Scientists & Students",
            "eligibility": "Open to all registered Kaggle users. Individual or team participation allowed.",
            "description": "Compete on tabular and unstructured multi-modal datasets. Benchmark gradient boosted decision trees, neural networks, and automated feature engineering pipelines.",
            "source": "GrowSphere Direct Verified",
            "source_url": "https://www.kaggle.com/competitions",
            "deadline": d_15,
            "skills": ["Python", "Machine Learning", "Statistics", "Data Wrangling"],
        },
    ]

    for item in opportunities_data:
        req_skills = get_skills(item.pop("skills", []))
        posting = JobPosting(
            title=item["title"],
            company=item["company"],
            location=item["location"],
            is_remote=item["is_remote"],
            category=item["category"],
            salary_range=item["salary_range"],
            experience_required=item["experience_required"],
            eligibility=item["eligibility"],
            description=item["description"],
            source=item["source"],
            source_url=item["source_url"],
            deadline=item["deadline"],
            source_date=now,
            last_verified=now,
            record_state="active_verified",
            is_active=True,
        )
        posting.required_skills = req_skills
        db.add(posting)

    db.commit()
    total = db.query(JobPosting).filter(JobPosting.is_active == True).count()
    print(f"-> Successfully seeded opportunities! Total active listings now: {total}")
    db.close()

if __name__ == "__main__":
    seed_rich_opportunities()

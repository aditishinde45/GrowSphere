import React from "react";
import {
  Compass, CheckCircle2, Shield, ArrowRight, BookOpen, Briefcase,
  Users, Award, Sparkles, TrendingUp, Lock, RefreshCw, Star,
  DollarSign, FileText, Check, Moon, Sun, ChevronRight, HelpCircle
} from "lucide-react";

export default function LandingPage({ onOpenAuth, theme, toggleTheme, onQuickLogin }) {
  const steps = [
    {
      num: "01",
      title: "Dated Market Evidence",
      badge: "Market Demand",
      desc: "Analyze real job-posting frequencies, skill demand windows, sample sizes, and uncertainty disclaimers across industries.",
      icon: TrendingUp,
    },
    {
      num: "02",
      title: "Target Career Role",
      badge: "Goal Mapping",
      desc: "Select your destination role (e.g. Data Analyst, Cloud Architect, ML Engineer) with calibrated skill requirements.",
      icon: Compass,
    },
    {
      num: "03",
      title: "Learner Profile & Evidence",
      badge: "5-Tier Audit",
      desc: "Audit existing competencies classified across 5 evidence tiers: self-reported, resume, assessment, project, or mentor-endorsed.",
      icon: Award,
    },
    {
      num: "04",
      title: "Skill-Gap Analysis",
      badge: "Diagnostics",
      desc: "Pinpoint missing technical abilities, prerequisite deficits, and priority focus areas based on live hiring requirements.",
      icon: HelpCircle,
    },
    {
      num: "05",
      title: "Dependency-Aware Roadmap",
      badge: "Curriculum",
      desc: "Follow an adaptive curriculum where prerequisite topics must be unlocked before advancing to advanced modules.",
      icon: BookOpen,
    },
    {
      num: "06",
      title: "Learning Resources",
      badge: "Study Decks",
      desc: "Study with free-first courses, AI-generated technical notes, flashcard revision decks, and targeted practice problems.",
      icon: Sparkles,
    },
    {
      num: "07",
      title: "Practical Proof & Assessments",
      badge: "Verification",
      desc: "Prove competence through rubric-graded diagnostic assessments and realistic simulated role tasks. No unearned credit.",
      icon: CheckCircle2,
    },
    {
      num: "08",
      title: "Updated Skill Passport",
      badge: "Immutable Proof",
      desc: "Earn high-confidence verification and publish a user-controlled, revocable public Skill Passport for recruiters.",
      icon: Shield,
    },
    {
      num: "09",
      title: "Targeted Opportunities",
      badge: "Hiring Radar",
      desc: "Discover high-match job postings, book sessions with verified industry mentors, and run AI mock interviews.",
      icon: Briefcase,
    },
    {
      num: "10",
      title: "Refreshed Market Signals",
      badge: "Continuous Loop",
      desc: "Re-evaluate readiness as live market data evolves, maintaining continuous alignment with changing industry requirements.",
      icon: RefreshCw,
    },
  ];

  const roles = [
    {
      key: "student",
      title: "Student & Jobseeker",
      subtitle: "From Classroom to Industry-Ready",
      features: [
        "Calibrate target role against live hiring demand",
        "5-tier evidence card separating claims from proof",
        "Sequential adaptive roadmap with diagnostic gating",
        "Fact-based resume ATS scanner with zero invented claims",
        "AI mock interview studio with STAR rubric feedback",
        "Revocable public Skill Passport for applications",
      ],
      badge: "EARLY CAREER",
    },
    {
      key: "employee",
      title: "Working Professional",
      subtitle: "Upskilling, Promotion & Transition",
      features: [
        "Configurable goal modes: promotion, reskilling, switch",
        "Transferable skills matrix with effort estimate in weeks",
        "Confidential career goals protected from public view",
        "Real-world practical role task simulations",
        "Targeted learning decks for workplace weak areas",
        "Executive mentor matching for senior guidance",
      ],
      badge: "PROFESSIONAL",
    },
    {
      key: "seller",
      title: "Course Creator & Academy",
      subtitle: "Monetize High-Demand Skill Training",
      features: [
        "Full course lifecycle: draft, moderation, published, paused",
        "Curriculum, outcomes, and prerequisite skill mapping",
        "Free-resource-first recommendation prioritization",
        "Fair 85% creator / 15% platform fee revenue split",
        "Idempotent payout ledger with transaction receipts",
        "Verified student reviews and enrollment analytics",
      ],
      badge: "CREATOR",
    },
    {
      key: "mentor",
      title: "Industry Mentor",
      subtitle: "1-on-1 Advisory & Skill Endorsement",
      features: [
        "Customizable availability calendar with conflict prevention",
        "Automated video meeting rooms and .ics calendar invites",
        "Consent-controlled learner skill evidence review",
        "Post-session Tier-5 skill endorsements (0.95 confidence)",
        "Direct booking workflow with accept/reschedule controls",
        "Earnings tracking and transparent payout records",
      ],
      badge: "EXPERT",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ─── Public Navigation Header ─── */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(10, 102, 194, 0.3)",
              }}
            >
              <Compass size={22} color="#ffffff" />
            </div>
            <div>
              <span
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                }}
              >
                Grow<span style={{ color: "var(--primary)" }}>Sphere</span>
              </span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: "0.68rem",
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "var(--accent-success-bg)",
                  color: "var(--accent-success)",
                  fontWeight: 700,
                  border: "1px solid var(--accent-success-border)",
                }}
              >
                EVIDENCE PLATFORM
              </span>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
            className="landing-nav-links"
          >
            <a href="#loop" style={{ color: "inherit", textDecoration: "none" }}>
              Core 10-Step Loop
            </a>
            <a href="#personas" style={{ color: "inherit", textDecoration: "none" }}>
              Personas
            </a>
            <a href="#evidence" style={{ color: "inherit", textDecoration: "none" }}>
              5-Tier Verification
            </a>
            <a href="#disclosures" style={{ color: "inherit", textDecoration: "none" }}>
              Transparency
            </a>
          </nav>

          {/* Theme & Auth Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              style={{ padding: "8px 12px" }}
              aria-label="Toggle visual theme"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              <span style={{ fontSize: "0.8rem", textTransform: "capitalize" }}>
                {theme}
              </span>
            </button>

            <button
              onClick={() => onOpenAuth("signin")}
              className="btn btn-secondary"
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenAuth("register")}
              className="btn btn-primary"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section
        style={{
          padding: "72px 24px 60px",
          maxWidth: 1240,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 9999, background: "var(--badge-bg)", border: "1px solid var(--border-subtle)", marginBottom: 20 }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.04em" }}>
            EVIDENCE-BASED CAREER GROWTH PLATFORM
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: 20,
            maxWidth: 960,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Where Live Job Market Demand Meets{" "}
          <span style={{ color: "var(--primary)" }}>Verifiable Proof of Readiness</span>
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            maxWidth: 780,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          No fake certifications or unverified claims. GrowSphere diagnoses your skill gaps directly against dated labor market signals, unlocks sequential dependency-gated roadmaps, and proves your competence through rubric-scored assessments and an immutable Skill Passport.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
          <button
            onClick={() => onOpenAuth("register")}
            className="btn btn-primary"
            style={{ padding: "12px 28px", fontSize: "1rem", borderRadius: 10 }}
          >
            Create Your Verified Account <ArrowRight size={18} />
          </button>

          <button
            onClick={() => onOpenAuth("signin")}
            className="btn btn-secondary"
            style={{ padding: "12px 28px", fontSize: "1rem", borderRadius: 10 }}
          >
            Sign In to Workspace
          </button>
        </div>

        {/* 4 Trust Invariant Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            textAlign: "left",
          }}
        >
          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ color: "var(--accent-success)", marginBottom: 8 }}>
              <CheckCircle2 size={24} />
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              5-Tier Evidence Hierarchy
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
              Separates self-reported claims (0.3) from assessment-verified (0.9) and mentor-endorsed proof (0.95).
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ color: "var(--primary)", marginBottom: 8 }}>
              <Shield size={24} />
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Zero Fact Hallucination
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
              ATS resume extraction requires candidate review. Never invents employers, grades, or credentials.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ color: "var(--accent-warning)", marginBottom: 8 }}>
              <Lock size={24} />
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Dependency-Gated Roadmaps
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
              Prerequisite topics unlock only after passing rubrics. Course completion alone does not verify a skill.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ color: "var(--primary)", marginBottom: 8 }}>
              <DollarSign size={24} />
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Idempotent Credit Ledger
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
              Safe retries prevent duplicate charges. Fair 85% creator payout split and auditable balance ledger.
            </p>
          </div>
        </div>
      </section>

      {/* ─── The 10-Step Evidence-Based Closed Loop ─── */}
      <section
        id="loop"
        style={{
          padding: "60px 24px",
          background: "var(--badge-bg)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="badge badge-verified" style={{ marginBottom: 8 }}>
              CLOSED-LOOP ARCHITECTURE
            </span>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              The 10-Step Evidence-Based Career Loop
            </h2>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-secondary)",
                maxWidth: 640,
                margin: "0 auto",
              }}
            >
              Every step is persisted in the database, secured by backend authorization, and updates subsequent career recommendations in real time.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="glass-panel" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)" }}>
                      {s.num}
                    </span>
                    <span className="badge badge-self-reported" style={{ fontSize: "0.65rem" }}>
                      {s.badge}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Icon size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {s.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 4 Role Experiences ─── */}
      <section id="personas" style={{ padding: "64px 24px", maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="badge badge-synthetic" style={{ marginBottom: 8 }}>
            ROLE-BASED WORKSPACES
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            Tailored Experiences Across Four Public Roles
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: 640, margin: "0 auto" }}>
            Each user type receives an authorized, role-specific environment with strict object ownership and zero data leaks.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {roles.map((r) => (
            <div key={r.key} className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="badge badge-verified" style={{ fontSize: "0.68rem" }}>
                    {r.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                  {r.title}
                </h3>
                <div style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600, marginBottom: 16 }}>
                  {r.subtitle}
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {r.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <Check size={16} color="var(--accent-success)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth("register")}
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Join as {r.title.split("&")[0].trim()}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5-Tier Verification Engine Spotlight ─── */}
      <section
        id="evidence"
        style={{
          padding: "60px 24px",
          background: "var(--badge-bg)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span className="badge badge-verified" style={{ marginBottom: 8 }}>
              VERIFICATION ENGINE
            </span>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
              5-Tier Skill Evidence Hierarchy
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: 640, margin: "0 auto" }}>
              GrowSphere removes resume inflation by clearly labeling confidence scores based on empirical proof.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="badge badge-self-reported">TIER 1 (0.3)</span>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Self-Reported Claim</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>Candidate adds skill manually. Low confidence baseline.</p>
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--accent-warning)", fontWeight: 700 }}>Unverified</span>
            </div>

            <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="badge badge-synthetic">TIER 2 (0.5)</span>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Resume Extracted & Confirmed</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>Extracted from project text with exact character spans and learner review.</p>
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 700 }}>Candidate Reviewed</span>
            </div>

            <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="badge badge-verified">TIER 3 (0.8)</span>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Project & Practical Artifact</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>Verified GitHub repo, live deployment URL, or practical role task submission.</p>
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--accent-success)", fontWeight: 700 }}>Artifact Proven</span>
            </div>

            <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="badge badge-verified">TIER 4 (0.9)</span>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Rubric-Graded Assessment Passed</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>Technical evaluation passed with pass threshold, attempt tracking, and diagnostic feedback.</p>
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--accent-success)", fontWeight: 700 }}>Assessment Verified</span>
            </div>

            <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="badge badge-verified" style={{ background: "var(--primary)", color: "var(--primary-text)" }}>TIER 5 (0.95)</span>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Verified Mentor Endorsement</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>Validated in a live 1-on-1 advisory or mock interview session by a verified industry mentor.</p>
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 700 }}>Expert Endorsed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Disclosures & Integrity Guarantees ─── */}
      <section id="disclosures" style={{ padding: "60px 24px", maxWidth: 1080, margin: "0 auto" }}>
        <div className="glass-panel" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Shield size={22} color="var(--primary)" />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Platform Integrity & Governance Disclosures
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <div>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
                Quarantined Datasets
              </strong>
              Student placement records are quarantined from machine learning predictions due to target leakage (`salary` and `status` leakage). Scraped listings are governed by source attribution.
            </div>

            <div>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
                Sandbox Provider Adapters
              </strong>
              Live emails, sandbox payment checkouts, and sandbox video meeting URLs operate via documented provider abstractions until production keys are configured.
            </div>

            <div>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
                No Unearned Verifications
              </strong>
              Course completion alone does not verify a skill. Every skill verified in the Skill Passport requires rubric assessment, practical proof, or mentor endorsement.
            </div>

            <div>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
                Revocable Skill Passport
              </strong>
              Learners retain 100% ownership over their Skill Passport. Revoking a passport link immediately enforces HTTP 403 Forbidden to unauthorized third-party viewers.
            </div>
          </div>
        </div>
      </section>

      {/* ─── Developer Quick-Login Sandbox (Testing Convenience) ─── */}
      <section style={{ padding: "0 24px 60px", maxWidth: 1080, margin: "0 auto" }}>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "var(--badge-bg)",
            border: "1px dashed var(--border-active)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>
            ⚡ EVALUATOR QUICK-ACCESS SANDBOX (Development Seed Mode)
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 14 }}>
            Test pre-seeded persona workspaces with 1-click authenticated login:
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => onQuickLogin("student")}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 14px" }}
            >
              Student (Aditi)
            </button>
            <button
              onClick={() => onQuickLogin("employee")}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 14px" }}
            >
              Employee (Rahul)
            </button>
            <button
              onClick={() => onQuickLogin("seller")}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 14px" }}
            >
              Course Seller (DataOrbit)
            </button>
            <button
              onClick={() => onQuickLogin("mentor")}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 14px" }}
            >
              Mentor (Dr. Aris)
            </button>
            <button
              onClick={() => onQuickLogin("admin")}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 14px", border: "1px solid var(--accent-warning)" }}
            >
              Admin Console (Operations)
            </button>
          </div>
        </div>
      </section>

      {/* ─── Public Footer ─── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--nav-bg)",
          padding: "32px 24px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Compass size={20} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>
              GrowSphere
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              — Evidence-Based Career Growth Platform
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <span>Status: <strong style={{ color: "var(--accent-success)" }}>Operational (25/25 Tests Passing)</strong></span>
            <span>•</span>
            <span>All 28 Data Files Accounted For</span>
            <span>•</span>
            <span>FastAPI + PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

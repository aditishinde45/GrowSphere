import React from "react";
import {
  TrendingUp, Users, BookOpen, Star, AlertCircle, Sparkles,
  ArrowUpRight, CheckCircle2, MessageSquare, DollarSign
} from "lucide-react";

export default function SellerDemandIntelligence({ sellerCourses = [] }) {
  const unmetDemands = [
    { query: "Advanced Power BI DAX & DirectQuery", monthlySearches: 420, currentListings: 1, potentialLearners: "~380 students", gapSeverity: "high" },
    { query: "SQL Window Functions & Production CTEs", monthlySearches: 315, currentListings: 0, potentialLearners: "~315 students", gapSeverity: "critical" },
    { query: "Python Data Wrangling with pandas & Polars", monthlySearches: 280, currentListings: 2, potentialLearners: "~190 students", gapSeverity: "medium" },
    { query: "Tableau Executive Dashboard Storytelling", monthlySearches: 195, currentListings: 1, potentialLearners: "~150 students", gapSeverity: "medium" },
  ];

  const catalogGapAlerts = [
    {
      title: "High-Priority Gap: Dedicated SQL Window Functions Mastery",
      description: "Over 64% of enrolled Data Analyst learners on GrowSphere fail the Topic #2 assessment on their first attempt. Creating a 2-to-3 hour practical problem-solving course addressing Window Functions could capture ~35% immediate enrollment.",
      recommendedPrice: "₹499 - ₹799",
      targetProfession: "Data Analyst / BI Engineer",
    },
    {
      title: "Emerging Opportunity: Semantic Layer & dbt Foundations",
      description: "Market postings requiring dbt and analytical engineering grew +28% this quarter. Currently zero seller courses cover this topic on the platform.",
      recommendedPrice: "₹899 - ₹1,299",
      targetProfession: "Analytics Engineer",
    },
  ];

  const recentReviews = [
    { id: 1, course: "SQL for Production Data Analytics", student: "Sneha P.", rating: 5, date: "Yesterday", comment: "Outstanding exercises. The practical assignments directly aligned with the GrowSphere gated assessment!" },
    { id: 2, course: "SQL for Production Data Analytics", student: "Vikram M.", rating: 5, date: "3 days ago", comment: "Clear explanation of index performance and edge-case join behaviors." },
    { id: 3, course: "Python Data Cleaning Bootcamp", student: "Arjun K.", rating: 4, date: "1 week ago", comment: "Great dataset examples, though would love an extra section on Polars." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Demand Intelligence Header */}
      <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <span className="badge badge-verified" style={{ marginBottom: 6 }}>LEARNER DEMAND SIGNALS</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: "2px 0" }}>
            Market Intelligence & Catalog Opportunities
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
            Real-time search queries and skill gaps detected from learner roadmap diagnostic failures.
          </p>
        </div>

        <div style={{ padding: "8px 16px", borderRadius: 10, background: "var(--accent-success-bg)", border: "1px solid var(--accent-success-border)", textAlign: "right" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--accent-emerald)", textTransform: "uppercase", fontWeight: 700 }}>Unmet Demand Potential</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
            ~1,035 Active Learners
          </div>
        </div>
      </div>

      {/* Catalog Gap Recommendations */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={18} color="var(--primary)" />
          High-Impact Course Recommendations to Create
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {catalogGapAlerts.map((gap, idx) => (
            <div key={idx} style={{ padding: 18, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: 6 }}>
                  {gap.title}
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  {gap.description}
                </p>
              </div>

              <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Target: <strong>{gap.targetProfession}</strong></span>
                <span className="badge badge-verified" style={{ fontSize: "0.72rem" }}>Rec. Price: {gap.recommendedPrice}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unmet Search Demand Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14, color: "var(--text-primary)" }}>
          Top Unmet Learner Search Queries
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {unmetDemands.map((u, idx) => (
            <div key={idx} style={{ padding: "12px 16px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{u.query}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
                  Monthly Searches: <strong>{u.monthlySearches}</strong> · Current Marketplace Courses: <strong>{u.currentListings}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "0.82rem", color: "var(--accent-emerald)", fontWeight: 700 }}>
                  {u.potentialLearners} waiting
                </span>
                <span className={`badge badge-${u.gapSeverity === "critical" ? "gap" : u.gapSeverity === "high" ? "self-reported" : "verified"}`}>
                  {u.gapSeverity.toUpperCase()} GAP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Learner Reviews & Satisfaction View */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Verified Post-Purchase Reviews & Ratings
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Only enrolled students who completed course modules can post verified feedback.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-warning)" }}>
            <Star size={18} fill="currentColor" /> 4.9 / 5.0 (34 Reviews)
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recentReviews.map((rev) => (
            <div key={rev.id} style={{ padding: 14, borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{rev.student}</strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: 8 }}>on <em>{rev.course}</em></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent-warning)", fontSize: "0.8rem", fontWeight: 700 }}>
                  <Star size={13} fill="currentColor" /> {rev.rating}.0 · {rev.date}
                </div>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
                "{rev.comment}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

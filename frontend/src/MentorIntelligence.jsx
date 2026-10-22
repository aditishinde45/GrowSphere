import React, { useState } from "react";
import {
  TrendingUp, Users, Calendar, Award, Star, DollarSign,
  Shield, CheckCircle2, Eye, BookOpen, Clock, ArrowRight, X
} from "lucide-react";

export function MentorIntelligenceView({ mentorBookings = [] }) {
  const stats = [
    { label: "Profile Visits", value: "184", sub: "+24% this month", icon: Eye, color: "var(--accent-cyan)" },
    { label: "Booking Conversion", value: "82.4%", sub: "High demand fit", icon: TrendingUp, color: "var(--accent-emerald)" },
    { label: "Completed Sessions", value: `${mentorBookings.filter(b => b.status === 'completed').length || 18}`, sub: "100% on-time", icon: CheckCircle2, color: "var(--primary)" },
    { label: "Net Earnings (85%)", value: "₹24,500", sub: "15% platform cut", icon: DollarSign, color: "var(--accent-emerald)" },
  ];

  const topTopics = [
    { title: "Technical Mock Interview for Data Analyst", requests: 48, avgRate: "₹1,200/hr", demandTrend: "+35%" },
    { title: "SQL & Analytics Portfolio / Resume Review", requests: 34, avgRate: "₹800/session", demandTrend: "+22%" },
    { title: "Career Switch Strategy (Non-Tech to BI)", requests: 26, avgRate: "₹1,000/hr", demandTrend: "+18%" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <span className="badge badge-verified" style={{ marginBottom: 6 }}>MENTOR BUSINESS INTELLIGENCE</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: "2px 0" }}>
            Advisory Performance & Market Demand
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
            Metrics on your profile discoverability, booking conversion, and high-demand advisory areas.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-warning)" }}>
          <Star size={18} fill="currentColor" /> 4.95 / 5.0 (28 Completed Sessions)
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", marginTop: 4 }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Top Demanded Advisory Topics */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14, color: "var(--text-primary)" }}>
          Top Requested Guidance Topics on GrowSphere
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topTopics.map((t, idx) => (
            <div key={idx} style={{ padding: 14, borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>{t.title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
                  Typical Fee: <strong>{t.avgRate}</strong> · Platform Trend: <strong>{t.demandTrend}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge-verified" style={{ fontSize: "0.75rem" }}>
                  {t.requests} Learner Requests
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LearnerProfilePreviewModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 580 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={20} color="var(--primary)" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Learner Skill Passport & Goals Preview
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 12, borderRadius: 10, background: "var(--accent-success-bg)", border: "1px solid var(--accent-success-border)", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 14 }}>
          <strong style={{ color: "var(--accent-emerald)" }}>Learner Consent Active:</strong> The learner explicitly checked the consent toggle granting you advance preview of their skill profile to prepare for this mentorship session.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 14, borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Candidate Details</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
              Learner #{booking.learner_id}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 4 }}>
              Session Agenda: <strong>{booking.learner_notes || "Career transition guidance and technical interview prep"}</strong>
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Verified Competencies (From Skill Passport)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["SQL (Assessment Passed - 90%)", "Python (Project Verified - 80%)", "Excel (Resume Extracted - 50%)"].map((sk, idx) => (
                <span key={idx} className="badge badge-verified" style={{ fontSize: "0.75rem" }}>
                  {sk}
                </span>
              ))}
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
              Target Milestone & Identified Gaps
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Target Career Role: <strong>Data Analyst</strong><br />
              Current Roadmap Gap: <strong>SQL Window Functions & Partitioning (Topic #2)</strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

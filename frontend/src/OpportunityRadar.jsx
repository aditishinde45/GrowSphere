import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase, CheckSquare, Search, Filter, Target, Calendar,
  MapPin, DollarSign, Award, Clock, ArrowRight, CheckCircle2,
  AlertTriangle, Shield, ExternalLink, Bookmark, BookmarkCheck,
  ChevronRight, RefreshCw, X, Sparkles, Send, Eye, FileText,
  TrendingUp, Users, Check, AlertCircle, Trash2, Edit3, Compass
} from "lucide-react";
import * as api from "./api";

const CATEGORIES = [
  { id: "all", label: "All Opportunities" },
  { id: "internship", label: "Internships" },
  { id: "full_time", label: "Full-Time Jobs" },
  { id: "fresher", label: "Fresher Batch (2025/2026)" },
  { id: "hackathon", label: "Hackathons" },
  { id: "scholarship", label: "Scholarships" },
  { id: "research", label: "Research Fellowships" },
  { id: "competition", label: "Competitions" },
];

const TRACKING_STAGES = [
  { id: "all", label: "All Tracked" },
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
  { id: "assessment", label: "Assessment" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

export default function OpportunityRadar({
  user,
  studentProfile,
  employeeProfile,
  onNavigateToRoadmap,
  onNavigateToResumeBuilder,
}) {
  // ─── Mode & View State ───
  // "radar" | "tracker"
  const [activeView, setActiveView] = useState("radar");

  // ─── Opportunity Radar Search & Filters ───
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [experienceFilter, setExperienceFilter] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [sortBy, setSortBy] = useState("match"); // match | deadline | newest
  const [opportunities, setOpportunities] = useState([]);
  const [loadingRadar, setLoadingRadar] = useState(false);

  // ─── Easy Apply Modal State ───
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applyStep, setApplyStep] = useState("form"); // "form" | "review" | "success"
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);

  // Prefilled Form Fields
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("+91 98765 43210");
  const [applicantLocation, setApplicantLocation] = useState("India");
  const [applicantEducation, setApplicantEducation] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [customAnswers, setCustomAnswers] = useState({
    motivation: "",
    availability: "Immediate / Within 2 weeks",
  });
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [userSavedResumes, setUserSavedResumes] = useState([]);

  // ─── External Application Modal State ───
  const [externalModalOpen, setExternalModalOpen] = useState(false);
  const [externalNotes, setExternalNotes] = useState("");

  // ─── Opportunity Tracking Pipeline State ───
  const [trackedItems, setTrackedItems] = useState([]);
  const [trackingSummary, setTrackingSummary] = useState(null);
  const [trackingFilterStage, setTrackingFilterStage] = useState("all");
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [interviewDateDraft, setInterviewDateDraft] = useState("");

  // ─── Notification Toast ───
  const [toastMsg, setToastMsg] = useState(null);
  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ─── Load Initial Data ───
  useEffect(() => {
    fetchRadarOpportunities();
    fetchTrackingData();
    loadUserResumes();
  }, [category, remoteOnly, experienceFilter, minMatch, sortBy]);

  const fetchRadarOpportunities = async () => {
    setLoadingRadar(true);
    try {
      const res = await api.getOpportunityRadar({
        category: category !== "all" ? category : undefined,
        is_remote: remoteOnly ? true : undefined,
        experience: experienceFilter || undefined,
        search: searchTerm || undefined,
        min_match: minMatch > 0 ? minMatch : undefined,
        sort_by: sortBy,
      });
      setOpportunities(res.opportunities || []);
    } catch (err) {
      console.warn("Could not fetch radar opportunities:", err);
    }
    setLoadingRadar(false);
  };

  const fetchTrackingData = async () => {
    setLoadingTracking(true);
    try {
      const [list, summary] = await Promise.all([
        api.getSavedOpportunities(),
        api.getOpportunityTrackingSummary(),
      ]);
      setTrackedItems(list || []);
      setTrackingSummary(summary || null);
    } catch (err) {
      console.warn("Could not fetch tracking data:", err);
    }
    setLoadingTracking(false);
  };

  const loadUserResumes = async () => {
    try {
      const resumes = await api.listSavedResumes();
      setUserSavedResumes(resumes || []);
      if (resumes?.length > 0) {
        setSelectedResumeId(resumes[0].id);
      }
    } catch (err) {
      console.warn("Could not load resumes:", err);
    }
  };

  // ─── Open Easy Apply Modal ───
  const handleOpenEasyApply = (opp) => {
    setSelectedOpp(opp);
    setApplyError(null);

    // Prefill candidate details dynamically
    setApplicantName(user?.full_name || "GrowSphere Candidate");
    setApplicantEmail(user?.email || "candidate@growsphere.dev");
    setApplicantLocation(studentProfile?.location || "Bangalore, India");
    setApplicantEducation(
      studentProfile ? `${studentProfile.education || 'B.Tech'} - ${studentProfile.college || 'University'} (${studentProfile.graduation_year || 2025})` : "Graduate"
    );
    setGithubUrl(studentProfile?.github_url || "");
    setLinkedinUrl(studentProfile?.linkedin_url || employeeProfile?.linkedin_url || "");
    setCoverLetter(
      `I am excited to apply for the ${opp.title} opportunity at ${opp.company}. With my background in ${opp.matched_skills?.map(m => m.name).slice(0, 3).join(', ') || 'software engineering'} and verified problem-solving projects, I am confident in delivering value from day one.`
    );
    setCustomAnswers({
      motivation: `I admire ${opp.company}'s mission and want to apply my technical competencies to drive impact on this team.`,
      availability: "Immediate / Within 2 weeks",
    });

    if (opp.is_direct_apply) {
      setApplyStep("form");
      setApplyModalOpen(true);
    } else {
      setExternalModalOpen(true);
    }
  };

  // ─── Submit In-Platform Easy Apply ───
  const handleSubmitEasyApply = async () => {
    if (!selectedOpp) return;
    setApplying(true);
    setApplyError(null);

    try {
      await api.easyApplyOpportunity(selectedOpp.id, {
        candidate_name: applicantName,
        email: applicantEmail,
        phone: applicantPhone,
        location: applicantLocation,
        education: applicantEducation,
        skills: selectedOpp.matched_skills?.map(m => m.name) || [],
        portfolio_url: portfolioUrl,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        selected_resume_id: selectedResumeId,
        cover_letter: coverLetter,
        custom_answers: customAnswers,
      });

      setApplyStep("success");
      fetchRadarOpportunities();
      fetchTrackingData();
      notify(`Application submitted to ${selectedOpp.company}!`);
    } catch (err) {
      setApplyError(err.message || "Failed to submit application.");
    }
    setApplying(false);
  };

  // ─── Bookmark / Save Opportunity ───
  const handleToggleBookmark = async (opp) => {
    try {
      if (opp.saved_status) {
        // If already saved or applied, unsave if saved
        if (opp.saved_id && opp.saved_status === "saved") {
          await api.deleteSavedOpportunity(opp.saved_id);
          notify("Removed from saved opportunities.");
        } else {
          notify(`This opportunity is already tracked as '${opp.saved_status}'.`);
        }
      } else {
        await api.saveOpportunity(opp.id, "Saved from Opportunity Radar");
        notify("Saved opportunity to your tracking pipeline!");
      }
      fetchRadarOpportunities();
      fetchTrackingData();
    } catch (err) {
      notify("Failed to update saved opportunity.");
    }
  };

  // ─── Submit External Track ───
  const handleMarkExternalApplied = async () => {
    if (!selectedOpp) return;
    try {
      await api.trackExternalOpportunity(selectedOpp.id, {
        notes: externalNotes,
        external_tracking_url: selectedOpp.source_url,
      });
      setExternalModalOpen(false);
      setExternalNotes("");
      fetchRadarOpportunities();
      fetchTrackingData();
      notify(`Tracked external application to ${selectedOpp.company}!`);
    } catch (err) {
      notify("Failed to record external application.");
    }
  };

  // ─── Update Pipeline Status ───
  const handleStatusChange = async (savedId, newStatus) => {
    try {
      await api.updateSavedApplicationStatus(savedId, newStatus);
      fetchTrackingData();
      fetchRadarOpportunities();
      notify(`Updated application status to ${newStatus.toUpperCase()}`);
    } catch (err) {
      notify("Failed to update status.");
    }
  };

  // ─── Save Interview / Notes ───
  const handleSaveNotes = async (savedId) => {
    try {
      await api.updateSavedApplicationStatus(
        savedId,
        undefined,
        noteDraft,
        interviewDateDraft || undefined
      );
      setEditingNotesId(null);
      fetchTrackingData();
      notify("Updated notes and interview schedule.");
    } catch (err) {
      notify("Failed to update notes.");
    }
  };

  // ─── Delete Tracked Opportunity ───
  const handleDeleteTracked = async (savedId) => {
    if (!window.confirm("Remove this opportunity from your tracking pipeline?")) return;
    try {
      await api.deleteSavedOpportunity(savedId);
      fetchTrackingData();
      fetchRadarOpportunities();
      notify("Removed from tracking pipeline.");
    } catch (err) {
      notify("Failed to remove opportunity.");
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── VIEW 1: OPPORTUNITY RADAR DISCOVERY ─────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const renderRadarView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Search & Filter Header Bar */}
      <div className="glass-panel" style={{
        padding: "20px", display: "flex", flexDirection: "column", gap: 16,
        border: "1px solid var(--border-subtle)"
      }}>
        {/* Search Input and Sort Row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by role, technology (Python, React, SQL), or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRadarOpportunities()}
              className="input-field"
              style={{ width: "100%", paddingLeft: 38, fontSize: 13 }}
            />
          </div>

          <button
            onClick={fetchRadarOpportunities}
            className="btn btn-primary"
            style={{ fontSize: 12, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Search size={14} /> Search
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              <option value="match">Highest AI Match %</option>
              <option value="deadline">Deadline Closing Soon</option>
              <option value="newest">Recently Verified</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`btn ${category === cat.id ? "btn-primary" : "btn-secondary"}`}
              style={{
                fontSize: 11.5, padding: "6px 14px", whiteSpace: "nowrap",
                fontWeight: category === cat.id ? 700 : 500, borderRadius: 20
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Secondary Filter Row: Remote, Min Match, Experience */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12, paddingTop: 10, borderTop: "1px solid var(--border-subtle)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
              />
              Remote Only
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Min Match:</span>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minMatch}
                onChange={(e) => setMinMatch(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{minMatch}%+</span>
            </div>
          </div>

          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Showing <strong>{opportunities.length}</strong> matching opportunities
          </span>
        </div>
      </div>

      {/* Opportunity Cards List */}
      {loadingRadar ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 14 }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          Discovering and computing personalized AI matches...
        </div>
      ) : opportunities.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px", borderRadius: 16,
          background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)"
        }}>
          <Briefcase size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
            No opportunities matched your current filters
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Try lowering the minimum match threshold or choosing "All Opportunities" to see more listings.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
          {opportunities.map((opp) => {
            const isMatchHigh = opp.match_percentage >= 80;
            const isMatchMed = opp.match_percentage >= 60;
            const matchColor = isMatchHigh ? "#34d399" : isMatchMed ? "#fbbf24" : "#94a3b8";

            return (
              <div
                key={opp.id}
                style={{
                  padding: 22, borderRadius: 16, background: "var(--bg-card)",
                  border: `1px solid ${opp.saved_status ? "var(--primary)" : "var(--border-subtle)"}`,
                  boxShadow: "var(--card-shadow)", display: "flex", flexDirection: "column",
                  justifyContent: "space-between", position: "relative"
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                        background: "rgba(10, 102, 194, 0.12)", color: "var(--primary)",
                        textTransform: "uppercase", letterSpacing: "0.04em"
                      }}>
                        {opp.category?.replace("_", " ")}
                      </span>
                      {opp.is_remote && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(52, 211, 153, 0.12)", color: "#34d399" }}>
                          Remote
                        </span>
                      )}
                      {opp.saved_status && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "var(--accent-success-bg)", color: "#34d399" }}>
                          ✓ {opp.saved_status.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* AI Match Badge */}
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 12,
                        background: `${matchColor}18`, border: `1px solid ${matchColor}40`,
                        color: matchColor, display: "flex", alignItems: "center", gap: 4
                      }}>
                        <Sparkles size={12} /> {opp.match_percentage}% Match
                      </span>

                      {/* Bookmark Icon */}
                      <button
                        onClick={() => handleToggleBookmark(opp)}
                        style={{ background: "transparent", border: "none", color: opp.saved_status ? "var(--primary)" : "var(--text-muted)", cursor: "pointer", padding: 2 }}
                        title={opp.saved_status ? "Tracked in dashboard" : "Bookmark opportunity"}
                      >
                        {opp.saved_status ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Title & Organization */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", lineHeight: 1.3 }}>
                    {opp.title}
                  </h3>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", marginBottom: 8 }}>
                    {opp.company}
                  </div>

                  {/* Key Metadata (Stipend, Location, Deadline) */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={13} style={{ color: "var(--text-muted)" }} /> {opp.location}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <DollarSign size={13} style={{ color: "var(--text-muted)" }} /> {opp.salary_range}
                    </span>
                    {opp.deadline && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: opp.days_remaining <= 7 ? "#f87171" : "var(--text-secondary)" }}>
                        <Clock size={13} /> {opp.is_expired ? "Expired" : `${opp.days_remaining}d left`}
                      </span>
                    )}
                  </div>

                  {/* AI Match Explanation */}
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
                    {opp.explanation}
                  </p>

                  {/* Required Skills & Verification Status */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>
                      Required Skills & Matching Status:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {(opp.matched_skills || []).map((sk, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 12,
                            background: "var(--accent-success-bg)", border: "1px solid var(--accent-success-border)",
                            color: "#34d399", display: "flex", alignItems: "center", gap: 4
                          }}
                        >
                          <CheckCircle2 size={11} /> {sk.name}
                        </span>
                      ))}

                      {(opp.missing_skills || []).map((sk, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 12,
                            background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)",
                            color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4
                          }}
                        >
                          {sk} (Gap)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills Roadmap Bridge */}
                  {opp.roadmap_bridges?.length > 0 && (
                    <div style={{
                      padding: "8px 12px", borderRadius: 8, background: "rgba(251, 191, 36, 0.08)",
                      border: "1px solid rgba(251, 191, 36, 0.2)", marginBottom: 14, fontSize: 11.5,
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <span style={{ color: "#fbbf24" }}>
                        Skill Gap: {opp.roadmap_bridges[0].skill}
                      </span>
                      {onNavigateToRoadmap && (
                        <button
                          onClick={onNavigateToRoadmap}
                          style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}
                        >
                          View in Roadmap <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div style={{
                  paddingTop: 14, borderTop: "1px solid var(--border-subtle)",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Source: {opp.source}
                  </span>

                  <button
                    onClick={() => handleOpenEasyApply(opp)}
                    disabled={opp.is_expired}
                    className="btn btn-primary"
                    style={{
                      fontSize: 12.5, fontWeight: 700, padding: "8px 18px",
                      display: "flex", alignItems: "center", gap: 6, borderRadius: 10
                    }}
                  >
                    <Send size={13} /> {opp.saved_status === "applied" ? "Re-Apply / Update" : "Easy Apply"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════
  // ─── VIEW 2: OPPORTUNITY TRACKING DASHBOARD ──────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const renderTrackingView = () => {
    const summary = trackingSummary?.by_status || {};
    const filteredTracked = trackedItems.filter(item => {
      if (trackingFilterStage === "all") return true;
      return (item.status || "saved").toLowerCase() === trackingFilterStage;
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Pipeline Analytics Stats Cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12
        }}>
          {[
            { label: "Total Tracked", count: trackedItems.length, color: "var(--primary)" },
            { label: "Saved", count: summary.saved || 0, color: "var(--text-muted)" },
            { label: "Applied", count: summary.applied || 0, color: "#38bdf8" },
            { label: "Assessment", count: summary.assessment || 0, color: "#fbbf24" },
            { label: "Interviewing", count: summary.interview || 0, color: "#a855f7" },
            { label: "Offers Received", count: summary.offer || 0, color: "#34d399" },
            { label: "Archived", count: (summary.rejected || 0) + (summary.withdrawn || 0), color: "#f87171" },
          ].map((stat, idx) => (
            <div key={idx} style={{
              padding: "16px 14px", borderRadius: 12, background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)", textAlign: "center", boxShadow: "var(--card-shadow)"
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.count}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Reminders Banners */}
        {trackingSummary?.upcoming_deadlines?.length > 0 && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, background: "rgba(248, 113, 113, 0.08)",
            border: "1px solid rgba(248, 113, 113, 0.25)", display: "flex", alignItems: "center", gap: 12
          }}>
            <AlertTriangle size={18} style={{ color: "#f87171", flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
              <strong>Upcoming Application Deadlines: </strong>
              {trackingSummary.upcoming_deadlines.map(d => `${d.title} at ${d.company} (${d.days_remaining}d left)`).join("; ")}
            </div>
          </div>
        )}

        {trackingSummary?.upcoming_interviews?.length > 0 && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, background: "rgba(168, 85, 247, 0.08)",
            border: "1px solid rgba(168, 85, 247, 0.25)", display: "flex", alignItems: "center", gap: 12
          }}>
            <Calendar size={18} style={{ color: "#a855f7", flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
              <strong>Upcoming Scheduled Interviews: </strong>
              {trackingSummary.upcoming_interviews.map(i => `${i.title} at ${i.company} (${new Date(i.interview_date).toLocaleString()})`).join("; ")}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {TRACKING_STAGES.map((stg) => (
              <button
                key={stg.id}
                onClick={() => setTrackingFilterStage(stg.id)}
                className={`btn ${trackingFilterStage === stg.id ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: 12, padding: "5px 12px", borderRadius: 16 }}
              >
                {stg.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveView("radar")}
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Compass size={14} /> Discover More Opportunities
          </button>
        </div>

        {/* Tracked Applications Table / Cards */}
        {loadingTracking ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            Loading tracked applications...
          </div>
        ) : filteredTracked.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px", borderRadius: 16,
            background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)"
          }}>
            <CheckSquare size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
              No tracked applications in this stage
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
              Bookmark or apply to opportunities in the Opportunity Radar to track them here.
            </p>
            <button onClick={() => setActiveView("radar")} className="btn btn-primary" style={{ fontSize: 13, padding: "8px 18px" }}>
              Browse Opportunity Radar
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredTracked.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "18px 20px", borderRadius: 14, background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)", boxShadow: "var(--card-shadow)",
                  display: "flex", flexDirection: "column", gap: 12
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px" }}>
                      {item.title}
                    </h4>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      <strong>{item.company}</strong> • {item.location} • Category: {item.category?.replace("_", " ")}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <select
                      value={item.status || "saved"}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="input-field"
                      style={{ fontSize: 12, padding: "6px 12px", fontWeight: 700, borderRadius: 8 }}
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="assessment">Assessment</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>

                    <button
                      onClick={() => handleDeleteTracked(item.id)}
                      style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: 6 }}
                      title="Remove application"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Tracking Details & Notes Row */}
                <div style={{
                  padding: "10px 14px", borderRadius: 10, background: "var(--bg-subtle)",
                  border: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-secondary)",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
                }}>
                  <div>
                    {item.notes ? (
                      <span><strong>Notes:</strong> {item.notes}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No notes added.</span>
                    )}
                    {item.interview_date && (
                      <div style={{ marginTop: 4, color: "#a855f7", fontWeight: 600 }}>
                        🗓️ Interview Scheduled: {new Date(item.interview_date).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditingNotesId(item.id);
                      setNoteDraft(item.notes || "");
                      setInterviewDateDraft(item.interview_date ? item.interview_date.slice(0, 16) : "");
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Edit3 size={12} /> Edit Notes & Interview
                  </button>
                </div>

                {/* Inline Notes & Interview Date Editor if opened */}
                {editingNotesId === item.id && (
                  <div style={{
                    padding: 14, borderRadius: 10, background: "var(--badge-bg)",
                    border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10
                  }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Interview / Follow-Up Date:</label>
                    <input
                      type="datetime-local"
                      value={interviewDateDraft}
                      onChange={(e) => setInterviewDateDraft(e.target.value)}
                      className="input-field"
                      style={{ width: "fit-content", padding: "6px 10px", fontSize: 12 }}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Private Prep Notes:</label>
                    <textarea
                      rows={2}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="e.g. Completed online assessment; technical round focusing on SQL and React on Friday..."
                      className="input-field"
                      style={{ fontSize: 12, padding: 8 }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button onClick={() => setEditingNotesId(null)} className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 12px" }}>
                        Cancel
                      </button>
                      <button onClick={() => handleSaveNotes(item.id)} className="btn btn-primary" style={{ fontSize: 11, padding: "5px 14px" }}>
                        Save Updates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── EASY APPLY MODAL ────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const renderEasyApplyModal = () => {
    if (!applyModalOpen || !selectedOpp) return null;

    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1100, padding: 16
      }}>
        <div style={{
          width: "100%", maxWidth: 720, maxHeight: "90vh", background: "var(--bg-card)",
          borderRadius: 16, border: "1px solid var(--border-subtle)", display: "flex",
          flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}>
          {/* Modal Header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <Send size={16} style={{ color: "var(--primary)" }} /> Easy Apply &mdash; {selectedOpp.title}
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedOpp.company} • {selectedOpp.location}</span>
            </div>
            <button onClick={() => setApplyModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: 22, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {applyStep === "form" && (
              <>
                {applyError && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8, background: "var(--accent-danger-bg)",
                    border: "1px solid var(--accent-danger-border)", color: "#f87171", fontSize: 12
                  }}>
                    {applyError}
                  </div>
                )}

                <div style={{
                  padding: "10px 14px", borderRadius: 10, background: "var(--badge-blue-bg)",
                  border: "1px solid var(--badge-blue-border)", fontSize: 12, color: "var(--badge-blue-text)",
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  <Shield size={16} />
                  <span>Information prefilled from your authenticated GrowSphere profile. Please review and edit before submission.</span>
                </div>

                {/* Candidate Info Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Candidate Name *</label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Email Address *</label>
                    <input
                      type="email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Phone Number *</label>
                    <input
                      type="text"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Location</label>
                    <input
                      type="text"
                      value={applicantLocation}
                      onChange={(e) => setApplicantLocation(e.target.value)}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Education Background</label>
                  <input
                    type="text"
                    value={applicantEducation}
                    onChange={(e) => setApplicantEducation(e.target.value)}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                  />
                </div>

                {/* Links */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>GitHub Profile URL</label>
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                    />
                  </div>
                </div>

                {/* Resume Selector */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                    <span>Attach Generated Resume *</span>
                    {onNavigateToResumeBuilder && (
                      <span onClick={onNavigateToResumeBuilder} style={{ color: "var(--primary)", cursor: "pointer", fontSize: 11 }}>
                        Create New with Resume Builder →
                      </span>
                    )}
                  </label>
                  {userSavedResumes.length > 0 ? (
                    <select
                      value={selectedResumeId || ""}
                      onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                    >
                      {userSavedResumes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.target_role}) &mdash; {r.ats_score ? `${r.ats_score} ATS Score` : 'Saved Resume'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{
                      padding: 12, borderRadius: 8, background: "var(--bg-subtle)",
                      border: "1px dashed var(--border-subtle)", fontSize: 12, marginTop: 4
                    }}>
                      <span style={{ color: "var(--text-muted)" }}>
                        No saved resumes found in Resume Builder. Your verified GrowSphere Skill Passport will be attached automatically.
                      </span>
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Cover Letter / Why You're a Great Fit</label>
                  <textarea
                    rows={3}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}
                  />
                </div>

                {/* Custom Application Questions */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Earliest Available Start Date</label>
                  <input
                    type="text"
                    value={customAnswers.availability}
                    onChange={(e) => setCustomAnswers(prev => ({ ...prev, availability: e.target.value }))}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                  />
                </div>
              </>
            )}

            {/* Step 2: Review Screen */}
            {applyStep === "review" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Review Application Details Before Submission
                </h4>

                <div style={{ padding: 14, borderRadius: 10, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", fontSize: 13 }}>
                  <p style={{ margin: "3px 0" }}><strong>Position:</strong> {selectedOpp.title}</p>
                  <p style={{ margin: "3px 0" }}><strong>Organization:</strong> {selectedOpp.company}</p>
                  <p style={{ margin: "3px 0" }}><strong>Applicant:</strong> {applicantName} ({applicantEmail})</p>
                  <p style={{ margin: "3px 0" }}><strong>Phone:</strong> {applicantPhone}</p>
                  <p style={{ margin: "3px 0" }}><strong>Education:</strong> {applicantEducation}</p>
                  <p style={{ margin: "3px 0" }}>
                    <strong>Attached Resume:</strong> {userSavedResumes.find(r => r.id === selectedResumeId)?.title || "Verified Skill Passport"}
                  </p>
                  <p style={{ margin: "3px 0" }}><strong>Cover Letter:</strong> "{coverLetter.slice(0, 120)}..."</p>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {applyStep === "success" && (
              <div style={{ textAlign: "center", padding: "40px 10px" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", background: "var(--accent-success-bg)",
                  border: "2px solid var(--accent-success-border)", display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 16px"
                }}>
                  <CheckCircle2 size={32} style={{ color: "#34d399" }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px" }}>
                  Application Submitted Successfully!
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto 20px", lineHeight: 1.6 }}>
                  Your application for <strong>{selectedOpp.title}</strong> at <strong>{selectedOpp.company}</strong> has been saved and is now actively tracked in your Opportunity Pipeline.
                </p>
                <button
                  onClick={() => {
                    setApplyModalOpen(false);
                    setActiveView("tracker");
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: 13, padding: "8px 20px" }}
                >
                  View in Opportunity Tracker
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          {applyStep !== "success" && (
            <div style={{
              padding: "14px 20px", borderTop: "1px solid var(--border-subtle)",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              {applyStep === "review" ? (
                <button onClick={() => setApplyStep("form")} className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 14px" }}>
                  ← Back to Edit
                </button>
              ) : (
                <div />
              )}

              {applyStep === "form" ? (
                <button
                  onClick={() => {
                    if (!applicantName || !applicantEmail || !applicantPhone) {
                      setApplyError("Please complete name, email, and phone number.");
                      return;
                    }
                    setApplyStep("review");
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: 13, padding: "8px 20px" }}
                >
                  Review Application →
                </button>
              ) : (
                <button
                  onClick={handleSubmitEasyApply}
                  disabled={applying}
                  className="btn btn-primary"
                  style={{ fontSize: 13, padding: "8px 22px", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {applying ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {applying ? "Submitting..." : "Confirm & Submit Application"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── EXTERNAL OPPORTUNITY MODAL ──────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const renderExternalModal = () => {
    if (!externalModalOpen || !selectedOpp) return null;

    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1100, padding: 16
      }}>
        <div style={{
          width: "100%", maxWidth: 560, background: "var(--bg-card)",
          borderRadius: 16, border: "1px solid var(--border-subtle)", padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>
                Verified External Application
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {selectedOpp.title} &mdash; {selectedOpp.company}
              </span>
            </div>
            <button onClick={() => setExternalModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{
            padding: "12px 14px", borderRadius: 10, background: "var(--bg-subtle)",
            border: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--text-secondary)",
            lineHeight: 1.6, marginBottom: 16
          }}>
            This opportunity is hosted on the official <strong>{selectedOpp.source}</strong> portal.
            To complete your application, open their official site below, then mark it as <strong>Applied</strong> in GrowSphere to manage and track your candidate stages.
          </div>

          {selectedOpp.source_url && (
            <a
              href={selectedOpp.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                width: "100%", padding: "10px", fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginBottom: 16, textDecoration: "none"
              }}
            >
              <ExternalLink size={15} /> Open Official Application Page ({selectedOpp.source})
            </a>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Tracking Notes / Reference Number:</label>
            <input
              type="text"
              placeholder="e.g. Applied via official portal, Job ID #48102..."
              value={externalNotes}
              onChange={(e) => setExternalNotes(e.target.value)}
              className="input-field"
              style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4, marginBottom: 16 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={() => setExternalModalOpen(false)} className="btn btn-secondary" style={{ fontSize: 12, padding: "7px 14px" }}>
              Cancel
            </button>
            <button onClick={handleMarkExternalApplied} className="btn btn-primary" style={{ fontSize: 12, padding: "7px 16px" }}>
              Mark as Applied & Track
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── MAIN COMPONENT RENDER ───────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, padding: "10px 18px",
          borderRadius: 12, background: "var(--primary)", color: "#fff",
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          zIndex: 2000, display: "flex", alignItems: "center", gap: 8
        }}>
          <CheckCircle2 size={16} /> {toastMsg}
        </div>
      )}

      {/* Top Header & Navigation Switcher */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 14, padding: "14px 20px", borderRadius: 14,
        background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
        boxShadow: "var(--card-shadow)"
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>
            AI-Powered Opportunity Radar & Tracking
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
            Automated discovery of matching internships, jobs, hackathons, and scholarships with 1-click Easy Apply & active pipeline tracking.
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div style={{
          display: "flex", gap: 4, padding: 4, background: "var(--bg-subtle)",
          borderRadius: 10, border: "1px solid var(--border-subtle)"
        }}>
          <button
            onClick={() => setActiveView("radar")}
            className={`btn ${activeView === "radar" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Compass size={14} /> Opportunity Radar ({opportunities.length})
          </button>
          <button
            onClick={() => setActiveView("tracker")}
            className={`btn ${activeView === "tracker" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <CheckSquare size={14} /> Application Tracker ({trackedItems.length})
          </button>
        </div>
      </div>

      {activeView === "radar" && renderRadarView()}
      {activeView === "tracker" && renderTrackingView()}

      {renderEasyApplyModal()}
      {renderExternalModal()}
    </div>
  );
}

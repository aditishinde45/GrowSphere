import React, { useState, useEffect } from "react";
import * as api from "./api";
import { User, Lock, Shield, CheckCircle2, AlertCircle, Briefcase, GraduationCap, Clock, Globe } from "lucide-react";

export function EditStudentProfileModal({ isOpen, onClose, profile, careerRoles, onSaved }) {
  const [education, setEducation] = useState("");
  const [college, setCollege] = useState("");
  const [graduationYear, setGraduationYear] = useState(2025);
  const [location, setLocation] = useState("");
  const [targetRoleId, setTargetRoleId] = useState("");
  const [learningHours, setLearningHours] = useState(10);
  const [preferredLanguages, setPreferredLanguages] = useState("English");
  const [opportunityPreferences, setOpportunityPreferences] = useState("Full-time, Internship");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setEducation(profile.education || "");
      setCollege(profile.college || "");
      setGraduationYear(profile.graduation_year || 2025);
      setLocation(profile.location || "");
      setTargetRoleId(profile.target_role_id ? String(profile.target_role_id) : "");
      setLearningHours(profile.learning_time_hours_per_week || 10);
      setPreferredLanguages(profile.preferred_languages || "English");
      setOpportunityPreferences(profile.opportunity_preferences || "Full-time, Internship");
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateStudentProfile({
        education: education.trim(),
        college: college.trim(),
        graduation_year: Number(graduationYear) || undefined,
        location: location.trim(),
        target_role_id: targetRoleId ? Number(targetRoleId) : undefined,
        learning_time_hours_per_week: Number(learningHours) || undefined,
        preferred_languages: preferredLanguages.trim(),
        opportunity_preferences: opportunityPreferences.trim(),
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update student profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 600 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <GraduationCap size={22} color="var(--primary)" />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Edit Student Profile & Target Goal</h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fca5a5", fontSize: "0.85rem", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Education / Degree *</label>
              <input
                type="text"
                required
                placeholder="e.g. B.Tech Computer Science"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>College / University *</label>
              <input
                type="text"
                required
                placeholder="e.g. IIT Bombay"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Location</label>
              <input
                type="text"
                placeholder="e.g. Mumbai, India / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Graduation Timing (Year)</label>
              <input
                type="number"
                min={2020}
                max={2035}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 700, display: "block", marginBottom: 4 }}>
              Target Career Role (Recalibrates Roadmap & Skill Gaps)
            </label>
            <select
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              className="input-field"
              style={{ fontWeight: 600 }}
            >
              <option value="">Select target role...</option>
              {careerRoles?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.industry || "Technology"})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Learning Availability (hrs/week)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={learningHours}
                onChange={(e) => setLearningHours(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Language Preferences</label>
              <input
                type="text"
                placeholder="e.g. English, Hindi"
                value={preferredLanguages}
                onChange={(e) => setPreferredLanguages(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Opportunity Preferences</label>
            <input
              type="text"
              placeholder="e.g. Full-time, Summer Internship, Remote Hackathons"
              value={opportunityPreferences}
              onChange={(e) => setOpportunityPreferences(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Saving..." : "Save Profile & Refresh Gap Analysis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditEmployeeProfileModal({ isOpen, onClose, profile, careerRoles, onSaved }) {
  const [currentRole, setCurrentRole] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [yearsExperience, setYearsExperience] = useState(2);
  const [targetRoleId, setTargetRoleId] = useState("");
  const [goalMode, setGoalMode] = useState("promotion");
  const [careerChangeIntent, setCareerChangeIntent] = useState("actively_looking");
  const [learningSchedule, setLearningSchedule] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setCurrentRole(profile.current_role || "");
      setCurrentCompany(profile.current_company || "");
      setIndustry(profile.industry || "");
      setYearsExperience(profile.years_experience || 2);
      setTargetRoleId(profile.target_role_id ? String(profile.target_role_id) : "");
      setGoalMode(profile.goal_mode || "promotion");
      setCareerChangeIntent(profile.career_change_intent || "actively_looking");
      setLearningSchedule(profile.learning_schedule || "");
      setCareerGoal(profile.career_goal || "");
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateEmployeeProfile({
        current_role: currentRole.trim(),
        current_company: currentCompany.trim(),
        industry: industry.trim(),
        years_experience: Number(yearsExperience) || 0,
        target_role_id: targetRoleId ? Number(targetRoleId) : undefined,
        goal_mode: goalMode,
        career_change_intent: careerChangeIntent,
        learning_schedule: learningSchedule.trim(),
        career_goal: careerGoal.trim(),
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update professional profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Briefcase size={22} color="var(--primary)" />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Edit Professional Profile & Goals</h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        {/* Privacy Isolation Alert Banner */}
        <div style={{ padding: 12, borderRadius: 10, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <Shield size={18} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong style={{ color: "#34d399" }}>Strict Enterprise Privacy Guarantee:</strong> Your career transition goals, intent, and progress are stored in a private profile partition. Employers, recruiters, sellers, and mentors cannot inspect your goals without your explicit, revocable consent.
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fca5a5", fontSize: "0.85rem", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Current Role / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Operations Analyst"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Current Company / Organization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Accenture Solutions"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Industry Domain</label>
              <input
                type="text"
                placeholder="e.g. Consulting & Enterprise Analytics"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Total Years of Experience</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={50}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 700, display: "block", marginBottom: 4 }}>
                Target Role for Transition / Promotion
              </label>
              <select
                value={targetRoleId}
                onChange={(e) => setTargetRoleId(e.target.value)}
                className="input-field"
                style={{ fontWeight: 600 }}
              >
                <option value="">Select target role...</option>
                {careerRoles?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.industry || "General"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Career Goal Mode</label>
              <select
                value={goalMode}
                onChange={(e) => setGoalMode(e.target.value)}
                className="input-field"
              >
                <option value="promotion">Internal Promotion</option>
                <option value="reskilling">Cross-Disciplinary Reskilling</option>
                <option value="career_switch">Domain Career Switch</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Career Transition Intent</label>
              <select
                value={careerChangeIntent}
                onChange={(e) => setCareerChangeIntent(e.target.value)}
                className="input-field"
              >
                <option value="actively_looking">Actively Looking</option>
                <option value="exploring">Exploring Opportunities</option>
                <option value="open_to_internal_moves">Open to Internal Moves Only</option>
                <option value="not_looking">Not Looking Currently (Upskilling Only)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Learning Schedule Availability</label>
              <input
                type="text"
                placeholder="e.g. Weeknights 8-10 PM & Saturdays (10 hrs/week)"
                value={learningSchedule}
                onChange={(e) => setLearningSchedule(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={13} /> Private Career Goal (Visible ONLY to You)
              </label>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Strictly Confidential</span>
            </div>
            <textarea
              rows={3}
              placeholder="e.g. Transition from ops reporting to lead BI architect with 50% compensation uplift in next annual cycle"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Saving..." : "Save Professional Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddSelfSkillModal({ isOpen, onClose, allSkills, onSaved }) {
  const [skillId, setSkillId] = useState("");
  const [level, setLevel] = useState("beginner");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skillId) {
      setError("Please select a skill");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.addSelfReportedSkill(Number(skillId), level, notes || "Self-reported competency");
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add skill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Add Self-Reported Skill</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: 12, borderRadius: 8, background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 14 }}>
          <strong>Evidence Tier 1 Note:</strong> Self-reported skills register at 50% baseline confidence. They outline candidate capability but require assessment or project proof for verified credentialing.
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fca5a5", fontSize: "0.85rem", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Select Skill *</label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Choose a skill...</option>
              {allSkills?.map((s) => (
                <option key={s.id} value={s.id}>{s.canonical_name} ({s.category || "Technical"})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Claimed Proficiency Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="input-field"
            >
              <option value="beginner">Beginner (Basic understanding)</option>
              <option value="intermediate">Intermediate (Hands-on experience)</option>
              <option value="advanced">Advanced (Production mastery)</option>
              <option value="expert">Expert (Industry authority)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Context / Source Description</label>
            <input
              type="text"
              placeholder="e.g. Self-taught through documentation and personal analytics scripts"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Adding..." : "Add to Evidence"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditEvidenceModal({ isOpen, onClose, evidence, onSaved }) {
  const [level, setLevel] = useState("intermediate");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (evidence) {
      setLevel(evidence.level || "intermediate");
      setNotes(evidence.source_description || "");
    }
  }, [evidence, isOpen]);

  if (!isOpen || !evidence) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateSkillEvidence(evidence.id, {
        level,
        source_description: notes.trim(),
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update evidence");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
            Edit Evidence: {evidence.skill?.canonical_name || "Skill"}
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fca5a5", fontSize: "0.85rem", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Proficiency Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="input-field"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Source Description / Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Updating..." : "Update Evidence"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

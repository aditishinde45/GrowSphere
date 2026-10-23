import React, { useState, useEffect, useRef } from "react";
import {
  FileText, Printer, Download, CheckCircle, Sparkles, Shield,
  Award, ExternalLink, RefreshCw, Eye, Edit3, Check, AlertCircle, Copy,
  ArrowRight, ArrowLeft, ChevronRight, Save, Trash2, FolderOpen,
  Search, Code, Layers, BookOpen, Target, Star, HelpCircle, CheckSquare,
  X, Plus, Zap, AlertTriangle
} from "lucide-react";
import * as api from "./api";

const TARGET_ROLES = [
  "Software Developer",
  "Full-Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer",
  "DevOps Engineer",
  "Product Manager",
  "UI/UX Designer",
];

export default function ResumeBuilder({
  user,
  studentProfile,
  employeeProfile,
  targetRole,
  myEvidence = [],
  onNavigateToRoadmap,
}) {
  // ─── Wizard Step State ───
  // "role_select" | "qa_wizard" | "studio"
  const [step, setStep] = useState("role_select");
  const [selectedRole, setSelectedRole] = useState(
    targetRole?.title || studentProfile?.target_role_title || "Full-Stack Developer"
  );
  const [customRole, setCustomRole] = useState("");

  // ─── Q&A Wizard State ───
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [qaAnswers, setQaAnswers] = useState({});
  const [profileSummary, setProfileSummary] = useState(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [inspectingRepo, setInspectingRepo] = useState(false);
  const [inspectedRepoData, setInspectedRepoData] = useState(null);
  const [repoInspectError, setRepoInspectError] = useState(null);

  // ─── Resume Studio State ───
  const [resumeData, setResumeData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [template, setTemplate] = useState("modern"); // modern | executive | ats_minimal | tech_clean
  const [accentColor, setAccentColor] = useState("#0a66c2");
  const [copied, setCopied] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  // ─── Inline Section Editor State ───
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState("personal");

  // ─── ATS Analyzer Bridge State ───
  const [atsChecking, setAtsChecking] = useState(false);
  const [atsResults, setAtsResults] = useState(null);
  const [atsDrawerOpen, setAtsDrawerOpen] = useState(false);

  // ─── Saved Versions State ───
  const [savedResumes, setSavedResumes] = useState([]);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeSavedId, setActiveSavedId] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // ─── Load Initial Profile Context ───
  useEffect(() => {
    loadProfileContext(selectedRole);
    loadSavedResumesList();
  }, []);

  const loadProfileContext = async (role) => {
    setLoadingContext(true);
    try {
      const res = await api.getResumeBuilderProfileContext(role);
      setProfileSummary(res.profile_summary);
      setQuestions(res.questions || []);
      // Prefill any known links into Q&A answers
      if (res.profile_summary?.contact?.github) {
        setQaAnswers(prev => ({
          ...prev,
          github_repo: prev.github_repo || res.profile_summary.contact.github
        }));
      }
    } catch (err) {
      console.warn("Could not load profile context:", err);
    }
    setLoadingContext(false);
  };

  const loadSavedResumesList = async () => {
    try {
      const list = await api.listSavedResumes();
      setSavedResumes(list || []);
    } catch (err) {
      console.warn("Could not load saved resumes:", err);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    loadProfileContext(role);
  };

  // ─── Start Q&A Wizard ───
  const handleStartWizard = () => {
    const finalRole = selectedRole === "__custom__" ? customRole.trim() : selectedRole;
    if (!finalRole) return;
    setCurrentQIndex(0);
    setStep("qa_wizard");
  };

  // ─── GitHub Repo Inspector ───
  const handleInspectRepo = async () => {
    const url = qaAnswers["github_repo"] || qaAnswers[questions[currentQIndex]?.id];
    if (!url || !url.includes("github.com")) {
      setRepoInspectError("Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)");
      return;
    }
    setRepoInspectError(null);
    setInspectingRepo(true);
    try {
      const data = await api.inspectGitHubRepo(url);
      setInspectedRepoData(data);
    } catch (err) {
      setRepoInspectError(err.message || "Failed to inspect GitHub repository.");
    }
    setInspectingRepo(false);
  };

  const applySuggestedRepoBullets = () => {
    if (!inspectedRepoData) return;
    const bulletsText = inspectedRepoData.suggested_bullets.join("\n- ");
    setQaAnswers(prev => ({
      ...prev,
      project_deepdive: (prev.project_deepdive ? prev.project_deepdive + "\n" : "") + `- ${bulletsText}`
    }));
    notify("Imported GitHub project architecture into your resume answers!");
  };

  // ─── Q&A Navigation ───
  const handleAnswerChange = (val) => {
    const q = questions[currentQIndex];
    if (!q) return;
    setQaAnswers(prev => ({ ...prev, [q.id]: val }));
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setInspectedRepoData(null);
      setRepoInspectError(null);
    } else {
      handleGenerateResume();
    }
  };

  const handleSkipQuestion = () => {
    handleNextQuestion();
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
      setInspectedRepoData(null);
      setRepoInspectError(null);
    }
  };

  // ─── Generate Resume ───
  const handleGenerateResume = async () => {
    const finalRole = selectedRole === "__custom__" ? customRole.trim() : selectedRole;
    setGenerating(true);
    try {
      const res = await api.generateResumeData(finalRole, qaAnswers, template, accentColor);
      setResumeData(res.resume_data);
      setAtsResults({
        ats_score: res.ats_score,
        role_suitability: res.role_suitability,
        matched_keywords: res.matched_keywords,
        missing_keywords: res.missing_keywords,
      });
      setSaveTitle(`${finalRole} Resume (${new Date().toLocaleDateString()})`);
      setStep("studio");
    } catch (err) {
      notify("Failed to generate resume. Please review inputs.");
    }
    setGenerating(false);
  };

  // ─── Quick ATS Analyzer Check ───
  const handleQuickATSCheck = async () => {
    if (!resumeData) return;
    const finalRole = selectedRole === "__custom__" ? customRole.trim() : selectedRole;
    setAtsChecking(true);
    try {
      const result = await api.quickATSCheck(finalRole, resumeData);
      setAtsResults(result);
      setAtsDrawerOpen(true);
      notify(`ATS Readiness: ${result.ats_score}/100 | Role Fit: ${result.role_suitability}%`);
    } catch (err) {
      notify("ATS check failed. Please try again.");
    }
    setAtsChecking(false);
  };

  // ─── Save Resume Version ───
  const handleSaveResume = async () => {
    if (!resumeData) return;
    const finalRole = selectedRole === "__custom__" ? customRole.trim() : selectedRole;
    setSaving(true);
    try {
      const res = await api.saveResumeVersion({
        id: activeSavedId,
        title: saveTitle || `${finalRole} Resume`,
        target_role: finalRole,
        template_id: template,
        accent_color: accentColor,
        resume_data: resumeData,
        qa_answers: qaAnswers,
        ats_score: atsResults?.ats_score,
        role_suitability: atsResults?.role_suitability,
      });
      setActiveSavedId(res.id);
      loadSavedResumesList();
      notify("Resume version saved successfully!");
    } catch (err) {
      notify("Failed to save resume version.");
    }
    setSaving(false);
  };

  const handleLoadSavedResume = async (savedItem) => {
    try {
      const full = await api.getSavedResume(savedItem.id);
      setResumeData(full.resume_data);
      setSelectedRole(full.target_role);
      setTemplate(full.template_id || "modern");
      setAccentColor(full.accent_color || "#0a66c2");
      setQaAnswers(full.qa_answers || {});
      setActiveSavedId(full.id);
      setSaveTitle(full.title);
      setAtsResults({
        ats_score: full.ats_score || 85,
        role_suitability: full.role_suitability || 88,
      });
      setSavedModalOpen(false);
      setStep("studio");
      notify(`Loaded saved resume: "${full.title}"`);
    } catch (err) {
      notify("Could not load saved resume.");
    }
  };

  const handleDeleteSaved = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved resume?")) return;
    try {
      await api.deleteSavedResume(id);
      loadSavedResumesList();
      if (activeSavedId === id) setActiveSavedId(null);
      notify("Saved resume deleted.");
    } catch (err) {
      notify("Failed to delete saved resume.");
    }
  };

  // ─── Export DOCX & Print PDF ───
  const handleDownloadDocx = async () => {
    if (!resumeData) return;
    setDownloadingDocx(true);
    try {
      await api.downloadResumeDocx(resumeData);
      notify("Downloaded ATS-compliant Microsoft Word (.docx) resume!");
    } catch (err) {
      notify("Failed to generate DOCX file.");
    }
    setDownloadingDocx(false);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!resumeData) return;
    const plain = `
${(resumeData.personal_info?.name || "Candidate").toUpperCase()}
${[resumeData.personal_info?.email, resumeData.personal_info?.phone, resumeData.personal_info?.location].filter(Boolean).join(" | ")}
Target Role: ${selectedRole}

PROFESSIONAL SUMMARY
${resumeData.professional_summary || ""}

TECHNICAL SKILLS
${Object.entries(resumeData.technical_skills || {}).map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${Array.isArray(v) ? v.join(', ') : v}`).join("\n")}

PROJECTS
${(resumeData.projects || []).map(p => `• ${p.title} (${p.technologies?.join(', ')}):\n${p.bullets?.map(b => `  - ${b}`).join('\n')}`).join("\n\n")}

EXPERIENCE
${(resumeData.experience || []).map(e => `• ${e.title} at ${e.company} (${e.start_date} - ${e.end_date}):\n${e.bullets?.map(b => `  - ${b}`).join('\n')}`).join("\n\n")}

EDUCATION
${(resumeData.education || []).map(ed => `• ${ed.degree} - ${ed.institution} (${ed.year}) [GPA: ${ed.gpa || 'N/A'}]`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    notify("Copied plaintext resume to clipboard!");
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── STEP 1: ROLE SELECT & PROFILE SCAN ──────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const renderRoleSelect = () => {
    const verifiedCount = (profileSummary?.skills || []).length;
    const coursesCount = (profileSummary?.completed_courses || []).length;

    return (
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 60, height: 60, borderRadius: 20,
            background: "linear-gradient(135deg, #0a66c2 0%, #38bdf8 100%)",
            marginBottom: 16, boxShadow: "0 8px 30px rgba(10, 102, 194, 0.28)"
          }}>
            <Sparkles size={28} style={{ color: "#fff" }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
            AI-Powered ATS Resume Builder
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, maxWidth: 560, marginInline: "auto", lineHeight: 1.6 }}>
            Select your target role. GrowSphere pulls your verified database competencies, education, and learning milestones,
            then guides you through an intelligent Q&A session to compile a role-tailored, ATS-optimized resume.
          </p>
        </div>

        {/* Saved Resumes Quick Access */}
        {savedResumes.length > 0 && (
          <div style={{
            marginBottom: 24, padding: "12px 18px", borderRadius: 14,
            background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FolderOpen size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                You have {savedResumes.length} saved resume version{savedResumes.length > 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={() => setSavedModalOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
            >
              Open Saved Resumes <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Role Selector Grid */}
        <div style={{
          padding: 24, borderRadius: 16, background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)", boxShadow: "var(--card-shadow)", marginBottom: 24
        }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Target size={16} style={{ color: "var(--primary)" }} /> Select Your Target Position
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {TARGET_ROLES.map((r) => (
              <button
                key={r}
                onClick={() => handleRoleSelect(r)}
                style={{
                  padding: "8px 16px", borderRadius: 10,
                  border: `1.5px solid ${selectedRole === r ? "var(--primary)" : "var(--border-subtle)"}`,
                  background: selectedRole === r ? "rgba(10, 102, 194, 0.12)" : "var(--bg-subtle)",
                  color: selectedRole === r ? "var(--primary)" : "var(--text-secondary)",
                  fontSize: 13, fontWeight: selectedRole === r ? 700 : 500, cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => setSelectedRole("__custom__")}
              style={{
                padding: "8px 16px", borderRadius: 10,
                border: `1.5px solid ${selectedRole === "__custom__" ? "var(--primary)" : "var(--border-subtle)"}`,
                background: selectedRole === "__custom__" ? "rgba(10, 102, 194, 0.12)" : "var(--bg-subtle)",
                color: selectedRole === "__custom__" ? "var(--primary)" : "var(--text-secondary)",
                fontSize: 13, fontWeight: 500, cursor: "pointer", fontStyle: "italic"
              }}
            >
              + Other Custom Role
            </button>
          </div>
          {selectedRole === "__custom__" && (
            <input
              type="text"
              placeholder="e.g. Cloud Solutions Architect, Embedded Systems Engineer..."
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="input-field"
              style={{ width: "100%", padding: "10px 14px", fontSize: 13 }}
            />
          )}
        </div>

        {/* Auto-Retrieved Profile Details Box */}
        <div style={{
          padding: 24, borderRadius: 16, background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)", boxShadow: "var(--card-shadow)", marginBottom: 28
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={18} style={{ color: "#34d399" }} /> Auto-Retrieved Profile Data (Verified by GrowSphere)
            </h3>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              No manual re-typing required
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {/* Education Box */}
            <div style={{ padding: 14, borderRadius: 12, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Education</span>
              <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {profileSummary?.education?.degree || "Bachelor of Technology"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                {profileSummary?.education?.college || "University"} • Class of {profileSummary?.education?.graduation_year || 2025}
              </p>
            </div>

            {/* Verified Skills Box */}
            <div style={{ padding: 14, borderRadius: 12, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Competencies</span>
              <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600, color: "#34d399" }}>
                {verifiedCount} Verified Evidence Skills
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {(profileSummary?.skills || ["Python", "SQL", "Git"]).slice(0, 4).map((s) => (
                  <span key={s} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "var(--badge-blue-bg)", color: "var(--badge-blue-text)" }}>
                    {s}
                  </span>
                ))}
                {verifiedCount > 4 && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>+{verifiedCount - 4} more</span>}
              </div>
            </div>

            {/* Courses & Passport */}
            <div style={{ padding: 14, borderRadius: 12, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Credentials & Passport</span>
              <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {profileSummary?.passport ? `Tier ${profileSummary.passport.tier_level} Passport Verified` : "Standard Verified Ledger"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                {coursesCount} Completed Academy Course{coursesCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStartWizard}
          className="btn btn-primary"
          style={{
            width: "100%", padding: "14px", fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "0 6px 24px rgba(10, 102, 194, 0.28)", borderRadius: 12
          }}
        >
          <Sparkles size={18} /> Begin Intelligent Q&A Wizard for {selectedRole === "__custom__" ? customRole || "Target Role" : selectedRole}
        </button>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── STEP 2: CONVERSATIONAL Q&A WIZARD ──────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const renderQAWizard = () => {
    const q = questions[currentQIndex] || {
      id: "project_deepdive",
      label: "Project Architecture",
      prompt: "What key project best showcases your abilities for this role?",
      placeholder: "Describe the architecture and problem solved...",
      field_type: "textarea",
    };
    const progressPct = Math.round(((currentQIndex + 1) / (questions.length || 1)) * 100);
    const currentValue = qaAnswers[q.id] || "";

    return (
      <div style={{ maxWidth: 740, margin: "0 auto" }}>
        {/* Top Progress & Back */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button
            onClick={() => {
              if (currentQIndex === 0) setStep("role_select");
              else handlePrevQuestion();
            }}
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
              Question {currentQIndex + 1} of {questions.length}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>
              ({progressPct}% Complete)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 6, borderRadius: 3, background: "var(--bg-subtle)", overflow: "hidden", marginBottom: 28, border: "1px solid var(--border-subtle)" }}>
          <div style={{
            height: "100%", width: `${progressPct}%`,
            background: "linear-gradient(90deg, #0a66c2, #38bdf8)",
            transition: "width 0.4s ease"
          }} />
        </div>

        {/* Question Card */}
        <div style={{
          padding: 32, borderRadius: 16, background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)", boxShadow: "var(--card-shadow)", marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 8, background: "rgba(10, 102, 194, 0.12)",
              color: "var(--primary)", fontSize: 13, fontWeight: 800
            }}>
              {currentQIndex + 1}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textTransform: "uppercase" }}>
              {q.section || "Project & Experience"}
            </span>
          </div>

          <h3 style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px", lineHeight: 1.4 }}>
            {q.label}
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
            {q.prompt}
          </p>

          {/* GitHub Inspector Input Form */}
          {q.has_inspect && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder={q.placeholder || "https://github.com/owner/repository"}
                  value={currentValue}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, padding: "10px 14px", fontSize: 13 }}
                />
                <button
                  type="button"
                  onClick={handleInspectRepo}
                  disabled={inspectingRepo || !currentValue.trim()}
                  className="btn btn-secondary"
                  style={{ padding: "8px 14px", fontSize: 12, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {inspectingRepo ? <RefreshCw size={14} className="animate-spin" /> : <Code size={14} />}
                  {inspectingRepo ? "Inspecting..." : "Inspect Repo"}
                </button>
              </div>

              {repoInspectError && (
                <p style={{ fontSize: 12, color: "#f87171", margin: "6px 0 0" }}>
                  {repoInspectError}
                </p>
              )}

              {/* Inspected Repo Card */}
              {inspectedRepoData && (
                <div style={{
                  marginTop: 14, padding: 14, borderRadius: 12,
                  background: "var(--badge-blue-bg)", border: "1px solid var(--badge-blue-border)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle size={15} style={{ color: "#34d399" }} />
                      <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>{inspectedRepoData.repo_name}</strong>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({inspectedRepoData.primary_language})</span>
                    </div>
                    {inspectedRepoData.stars > 0 && (
                      <span style={{ fontSize: 11, color: "#fbbf24", display: "flex", alignItems: "center", gap: 2 }}>
                        ★ {inspectedRepoData.stars}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 10px" }}>
                    {inspectedRepoData.description}
                  </p>
                  <button
                    type="button"
                    onClick={applySuggestedRepoBullets}
                    className="btn btn-primary"
                    style={{ fontSize: 11, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Zap size={12} /> Auto-Fill Architecture Bullets
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Standard Text or Textarea */}
          {!q.has_inspect && q.field_type === "textarea" ? (
            <textarea
              rows={4}
              placeholder={q.placeholder}
              value={currentValue}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input-field"
              style={{ width: "100%", padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}
            />
          ) : !q.has_inspect && (
            <input
              type="text"
              placeholder={q.placeholder}
              value={currentValue}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input-field"
              style={{ width: "100%", padding: "10px 14px", fontSize: 13 }}
            />
          )}

          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "12px 0 0", fontStyle: "italic" }}>
            Tip: Be specific with technologies, problem solved, and impact. If not applicable, click "Skip".
          </p>
        </div>

        {/* Wizard Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={handleSkipQuestion}
            className="btn btn-secondary"
            style={{ fontSize: 13, padding: "8px 18px", color: "var(--text-muted)" }}
          >
            Skip this Question
          </button>

          <button
            onClick={handleNextQuestion}
            disabled={generating}
            className="btn btn-primary"
            style={{ fontSize: 14, fontWeight: 700, padding: "10px 24px", display: "flex", alignItems: "center", gap: 8 }}
          >
            {generating ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> Compiling Resume...
              </>
            ) : currentQIndex === questions.length - 1 ? (
              <>
                <Sparkles size={15} /> Generate Role-Tailored Resume
              </>
            ) : (
              <>
                Next Question <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── STEP 3: RESUME STUDIO (PREVIEW + TEMPLATES + ATS BRIDGE) ───────
  // ═════════════════════════════════════════════════════════════════════
  const renderResumeStudio = () => {
    if (!resumeData) return null;
    const p = resumeData.personal_info || {};

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Studio Top Control Bar */}
        <div className="glass-panel" style={{
          padding: "16px 20px", display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 14, border: "1px solid var(--border-subtle)"
        }}>
          {/* Left: Template & Color */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Template:</span>
              {[
                { id: "modern", label: "Modern Technical" },
                { id: "executive", label: "Classic Executive" },
                { id: "ats_minimal", label: "ATS Standard" },
                { id: "tech_clean", label: "Tech Clean" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`btn ${template === t.id ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "5px 10px", fontSize: 11 }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Accent:</span>
              {["#0a66c2", "#057642", "#475569", "#7c3aed", "#d97706"].map((c) => (
                <div
                  key={c}
                  onClick={() => setAccentColor(c)}
                  style={{
                    width: 18, height: 18, borderRadius: "50%", background: c,
                    cursor: "pointer", border: accentColor === c ? "2px solid #fff" : "1px solid transparent",
                    boxShadow: accentColor === c ? "0 0 0 2px var(--border-active)" : "none"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleQuickATSCheck}
              disabled={atsChecking}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Sparkles size={14} style={{ color: "var(--primary)" }} />
              {atsChecking ? "Analyzing..." : "Scan with ATS Analyzer"}
            </button>

            <button
              onClick={() => setEditorOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Edit3 size={14} /> Edit Sections
            </button>

            <button
              onClick={handleSaveResume}
              disabled={saving}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Save size={14} /> {saving ? "Saving..." : "Save Version"}
            </button>

            <button
              onClick={handleDownloadDocx}
              disabled={downloadingDocx}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Download size={14} /> {downloadingDocx ? "Generating..." : "Download DOCX"}
            </button>

            <button
              onClick={handlePrintPDF}
              className="btn btn-primary"
              style={{ fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Printer size={14} /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* ATS Readiness Banner if checked */}
        {atsResults && (
          <div style={{
            padding: "14px 20px", borderRadius: 14,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14,
            boxShadow: "var(--card-shadow)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 22, fontWeight: 800,
                  color: atsResults.ats_score >= 80 ? "#34d399" : atsResults.ats_score >= 60 ? "#fbbf24" : "#f87171"
                }}>
                  {atsResults.ats_score}/100
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>ATS Readiness Score</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Target: {selectedRole}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#38bdf8" }}>
                  {atsResults.role_suitability}%
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Role Fit Index</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Industry Benchmark</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {atsResults.missing_keywords?.length > 0 && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Missing keywords: {atsResults.missing_keywords.slice(0, 3).join(", ")}
                </span>
              )}
              <button
                onClick={() => setAtsDrawerOpen(!atsDrawerOpen)}
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: "5px 10px" }}
              >
                {atsDrawerOpen ? "Hide Breakdown" : "View Full Insights"}
              </button>
            </div>
          </div>
        )}

        {/* ATS Detailed Insights Drawer */}
        {atsDrawerOpen && atsResults && (
          <div style={{
            padding: 20, borderRadius: 14, background: "var(--bg-subtle)",
            border: "1px solid var(--border-subtle)"
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>
              ATS Match Details & Roadmap Recommendations
            </h4>

            {atsResults.roadmap_bridges?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <AlertTriangle size={14} /> Role Skill Gaps Identified:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {atsResults.roadmap_bridges.map((b, i) => (
                    <div key={i} style={{
                      padding: "8px 12px", borderRadius: 8, background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)", display: "flex",
                      justifyContent: "space-between", alignItems: "center", fontSize: 12
                    }}>
                      <span>{b.recommended_action}</span>
                      {onNavigateToRoadmap && (
                        <button
                          onClick={onNavigateToRoadmap}
                          className="btn btn-secondary"
                          style={{ fontSize: 11, padding: "3px 8px", color: "var(--primary)" }}
                        >
                          View Roadmap <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {atsResults.suggestions?.length > 0 && (
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                  Actionable Resume Enhancements:
                </span>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {atsResults.suggestions.slice(0, 4).map((s, i) => (
                    <li key={i}>{typeof s === "string" ? s : s.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ─── LIVE PRINTABLE A4 RESUME CONTAINER ─── */}
        <div style={{ display: "flex", justifyContent: "center", overflowX: "auto", padding: "10px 0" }}>
          <div
            id="printable-resume-paper"
            style={{
              width: "100%",
              maxWidth: 800,
              minHeight: 1040,
              background: "#ffffff",
              color: "#1e293b",
              padding: "48px 56px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
              borderRadius: 6,
              fontFamily: template === "tech_clean" ? "'JetBrains Mono', 'Courier New', monospace" : "'Segoe UI', Arial, sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
          >
            {/* Header: Name & Contact */}
            <div style={{
              textAlign: template === "executive" ? "center" : "left",
              borderBottom: `2.5px solid ${accentColor}`,
              paddingBottom: 14,
              marginBottom: 18,
            }}>
              <h1 style={{
                fontSize: template === "executive" ? 24 : 26,
                fontWeight: 800, color: template === "executive" ? "#0f172a" : accentColor,
                margin: "0 0 6px", letterSpacing: template === "executive" ? "0.05em" : "normal",
                textTransform: template === "executive" ? "uppercase" : "none"
              }}>
                {p.name || "Candidate Name"}
              </h1>
              <div style={{
                fontSize: 11, color: "#475569", display: "flex", flexWrap: "wrap",
                gap: 8, justifyContent: template === "executive" ? "center" : "flex-start",
                alignItems: "center"
              }}>
                {p.email && <span>{p.email}</span>}
                {p.phone && <span>• {p.phone}</span>}
                {p.location && <span>• {p.location}</span>}
                {p.linkedin && <span>• {p.linkedin}</span>}
                {p.github && <span>• {p.github}</span>}
              </div>
            </div>

            {/* Professional Summary */}
            {resumeData.professional_summary && (
              <div style={{ marginBottom: 18 }}>
                <h2 style={{
                  fontSize: 13, fontWeight: 700, textTransform: "uppercase",
                  color: accentColor, letterSpacing: "0.05em", margin: "0 0 6px",
                  borderBottom: "1px solid #e2e8f0", paddingBottom: 3
                }}>
                  Professional Summary
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                  {resumeData.professional_summary}
                </p>
              </div>
            )}

            {/* Technical Skills */}
            {resumeData.technical_skills && (
              <div style={{ marginBottom: 18 }}>
                <h2 style={{
                  fontSize: 13, fontWeight: 700, textTransform: "uppercase",
                  color: accentColor, letterSpacing: "0.05em", margin: "0 0 6px",
                  borderBottom: "1px solid #e2e8f0", paddingBottom: 3
                }}>
                  Technical Skills
                </h2>
                <div style={{ fontSize: 12, color: "#334155" }}>
                  {Object.entries(resumeData.technical_skills).map(([cat, skills]) => (
                    <div key={cat} style={{ marginBottom: 3 }}>
                      <strong style={{ color: "#0f172a" }}>{cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}: </strong>
                      <span>{Array.isArray(skills) ? skills.join(", ") : skills}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resumeData.projects?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h2 style={{
                  fontSize: 13, fontWeight: 700, textTransform: "uppercase",
                  color: accentColor, letterSpacing: "0.05em", margin: "0 0 8px",
                  borderBottom: "1px solid #e2e8f0", paddingBottom: 3
                }}>
                  Technical Projects
                </h2>
                {resumeData.projects.map((proj, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontSize: 13, color: "#0f172a" }}>{proj.title}</strong>
                      {proj.technologies && (
                        <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>
                          {Array.isArray(proj.technologies) ? proj.technologies.join(", ") : proj.technologies}
                        </span>
                      )}
                    </div>
                    {proj.repo_url && (
                      <div style={{ fontSize: 11, color: accentColor, margin: "2px 0 4px" }}>
                        {proj.repo_url}
                      </div>
                    )}
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
                      {(proj.bullets || []).map((b, bIdx) => (
                        <li key={bIdx} style={{ marginBottom: 2 }}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Experience */}
            {resumeData.experience?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h2 style={{
                  fontSize: 13, fontWeight: 700, textTransform: "uppercase",
                  color: accentColor, letterSpacing: "0.05em", margin: "0 0 8px",
                  borderBottom: "1px solid #e2e8f0", paddingBottom: 3
                }}>
                  Work Experience
                </h2>
                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontSize: 13, color: "#0f172a" }}>
                        {exp.title} &mdash; <span style={{ fontWeight: 600 }}>{exp.company}</span>
                      </strong>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {exp.start_date} &ndash; {exp.end_date || "Present"}
                      </span>
                    </div>
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
                      {(exp.bullets || []).map((b, bIdx) => (
                        <li key={bIdx} style={{ marginBottom: 2 }}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {resumeData.education?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h2 style={{
                  fontSize: 13, fontWeight: 700, textTransform: "uppercase",
                  color: accentColor, letterSpacing: "0.05em", margin: "0 0 8px",
                  borderBottom: "1px solid #e2e8f0", paddingBottom: 3
                }}>
                  Education
                </h2>
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontSize: 12.5, color: "#0f172a" }}>
                        {edu.degree} &mdash; {edu.institution}
                      </strong>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{edu.year}</span>
                    </div>
                    {edu.gpa && <div style={{ fontSize: 11, color: "#475569" }}>GPA: {edu.gpa}</div>}
                    {edu.highlights && <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>{edu.highlights}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Certifications & Achievements */}
            {resumeData.certifications?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <h2 style={{
                  fontSize: 13, fontWeight: 700, textTransform: "uppercase",
                  color: accentColor, letterSpacing: "0.05em", margin: "0 0 6px",
                  borderBottom: "1px solid #e2e8f0", paddingBottom: 3
                }}>
                  Certifications & Verified Credentials
                </h2>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#334155" }}>
                  {resumeData.certifications.map((c, idx) => (
                    <li key={idx} style={{ marginBottom: 2 }}>
                      <strong>{c.name}</strong> &mdash; {c.issuer} ({c.date})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Switcher */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <button
            onClick={() => setStep("role_select")}
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: "8px 16px" }}
          >
            ← Change Role / Start Over
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCopyText} className="btn btn-secondary" style={{ fontSize: 12, padding: "8px 16px" }}>
              {copied ? <Check size={14} style={{ color: "#34d399" }} /> : <Copy size={14} />} Copy Plaintext
            </button>
            <button onClick={handleSaveResume} className="btn btn-primary" style={{ fontSize: 12, padding: "8px 18px" }}>
              <Save size={14} /> Save Current Version
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── INLINE SECTION EDITOR MODAL ─────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const renderEditorModal = () => {
    if (!editorOpen || !resumeData) return null;

    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 16
      }}>
        <div style={{
          width: "100%", maxWidth: 780, maxHeight: "90vh", background: "var(--bg-card)",
          borderRadius: 16, border: "1px solid var(--border-subtle)", display: "flex",
          flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}>
          {/* Editor Header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Edit3 size={16} style={{ color: "var(--primary)" }} /> Edit Resume Content
            </h3>
            <button onClick={() => setEditorOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {/* Section Tabs */}
          <div style={{
            display: "flex", gap: 6, padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)",
            overflowX: "auto"
          }}>
            {[
              { id: "personal", label: "Contact Info" },
              { id: "summary", label: "Summary" },
              { id: "skills", label: "Technical Skills" },
              { id: "projects", label: "Projects" },
              { id: "experience", label: "Experience" },
              { id: "education", label: "Education" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveEditTab(tab.id)}
                className={`btn ${activeEditTab === tab.id ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: 12, padding: "5px 12px", whiteSpace: "nowrap" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Editor Body */}
          <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {activeEditTab === "personal" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Full Name</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.name || ""}
                    onChange={(e) => setResumeData(prev => ({ ...prev, personal_info: { ...prev.personal_info, name: e.target.value } }))}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Email</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.email || ""}
                    onChange={(e) => setResumeData(prev => ({ ...prev, personal_info: { ...prev.personal_info, email: e.target.value } }))}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Phone</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.phone || ""}
                    onChange={(e) => setResumeData(prev => ({ ...prev, personal_info: { ...prev.personal_info, phone: e.target.value } }))}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Location</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.location || ""}
                    onChange={(e) => setResumeData(prev => ({ ...prev, personal_info: { ...prev.personal_info, location: e.target.value } }))}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>LinkedIn</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.linkedin || ""}
                    onChange={(e) => setResumeData(prev => ({ ...prev, personal_info: { ...prev.personal_info, linkedin: e.target.value } }))}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>GitHub</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.github || ""}
                    onChange={(e) => setResumeData(prev => ({ ...prev, personal_info: { ...prev.personal_info, github: e.target.value } }))}
                    className="input-field"
                    style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                  />
                </div>
              </div>
            )}

            {activeEditTab === "summary" && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Professional Summary</label>
                <textarea
                  rows={6}
                  value={resumeData.professional_summary || ""}
                  onChange={(e) => setResumeData(prev => ({ ...prev, professional_summary: e.target.value }))}
                  className="input-field"
                  style={{ width: "100%", padding: 10, fontSize: 13, marginTop: 4, lineHeight: 1.6 }}
                />
              </div>
            )}

            {activeEditTab === "skills" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(resumeData.technical_skills || {}).map(([cat, skills]) => (
                  <div key={cat}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                      {cat.replace(/_/g, " ")} (comma separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(skills) ? skills.join(", ") : skills}
                      onChange={(e) => {
                        const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                        setResumeData(prev => ({
                          ...prev,
                          technical_skills: { ...prev.technical_skills, [cat]: arr }
                        }));
                      }}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginTop: 4 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeEditTab === "projects" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {(resumeData.projects || []).map((proj, pIdx) => (
                  <div key={pIdx} style={{ padding: 14, borderRadius: 10, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>Project #{pIdx + 1}</strong>
                      <button
                        onClick={() => {
                          const updated = resumeData.projects.filter((_, idx) => idx !== pIdx);
                          setResumeData(prev => ({ ...prev, projects: updated }));
                        }}
                        style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12 }}
                      >
                        Remove Project
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={proj.title || ""}
                      onChange={(e) => {
                        const copy = [...resumeData.projects];
                        copy[pIdx].title = e.target.value;
                        setResumeData(prev => ({ ...prev, projects: copy }));
                      }}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 13, marginBottom: 8 }}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Bullet Points (one per line):</label>
                    <textarea
                      rows={3}
                      value={(proj.bullets || []).join("\n")}
                      onChange={(e) => {
                        const copy = [...resumeData.projects];
                        copy[pIdx].bullets = e.target.value.split("\n").filter(Boolean);
                        setResumeData(prev => ({ ...prev, projects: copy }));
                      }}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 12, marginTop: 4 }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    setResumeData(prev => ({
                      ...prev,
                      projects: [
                        ...(prev.projects || []),
                        { title: "New Project", technologies: ["React", "Node.js"], bullets: ["Engineered application components."] }
                      ]
                    }));
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: "8px 14px", alignSelf: "flex-start" }}
                >
                  + Add Project
                </button>
              </div>
            )}

            {activeEditTab === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {(resumeData.experience || []).map((exp, eIdx) => (
                  <div key={eIdx} style={{ padding: 14, borderRadius: 10, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>Experience #{eIdx + 1}</strong>
                      <button
                        onClick={() => {
                          const updated = resumeData.experience.filter((_, idx) => idx !== eIdx);
                          setResumeData(prev => ({ ...prev, experience: updated }));
                        }}
                        style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12 }}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder="Job Title"
                        value={exp.title || ""}
                        onChange={(e) => {
                          const copy = [...resumeData.experience];
                          copy[eIdx].title = e.target.value;
                          setResumeData(prev => ({ ...prev, experience: copy }));
                        }}
                        className="input-field"
                        style={{ padding: 8, fontSize: 13 }}
                      />
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={exp.company || ""}
                        onChange={(e) => {
                          const copy = [...resumeData.experience];
                          copy[eIdx].company = e.target.value;
                          setResumeData(prev => ({ ...prev, experience: copy }));
                        }}
                        className="input-field"
                        style={{ padding: 8, fontSize: 13 }}
                      />
                    </div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Bullet Points (one per line):</label>
                    <textarea
                      rows={3}
                      value={(exp.bullets || []).join("\n")}
                      onChange={(e) => {
                        const copy = [...resumeData.experience];
                        copy[eIdx].bullets = e.target.value.split("\n").filter(Boolean);
                        setResumeData(prev => ({ ...prev, experience: copy }));
                      }}
                      className="input-field"
                      style={{ width: "100%", padding: 8, fontSize: 12, marginTop: 4 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor Footer */}
          <div style={{
            padding: "14px 20px", borderTop: "1px solid var(--border-subtle)",
            display: "flex", justifyContent: "flex-end", gap: 10
          }}>
            <button onClick={() => setEditorOpen(false)} className="btn btn-primary" style={{ fontSize: 13, padding: "8px 18px" }}>
              Apply Edits
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── SAVED RESUMES DRAWER / MODAL ────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const renderSavedModal = () => {
    if (!savedModalOpen) return null;

    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 16
      }}>
        <div style={{
          width: "100%", maxWidth: 640, background: "var(--bg-card)",
          borderRadius: 16, border: "1px solid var(--border-subtle)",
          padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <FolderOpen size={18} style={{ color: "var(--primary)" }} /> Saved Role-Specific Resumes
            </h3>
            <button onClick={() => setSavedModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {savedResumes.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>
              No saved resumes yet. Compile and save your first resume to reopen it anytime.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
              {savedResumes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoadSavedResume(item)}
                  style={{
                    padding: "14px 18px", borderRadius: 12,
                    background: activeSavedId === item.id ? "rgba(10, 102, 194, 0.1)" : "var(--bg-subtle)",
                    border: `1px solid ${activeSavedId === item.id ? "var(--primary)" : "var(--border-subtle)"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", transition: "all 0.2s ease"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      Role: {item.target_role} • Saved: {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {item.ats_score && (
                      <span style={{
                        fontSize: 13, fontWeight: 800,
                        color: item.ats_score >= 80 ? "#34d399" : item.ats_score >= 60 ? "#fbbf24" : "#f87171"
                      }}>
                        {item.ats_score} ATS
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDeleteSaved(item.id, e)}
                      style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: 4 }}
                      title="Delete saved resume"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // ─── MAIN RENDER ─────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div style={{ position: "relative" }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, padding: "10px 18px",
          borderRadius: 12, background: "var(--primary)", color: "#fff",
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          zIndex: 2000, display: "flex", alignItems: "center", gap: 8
        }}>
          <CheckCircle size={16} /> {notification}
        </div>
      )}

      {step === "role_select" && renderRoleSelect()}
      {step === "qa_wizard" && renderQAWizard()}
      {step === "studio" && renderResumeStudio()}

      {renderEditorModal()}
      {renderSavedModal()}

      {/* Print CSS for Clean A4 Page Output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-resume-paper, #printable-resume-paper * {
            visibility: visible;
          }
          #printable-resume-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 24px 32px !important;
          }
        }
      `}</style>
    </div>
  );
}

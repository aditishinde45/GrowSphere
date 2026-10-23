import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Upload, Target, TrendingUp, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, ChevronDown, Download, RefreshCw,
  Star, Award, Sparkles, Eye, Clock, BarChart3, Search, FileCheck,
  ArrowRight, Layers, Shield, Zap, BookOpen, Info, ChevronUp,
  Activity, PieChart, History
} from "lucide-react";
import * as api from "./api";

const SUPPORTED_ROLES = [
  "Software Developer", "Full-Stack Developer", "Frontend Developer",
  "Backend Developer", "Data Analyst", "Data Scientist",
  "AI/ML Engineer", "DevOps Engineer", "Cybersecurity Analyst",
  "Product Manager", "UI/UX Designer",
];

// ─── Score Ring Component ─────────────────────────────────────────────
function ScoreRing({ score, size = 140, strokeWidth = 10, label, color, subtitle }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedOffset(circumference - (score / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const getColor = () => {
    if (color) return color;
    if (score >= 80) return "#34d399";
    if (score >= 60) return "#fbbf24";
    if (score >= 40) return "#fb923c";
    return "#f87171";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border-subtle)" strokeWidth={strokeWidth} opacity={0.3} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={getColor()} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </svg>
      <div style={{
        position: "relative", marginTop: -size + 10, height: size - 20,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color: getColor(), lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>/ 100</span>
      </div>
      {label && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 4 }}>{label}</span>}
      {subtitle && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{subtitle}</span>}
    </div>
  );
}

// ─── Category Score Bar ───────────────────────────────────────────────
function CategoryBar({ label, score, weight, icon: Icon }) {
  const getColor = () => {
    if (score >= 80) return "#34d399";
    if (score >= 60) return "#fbbf24";
    if (score >= 40) return "#fb923c";
    return "#f87171";
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {Icon && <Icon size={14} style={{ color: getColor() }} />}
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{weight}% weight</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: getColor() }}>{score}</span>
        </div>
      </div>
      <div style={{
        height: 7, borderRadius: 4, background: "var(--bg-subtle)",
        overflow: "hidden", border: "1px solid var(--border-subtle)"
      }}>
        <div style={{
          height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${getColor()}cc, ${getColor()})`,
          width: `${score}%`, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)"
        }} />
      </div>
    </div>
  );
}

// ─── Keyword Tag ──────────────────────────────────────────────────────
function KeywordTag({ text, variant = "matched" }) {
  const styles = {
    matched: { bg: "var(--accent-success-bg)", border: "var(--accent-success-border)", color: "#34d399", icon: CheckCircle },
    missing: { bg: "var(--accent-danger-bg)", border: "var(--accent-danger-border)", color: "#f87171", icon: XCircle },
    mustHave: { bg: "var(--accent-warning-bg)", border: "var(--accent-warning-border)", color: "#fbbf24", icon: AlertTriangle },
  };
  const s = styles[variant] || styles.matched;
  const IconComp = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: 16, fontSize: 12, fontWeight: 500,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      <IconComp size={11} /> {text}
    </span>
  );
}

// ─── Suggestion Card ──────────────────────────────────────────────────
function SuggestionCard({ suggestion, index }) {
  const [expanded, setExpanded] = useState(false);
  const priorityColors = {
    high: { bg: "var(--accent-danger-bg)", border: "var(--accent-danger-border)", color: "#f87171", label: "High Priority" },
    medium: { bg: "var(--accent-warning-bg)", border: "var(--accent-warning-border)", color: "#fbbf24", label: "Medium" },
    low: { bg: "var(--badge-blue-bg)", border: "var(--badge-blue-border)", color: "#60a5fa", label: "Nice to Have" },
  };
  const p = priorityColors[suggestion.priority] || priorityColors.medium;
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)",
      cursor: "pointer", transition: "all 0.2s",
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 24, height: 24, borderRadius: 8,
            background: p.bg, border: `1px solid ${p.border}`,
            fontSize: 12, fontWeight: 700, color: p.color, flexShrink: 0
          }}>{index + 1}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8,
                background: p.bg, border: `1px solid ${p.border}`, color: p.color, textTransform: "uppercase"
              }}>{p.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 8,
                background: "var(--badge-bg)", color: "var(--text-muted)"
              }}>{suggestion.category}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
              {suggestion.text}
            </p>
          </div>
        </div>
        {suggestion.detail && (expanded ? <ChevronUp size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />)}
      </div>
      {expanded && suggestion.detail && (
        <p style={{
          marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)",
          fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 0, marginLeft: 34,
        }}>{suggestion.detail}</p>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// ─── Main Component ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export default function ATSResumeAnalyzer({ user }) {
  const [view, setView] = useState("upload"); // upload | analyzing | results | history | report
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeReportId, setActiveReportId] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getResumeAnalysisHistory();
      setHistory(data || []);
    } catch {
      // Silently fail — history may not exist yet
    }
    setHistoryLoading(false);
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const validateAndSetFile = (f) => {
    setError(null);
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size: 5MB.");
      return;
    }
    setFile(f);
  };

  const handleAnalyze = async () => {
    const role = targetRole === "__custom__" ? customRole.trim() : targetRole;
    if (!file) { setError("Please select a resume file."); return; }
    if (!role) { setError("Please select or enter a target role."); return; }

    setError(null);
    setView("analyzing");
    setProgress(0);

    // Simulated progress steps
    const steps = [
      { pct: 10, delay: 300 },
      { pct: 25, delay: 600 },
      { pct: 40, delay: 400 },
      { pct: 55, delay: 500 },
      { pct: 70, delay: 400 },
      { pct: 85, delay: 300 },
    ];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay));
      setProgress(step.pct);
    }

    try {
      const result = await api.analyzeResumeFile(file, role);
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setAnalysisResult(result);
      setView("results");
      fetchHistory(); // Refresh history
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
      setView("upload");
    }
  };

  const viewReport = async (id) => {
    setError(null);
    setView("analyzing");
    setProgress(50);
    try {
      const result = await api.getResumeAnalysisReport(id);
      setProgress(100);
      await new Promise(r => setTimeout(r, 300));
      setAnalysisResult(result);
      setActiveReportId(id);
      setView("results");
    } catch (err) {
      setError(err.message || "Could not load report.");
      setView("history");
    }
  };

  const handleReset = () => {
    setFile(null);
    setTargetRole("");
    setCustomRole("");
    setError(null);
    setAnalysisResult(null);
    setView("upload");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generatePDFReport = () => {
    if (!analysisResult) return;
    const r = analysisResult;

    // Build a printable HTML report and trigger print
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const categoryRows = r.category_scores
      ? Object.entries(r.category_scores).map(([key, cat]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${cat.label}</td>
         <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:${cat.score >= 70 ? '#059669' : cat.score >= 50 ? '#d97706' : '#dc2626'}">${cat.score}/100</td>
         <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280">${cat.weight}%</td></tr>`
      ).join("")
      : "";

    const suggestionsHTML = (r.suggestions || []).map((s, i) =>
      `<div style="margin-bottom:8px;padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
          <span style="font-weight:700;font-size:13px;color:${s.priority === 'high' ? '#dc2626' : s.priority === 'medium' ? '#d97706' : '#2563eb'}">#${i + 1} ${(s.priority || '').toUpperCase()}</span>
          <span style="font-size:11px;color:#9ca3af">${s.category || ''}</span>
        </div>
        <p style="margin:0;font-size:13px;color:#1f2937">${s.text}</p>
        ${s.detail ? `<p style="margin:4px 0 0;font-size:11px;color:#6b7280">${s.detail}</p>` : ''}
      </div>`
    ).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>ATS Resume Analysis - ${r.filename || 'Report'}</title>
    <style>
      body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:32px;color:#1f2937;max-width:800px;margin:0 auto}
      h1{font-size:22px;color:#0a66c2;margin-bottom:4px} h2{font-size:16px;color:#374151;margin-top:28px;padding-bottom:6px;border-bottom:2px solid #0a66c2}
      .scores{display:flex;gap:40px;margin:20px 0;text-align:center}
      .score-box{flex:1;padding:20px;background:#f0f9ff;border-radius:12px;border:1px solid #bfdbfe}
      .score-big{font-size:48px;font-weight:800;line-height:1} .score-label{font-size:13px;color:#6b7280;margin-top:6px}
      table{width:100%;border-collapse:collapse;font-size:13px} th{text-align:left;padding:8px 12px;background:#f3f4f6;font-weight:600}
      .tag{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:500;margin:2px}
      .tag-green{background:#d1fae5;color:#065f46} .tag-red{background:#fee2e2;color:#991b1b} .tag-yellow{background:#fef3c7;color:#92400e}
      @media print{body{padding:16px}}
    </style></head><body>
    <h1>ATS Resume Analysis Report</h1>
    <p style="color:#6b7280;font-size:13px;margin-top:0">
      File: <strong>${r.filename || 'N/A'}</strong> | Target Role: <strong>${r.target_role || 'N/A'}</strong> | 
      Date: <strong>${r.created_at ? new Date(r.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</strong>
    </p>
    <div class="scores">
      <div class="score-box">
        <div class="score-big" style="color:${r.ats_score >= 70 ? '#059669' : r.ats_score >= 50 ? '#d97706' : '#dc2626'}">${r.ats_score}</div>
        <div class="score-label">ATS Readiness Score</div>
      </div>
      <div class="score-box">
        <div class="score-big" style="color:${r.role_suitability >= 70 ? '#059669' : r.role_suitability >= 50 ? '#d97706' : '#dc2626'}">${r.role_suitability}%</div>
        <div class="score-label">Role Suitability</div>
      </div>
    </div>
    <p style="font-size:11px;color:#9ca3af;font-style:italic">${r.role_suitability_note || ''}</p>
    <h2>Category Breakdown</h2>
    <table><thead><tr><th>Category</th><th style="text-align:center">Score</th><th style="text-align:center">Weight</th></tr></thead>
    <tbody>${categoryRows}</tbody></table>
    <h2>Skills Detected</h2>
    <p><strong>Technical:</strong> ${(r.technical_skills || []).map(s => `<span class="tag tag-green">${s}</span>`).join(' ') || 'None detected'}</p>
    <p><strong>Soft Skills:</strong> ${(r.soft_skills || []).map(s => `<span class="tag tag-green">${s}</span>`).join(' ') || 'None detected'}</p>
    <h2>Keyword Analysis</h2>
    <p><strong>Matched:</strong> ${(r.matched_keywords || []).map(k => `<span class="tag tag-green">${k}</span>`).join(' ') || 'None'}</p>
    <p><strong>Missing:</strong> ${(r.missing_keywords || []).map(k => `<span class="tag tag-red">${k}</span>`).join(' ') || 'None'}</p>
    ${r.must_have_missing?.length ? `<p><strong>Critical Missing:</strong> ${r.must_have_missing.map(k => `<span class="tag tag-yellow">${k}</span>`).join(' ')}</p>` : ''}
    <h2>Strengths</h2>
    <ul>${(r.strengths || []).map(s => `<li style="margin-bottom:4px;font-size:13px">${s}</li>`).join('')}</ul>
    <h2>Areas for Improvement</h2>
    <ul>${(r.weaknesses || []).map(w => `<li style="margin-bottom:4px;font-size:13px">${w}</li>`).join('')}</ul>
    <h2>Prioritized Suggestions</h2>
    ${suggestionsHTML}
    <h2>Scoring Methodology</h2>
    <p style="font-size:12px;color:#6b7280;line-height:1.6">${r.scoring_methodology || ''}</p>
    <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center;border-top:1px solid #e5e7eb;padding-top:12px">
      Generated by GrowSphere ATS Resume Analyzer &mdash; ${r.factual_integrity_note || ''}
    </p>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
  };

  // ─── UPLOAD VIEW ────────────────────────────────────────────────────
  const renderUploadView = () => (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 64, height: 64, borderRadius: 20,
          background: "linear-gradient(135deg, #0a66c2 0%, #38bdf8 100%)",
          marginBottom: 16, boxShadow: "0 8px 32px rgba(10, 102, 194, 0.3)"
        }}>
          <FileCheck size={32} style={{ color: "#fff" }} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
          ATS Resume Analyzer
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, maxWidth: 520, marginInline: "auto", lineHeight: 1.6 }}>
          Upload your resume and select a target role to receive a comprehensive ATS readiness score, 
          role-suitability assessment, and actionable improvement plan.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: file ? "24px" : "48px 24px",
          borderRadius: 16,
          border: `2px dashed ${dragActive ? "var(--primary)" : file ? "var(--accent-success-border)" : "var(--border-subtle)"}`,
          background: dragActive ? "rgba(10, 102, 194, 0.06)" : file ? "var(--accent-success-bg)" : "var(--bg-subtle)",
          textAlign: "center", cursor: "pointer",
          transition: "all 0.3s ease",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        {file ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "var(--accent-success-bg)", border: "1px solid var(--accent-success-border)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FileText size={22} style={{ color: "#34d399" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{file.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                {(file.size / 1024).toFixed(1)} KB • Click to change file
              </p>
            </div>
            <CheckCircle size={20} style={{ color: "#34d399" }} />
          </div>
        ) : (
          <>
            <Upload size={40} style={{ color: dragActive ? "var(--primary)" : "var(--text-muted)", marginBottom: 12, transition: "color 0.3s" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>
              {dragActive ? "Drop your resume here" : "Drag & drop your resume or click to browse"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              Supports PDF and DOCX • Max 5MB
            </p>
          </>
        )}
      </div>

      {/* Role Selection */}
      <div style={{ marginTop: 24 }}>
        <label style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10
        }}>
          <Target size={16} style={{ color: "var(--primary)" }} />
          Select Target Job Role
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {SUPPORTED_ROLES.map(role => (
            <button
              key={role}
              onClick={() => { setTargetRole(role); setCustomRole(""); }}
              style={{
                padding: "7px 16px", borderRadius: 10, border: `1.5px solid ${targetRole === role ? "var(--primary)" : "var(--border-subtle)"}`,
                background: targetRole === role ? "rgba(10, 102, 194, 0.12)" : "var(--bg-subtle)",
                color: targetRole === role ? "var(--primary)" : "var(--text-secondary)",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {role}
            </button>
          ))}
          <button
            onClick={() => setTargetRole("__custom__")}
            style={{
              padding: "7px 16px", borderRadius: 10,
              border: `1.5px solid ${targetRole === "__custom__" ? "var(--primary)" : "var(--border-subtle)"}`,
              background: targetRole === "__custom__" ? "rgba(10, 102, 194, 0.12)" : "var(--bg-subtle)",
              color: targetRole === "__custom__" ? "var(--primary)" : "var(--text-secondary)",
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontStyle: "italic",
            }}
          >
            + Other Role
          </button>
        </div>
        {targetRole === "__custom__" && (
          <input
            type="text"
            placeholder="Enter your target role (e.g., Cloud Architect)"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: "1.5px solid var(--border-subtle)", background: "var(--input-bg)",
              color: "var(--text-primary)", fontSize: 13, outline: "none",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: "10px 14px", borderRadius: 10,
          background: "var(--accent-danger-bg)", border: "1px solid var(--accent-danger-border)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <AlertTriangle size={16} style={{ color: "#f87171" }} />
          <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!file || (!targetRole || (targetRole === "__custom__" && !customRole.trim()))}
        style={{
          width: "100%", padding: "14px", marginTop: 24, borderRadius: 12,
          border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
          background: (!file || !targetRole) ? "var(--bg-subtle)" : "linear-gradient(135deg, #0a66c2 0%, #38bdf8 100%)",
          color: (!file || !targetRole) ? "var(--text-muted)" : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: (file && targetRole) ? "0 6px 24px rgba(10, 102, 194, 0.3)" : "none",
          transition: "all 0.3s",
        }}
      >
        <Sparkles size={18} /> Analyze Resume
      </button>

      {/* History Quick Access */}
      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <History size={16} style={{ color: "var(--primary)" }} /> Recent Analyses
            </span>
            <button onClick={() => setView("history")} style={{
              background: "none", border: "none", fontSize: 12, color: "var(--primary)",
              cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4
            }}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.slice(0, 3).map((item) => (
              <div key={item.id} onClick={() => viewReport(item.id)} style={{
                padding: "12px 16px", borderRadius: 12,
                background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FileText size={18} style={{ color: "var(--primary)" }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{item.filename}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>
                      {item.target_role} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 16, fontWeight: 800,
                    color: item.ats_score >= 70 ? "#34d399" : item.ats_score >= 50 ? "#fbbf24" : "#f87171"
                  }}>{item.ats_score}</span>
                  <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── ANALYZING VIEW ─────────────────────────────────────────────────
  const renderAnalyzingView = () => (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24, margin: "0 auto 24px",
        background: "linear-gradient(135deg, #0a66c2 0%, #38bdf8 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "pulse 2s ease-in-out infinite",
        boxShadow: "0 8px 32px rgba(10, 102, 194, 0.3)"
      }}>
        <Search size={36} style={{ color: "#fff" }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
        Analyzing Your Resume
      </h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 28px" }}>
        Extracting content, evaluating ATS compatibility, and generating insights...
      </p>

      {/* Progress Bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div style={{
          height: 8, borderRadius: 4, background: "var(--bg-subtle)",
          overflow: "hidden", border: "1px solid var(--border-subtle)"
        }}>
          <div style={{
            height: "100%", borderRadius: 4,
            background: "linear-gradient(90deg, #0a66c2, #38bdf8)",
            width: `${progress}%`,
            transition: "width 0.5s ease-out",
          }} />
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, display: "block" }}>
          {progress}% Complete
        </span>
      </div>

      {/* Progress Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20, textAlign: "left" }}>
        {[
          { label: "Extracting resume text", threshold: 10 },
          { label: "Identifying sections & contact info", threshold: 25 },
          { label: "Detecting skills & keywords", threshold: 40 },
          { label: "Evaluating ATS compatibility", threshold: 55 },
          { label: "Calculating role suitability", threshold: 70 },
          { label: "Generating improvement suggestions", threshold: 85 },
          { label: "Compiling analysis report", threshold: 95 },
        ].map((step) => (
          <div key={step.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            opacity: progress >= step.threshold ? 1 : 0.35,
            transition: "opacity 0.5s"
          }}>
            {progress >= step.threshold ? (
              <CheckCircle size={16} style={{ color: "#34d399" }} />
            ) : (
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "2px solid var(--border-subtle)"
              }} />
            )}
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{step.label}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
    </div>
  );

  // ─── RESULTS VIEW ───────────────────────────────────────────────────
  const renderResultsView = () => {
    if (!analysisResult) return null;
    const r = analysisResult;
    const categoryIcons = {
      keyword_relevance: Search,
      technical_skills: Layers,
      experience_projects: Star,
      education_certs: Award,
      achievements: TrendingUp,
      action_verbs: Zap,
      formatting: BarChart3,
      readability: BookOpen,
    };

    return (
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header with scores */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 24, flexWrap: "wrap", gap: 12
        }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
              Analysis Results
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              {r.filename} • {r.target_role} • {r.word_count || 0} words
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={generatePDFReport} style={{
              padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--border-subtle)",
              background: "var(--bg-subtle)", color: "var(--text-primary)",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}>
              <Download size={14} /> Download PDF
            </button>
            <button onClick={handleReset} style={{
              padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--primary)",
              background: "rgba(10, 102, 194, 0.1)", color: "var(--primary)",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}>
              <RefreshCw size={14} /> New Analysis
            </button>
          </div>
        </div>

        {/* Score Cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28,
        }}>
          {/* ATS Score Card */}
          <div style={{
            padding: "28px 24px", borderRadius: 16,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            boxShadow: "var(--card-shadow)",
          }}>
            <ScoreRing score={r.ats_score} size={150} label="ATS Readiness Score"
              subtitle={r.ats_score >= 80 ? "Excellent" : r.ats_score >= 60 ? "Good" : r.ats_score >= 40 ? "Needs Work" : "Critical"} />
          </div>

          {/* Role Suitability Card */}
          <div style={{
            padding: "28px 24px", borderRadius: 16,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            boxShadow: "var(--card-shadow)",
          }}>
            <ScoreRing score={r.role_suitability} size={150} label="Role Suitability"
              color="#38bdf8"
              subtitle={`for ${r.target_role}`} />
            <p style={{
              fontSize: 10, color: "var(--text-muted)", textAlign: "center",
              margin: "8px 0 0", lineHeight: 1.4, maxWidth: 240, fontStyle: "italic"
            }}>
              This is not a guarantee of passing any company's ATS
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{
          padding: "24px", borderRadius: 16,
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          marginBottom: 20, boxShadow: "var(--card-shadow)",
        }}>
          <h3 style={{
            fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 18px",
            display: "flex", alignItems: "center", gap: 8
          }}>
            <BarChart3 size={18} style={{ color: "var(--primary)" }} /> Category Breakdown
          </h3>
          {r.category_scores && Object.entries(r.category_scores).map(([key, cat]) => (
            <CategoryBar
              key={key}
              label={cat.label}
              score={cat.score}
              weight={cat.weight}
              icon={categoryIcons[key]}
            />
          ))}
        </div>

        {/* Two-column: Keywords & Skills */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Keywords */}
          <div style={{
            padding: "20px", borderRadius: 16,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            boxShadow: "var(--card-shadow)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={16} style={{ color: "var(--primary)" }} /> Keyword Analysis
            </h3>

            {r.must_have_missing?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#fbbf24", margin: "0 0 6px", textTransform: "uppercase" }}>
                  Critical Missing Keywords
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {r.must_have_missing.map(k => <KeywordTag key={k} text={k} variant="mustHave" />)}
                </div>
              </div>
            )}

            {r.matched_keywords?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#34d399", margin: "0 0 6px", textTransform: "uppercase" }}>
                  Matched ({r.matched_keywords.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {r.matched_keywords.map(k => <KeywordTag key={k} text={k} variant="matched" />)}
                </div>
              </div>
            )}

            {r.missing_keywords?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#f87171", margin: "0 0 6px", textTransform: "uppercase" }}>
                  Missing ({r.missing_keywords.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {r.missing_keywords.slice(0, 10).map(k => <KeywordTag key={k} text={k} variant="missing" />)}
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          <div style={{
            padding: "20px", borderRadius: 16,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            boxShadow: "var(--card-shadow)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={16} style={{ color: "var(--primary)" }} /> Skills Detected
            </h3>

            {r.technical_skills?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 6px", textTransform: "uppercase" }}>
                  Technical ({r.technical_skills.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {r.technical_skills.map(s => (
                    <span key={s} style={{
                      padding: "3px 10px", borderRadius: 16, fontSize: 12, fontWeight: 500,
                      background: "var(--badge-blue-bg)", border: "1px solid var(--badge-blue-border)",
                      color: "var(--badge-blue-text)"
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {r.soft_skills?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 6px", textTransform: "uppercase" }}>
                  Soft Skills ({r.soft_skills.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {r.soft_skills.map(s => (
                    <span key={s} style={{
                      padding: "3px 10px", borderRadius: 16, fontSize: 12, fontWeight: 500,
                      background: "var(--badge-purple-bg)", border: "1px solid var(--badge-purple-border)",
                      color: "var(--badge-purple-text)"
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {r.contact_info && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 6px", textTransform: "uppercase" }}>
                  Contact Info Detected
                </p>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {r.contact_info.name && <p style={{ margin: "2px 0" }}>👤 {r.contact_info.name}</p>}
                  {r.contact_info.email && <p style={{ margin: "2px 0" }}>📧 {r.contact_info.email}</p>}
                  {r.contact_info.phone && <p style={{ margin: "2px 0" }}>📱 {r.contact_info.phone}</p>}
                  {r.contact_info.linkedin && <p style={{ margin: "2px 0" }}>🔗 LinkedIn detected</p>}
                  {r.contact_info.github && <p style={{ margin: "2px 0" }}>💻 GitHub detected</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div style={{
            padding: "20px", borderRadius: 16,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            boxShadow: "var(--card-shadow)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#34d399", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={16} /> Strengths
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(r.strengths || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "#34d399", fontSize: 14, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
              {(!r.strengths || r.strengths.length === 0) && (
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>No specific strengths identified.</span>
              )}
            </div>
          </div>

          <div style={{
            padding: "20px", borderRadius: 16,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            boxShadow: "var(--card-shadow)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f87171", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} /> Areas for Improvement
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(r.weaknesses || []).map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "#f87171", fontSize: 14, marginTop: 1 }}>✗</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{w}</span>
                </div>
              ))}
              {(!r.weaknesses || r.weaknesses.length === 0) && (
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>Great job! No major issues found.</span>
              )}
            </div>
          </div>
        </div>

        {/* Prioritized Suggestions */}
        {r.suggestions?.length > 0 && (
          <div style={{
            padding: "24px", borderRadius: 16,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            marginBottom: 20, boxShadow: "var(--card-shadow)",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} style={{ color: "var(--primary)" }} /> Action Plan — Prioritized Suggestions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {r.suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s} index={i} />)}
            </div>
          </div>
        )}

        {/* Bullet Rewrites */}
        {r.bullet_rewrites?.length > 0 && (
          <div style={{
            padding: "24px", borderRadius: 16,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            marginBottom: 20, boxShadow: "var(--card-shadow)",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={18} style={{ color: "#fbbf24" }} /> Bullet Point Improvements
            </h3>
            {r.bullet_rewrites.map((bw, i) => (
              <div key={i} style={{
                padding: "14px 16px", borderRadius: 12, marginBottom: 10,
                background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)"
              }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--text-muted)" }}>Original:</p>
                <p style={{
                  margin: "0 0 10px", fontSize: 13, color: "#f87171", fontStyle: "italic",
                  padding: "8px 12px", background: "var(--accent-danger-bg)", borderRadius: 8,
                  borderLeft: "3px solid #f87171"
                }}>"{bw.original}"</p>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-muted)" }}>Suggestion:</p>
                <p style={{
                  margin: "0 0 6px", fontSize: 13, color: "#34d399",
                  padding: "8px 12px", background: "var(--accent-success-bg)", borderRadius: 8,
                  borderLeft: "3px solid #34d399"
                }}>{bw.suggestion}</p>
                {bw.note && <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>📝 {bw.note}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Scoring Methodology */}
        <div style={{
          padding: "20px", borderRadius: 16,
          background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)",
          marginBottom: 20,
        }}>
          <button
            onClick={() => setExpandedSection(expandedSection === "methodology" ? null : "methodology")}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Info size={16} style={{ color: "var(--primary)" }} /> How Scores Are Calculated
            </span>
            {expandedSection === "methodology" ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
          </button>
          {expandedSection === "methodology" && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 12px" }}>
                {r.scoring_methodology}
              </p>
              {r.role_suitability_note && (
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 8px", fontStyle: "italic" }}>
                  {r.role_suitability_note}
                </p>
              )}
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                {r.factual_integrity_note}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── HISTORY VIEW ───────────────────────────────────────────────────
  const renderHistoryView = () => (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
            Analysis History
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            {history.length} analysis report{history.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setView("upload")} style={{
          padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--primary)",
          background: "rgba(10, 102, 194, 0.1)", color: "var(--primary)",
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <Upload size={14} /> New Upload
        </button>
      </div>

      {historyLoading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, padding: "40px 0" }}>
          Loading history...
        </p>
      ) : history.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px", borderRadius: 16,
          background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)"
        }}>
          <FileText size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>
            No analyses yet
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Upload a resume to get started with your first ATS analysis.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.map((item, idx) => (
            <div key={item.id} onClick={() => viewReport(item.id)} style={{
              padding: "16px 20px", borderRadius: 14,
              background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "var(--card-shadow)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "var(--badge-blue-bg)", border: "1px solid var(--badge-blue-border)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <FileText size={20} style={{ color: "var(--badge-blue-text)" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{item.filename}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                    {item.target_role} • {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 22, fontWeight: 800,
                    color: item.ats_score >= 70 ? "#34d399" : item.ats_score >= 50 ? "#fbbf24" : "#f87171"
                  }}>{item.ats_score}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>ATS</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 22, fontWeight: 800, color: "#38bdf8"
                  }}>{item.role_suitability}%</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Role Fit</div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score Comparison (if 2+ analyses) */}
      {history.length >= 2 && (
        <div style={{
          marginTop: 28, padding: "20px", borderRadius: 16,
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          boxShadow: "var(--card-shadow)",
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} style={{ color: "var(--primary)" }} /> Score Progression
          </h3>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 120 }}>
            {history.slice(0, 10).reverse().map((item, idx) => {
              const height = Math.max(item.ats_score * 1.1, 10);
              return (
                <div key={item.id} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{item.ats_score}</span>
                  <div style={{
                    height, width: "100%", maxWidth: 40, borderRadius: "6px 6px 2px 2px",
                    background: `linear-gradient(180deg, ${item.ats_score >= 70 ? "#34d399" : item.ats_score >= 50 ? "#fbbf24" : "#f87171"}, ${item.ats_score >= 70 ? "#059669" : item.ats_score >= 50 ? "#d97706" : "#dc2626"})`,
                    transition: "height 0.5s"
                  }} />
                  <span style={{ fontSize: 9, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    #{history.length - (history.length - 1 - idx)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Main Render ────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px 0" }}>
      {view === "upload" && renderUploadView()}
      {view === "analyzing" && renderAnalyzingView()}
      {view === "results" && renderResultsView()}
      {view === "history" && renderHistoryView()}
    </div>
  );
}

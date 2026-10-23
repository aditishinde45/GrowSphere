import React, { useState, useEffect } from "react";
import {
  Compass,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  ExternalLink,
  RotateCcw,
  Trash2,
  ChevronRight,
  ChevronDown,
  Target,
  Zap,
  TrendingUp,
  ShieldCheck,
  Code,
  FileCode,
  PlayCircle,
  Plus,
  ArrowLeft,
  Info,
  Check,
} from "lucide-react";
import {
  listUserRoadmaps,
  getRoadmapById,
  validateRoadmapDeadline,
  generatePersonalizedRoadmap,
  toggleRoadmapTask,
  regeneratePersonalizedRoadmap,
  deleteRoadmap,
} from "./api";

const POPULAR_SKILLS = [
  "React & Next.js",
  "Machine Learning & AI",
  "FastAPI & Python Backend",
  "Docker & Kubernetes",
  "Data Structures & Algorithms",
  "PostgreSQL & Database Architecture",
  "Full-Stack Web Development",
  "System Design & Microservices",
  "Cybersecurity Fundamentals",
  "TypeScript",
];

const QUICK_DEADLINES = [
  { label: "3 Days (Crash)", value: "3 days", desc: "High-yield crash pace" },
  { label: "1 Week", value: "1 week", desc: "Intensive 7-day sprint" },
  { label: "2 Weeks", value: "2 weeks", desc: "Short-term focused bootcamp" },
  { label: "4 Weeks", value: "4 weeks", desc: "1 Month accelerated" },
  { label: "8 Weeks (Rec.)", value: "8 weeks", desc: "Recommended realistic mastery" },
  { label: "12 Weeks", value: "12 weeks", desc: "Deep enterprise readiness" },
];

export default function RoadmapHub({ onNotify, user }) {
  // Navigation state: "list" (overview hub) or "details" (single roadmap view)
  const [viewMode, setViewMode] = useState("list");
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Generator Modal state
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [adjustingRoadmapId, setAdjustingRoadmapId] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [currentLevel, setCurrentLevel] = useState("Beginner");
  const [targetLevel, setTargetLevel] = useState("Job-Ready / Advanced");
  const [deadlineInput, setDeadlineInput] = useState("8 weeks");
  const [hoursPerWeek, setHoursPerWeek] = useState(15);
  const [customDeadline, setCustomDeadline] = useState("");

  // Validation feedback state
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [generatorError, setGeneratorError] = useState("");

  // Expanded phases in details view
  const [expandedPhases, setExpandedPhases] = useState({ 1: true, 2: true, 3: true, 4: true });

  // Load user roadmaps on mount
  useEffect(() => {
    fetchRoadmaps();
  }, []);

  // Real-time deadline validation debounce
  useEffect(() => {
    if (!generatorOpen || !skillInput.trim()) {
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(() => {
      runDeadlineValidation();
    }, 400);

    return () => clearTimeout(timer);
  }, [skillInput, currentLevel, targetLevel, deadlineInput, customDeadline, hoursPerWeek, generatorOpen]);

  async function fetchRoadmaps(autoSelectId = null) {
    setLoading(true);
    try {
      const data = await listUserRoadmaps();
      setRoadmaps(Array.isArray(data) ? data : []);

      if (autoSelectId) {
        const found = data.find((r) => r.id === autoSelectId);
        if (found) {
          setSelectedRoadmap(found);
          setViewMode("details");
        }
      } else if (selectedRoadmap) {
        const found = data.find((r) => r.id === selectedRoadmap.id);
        if (found) setSelectedRoadmap(found);
      }
    } catch (err) {
      console.error("Failed to load roadmaps:", err);
      if (onNotify) onNotify("Unable to load saved roadmaps.");
    } finally {
      setLoading(false);
    }
  }

  async function runDeadlineValidation() {
    const effectiveDeadline = customDeadline.trim() || deadlineInput || "4 weeks";
    if (!skillInput.trim()) return;

    setValidating(true);
    try {
      const res = await validateRoadmapDeadline({
        skill_name: skillInput.trim(),
        current_level: currentLevel,
        target_level: targetLevel,
        deadline: effectiveDeadline,
        hours_per_week: Number(hoursPerWeek) || 15,
      });
      setValidationResult(res);
      setGeneratorError("");
    } catch (err) {
      console.warn("Validation error:", err);
    } finally {
      setValidating(false);
    }
  }

  function openGenerator(roadmapToAdjust = null) {
    if (roadmapToAdjust) {
      setAdjustingRoadmapId(roadmapToAdjust.id);
      setSkillInput(roadmapToAdjust.skill_name || "");
      setCurrentLevel(roadmapToAdjust.current_level || "Beginner");
      setTargetLevel(roadmapToAdjust.target_level || "Job-Ready / Advanced");
      setDeadlineInput(roadmapToAdjust.desired_deadline || "8 weeks");
      setHoursPerWeek(roadmapToAdjust.hours_per_week || 15);
      setCustomDeadline("");
    } else {
      setAdjustingRoadmapId(null);
      setSkillInput("");
      setCurrentLevel("Beginner");
      setTargetLevel("Job-Ready / Advanced");
      setDeadlineInput("8 weeks");
      setHoursPerWeek(15);
      setCustomDeadline("");
    }
    setValidationResult(null);
    setGeneratorError("");
    setGeneratorOpen(true);
  }

  async function handleGenerateRoadmap(forceAccelerated = false) {
    if (!skillInput.trim()) {
      setGeneratorError("Please enter or select a skill to learn.");
      return;
    }

    const effectiveDeadline = customDeadline.trim() || deadlineInput || "4 weeks";
    setActionLoading(true);
    setGeneratorError("");

    try {
      const payload = {
        skill_name: skillInput.trim(),
        current_level: currentLevel,
        target_level: targetLevel,
        deadline: effectiveDeadline,
        hours_per_week: Number(hoursPerWeek) || 15,
        force_accelerated: forceAccelerated,
      };

      let newRoadmap;
      if (adjustingRoadmapId) {
        newRoadmap = await regeneratePersonalizedRoadmap(adjustingRoadmapId, payload);
        if (onNotify) onNotify(`Roadmap for "${newRoadmap.skill_name}" successfully adjusted!`);
      } else {
        newRoadmap = await generatePersonalizedRoadmap(payload);
        if (onNotify) onNotify(`AI roadmap for "${newRoadmap.skill_name}" generated & saved!`);
      }

      setGeneratorOpen(false);
      await fetchRoadmaps(newRoadmap.id);
    } catch (err) {
      console.error("Roadmap generation failed:", err);
      // Check if it's an unrealistic deadline rejection
      if (err.message && err.message.includes("UNREALISTIC_DEADLINE")) {
        setGeneratorError("This deadline is not feasible for complete mastery. You can adopt the recommended timeline or choose Accelerated Crash Mode below.");
      } else {
        setGeneratorError(err.message || "Failed to generate roadmap. Please check your inputs.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleTask(taskId, currentlyCompleted) {
    if (!selectedRoadmap) return;
    const targetState = !currentlyCompleted;

    // Optimistic UI update
    const prevRoadmap = { ...selectedRoadmap };
    const updatedCompleted = targetState
      ? [...(selectedRoadmap.completed_tasks || []), taskId]
      : (selectedRoadmap.completed_tasks || []).filter((id) => id !== taskId);

    const totalTasks = selectedRoadmap.learning_plan?.total_tasks_count || 1;
    const newProgress = Math.min(100, Math.round((updatedCompleted.length / totalTasks) * 100));

    setSelectedRoadmap({
      ...selectedRoadmap,
      completed_tasks: updatedCompleted,
      overall_progress: newProgress,
      status: newProgress >= 100 ? "Completed" : selectedRoadmap.is_accelerated ? "Accelerated" : "In Progress",
    });

    try {
      const serverUpdated = await toggleRoadmapTask(selectedRoadmap.id, taskId, targetState);
      setSelectedRoadmap(serverUpdated);
      // Also update in list
      setRoadmaps((prev) => prev.map((r) => (r.id === serverUpdated.id ? serverUpdated : r)));
      if (targetState && onNotify) {
        if (newProgress >= 100) {
          onNotify(`🏆 Congratulations! You have completed 100% of the ${selectedRoadmap.skill_name} roadmap!`);
        } else {
          onNotify(`Task marked complete! Progress: ${newProgress}%`);
        }
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
      setSelectedRoadmap(prevRoadmap); // Rollback
      if (onNotify) onNotify("Failed to update task progress.");
    }
  }

  async function handleDeleteRoadmap(roadmapId, e) {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this learning roadmap? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteRoadmap(roadmapId);
      if (onNotify) onNotify("Roadmap deleted.");
      if (selectedRoadmap?.id === roadmapId) {
        setSelectedRoadmap(null);
        setViewMode("list");
      }
      fetchRoadmaps();
    } catch (err) {
      console.error("Failed to delete roadmap:", err);
      if (onNotify) onNotify("Failed to delete roadmap.");
    }
  }

  function togglePhaseAccordion(phaseId) {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: DETAILS VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (viewMode === "details" && selectedRoadmap) {
    const plan = selectedRoadmap.learning_plan || {};
    const phases = plan.phases || [];
    const completedSet = new Set(selectedRoadmap.completed_tasks || []);
    const isCompleted = selectedRoadmap.overall_progress >= 100;
    const validation = selectedRoadmap.deadline_validation || {};

    return (
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Navigation Breadcrumb / Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <button
            onClick={() => setViewMode("list")}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", padding: "8px 16px" }}
          >
            <ArrowLeft size={16} /> Back to All Roadmaps
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => openGenerator(selectedRoadmap)}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}
            >
              <RotateCcw size={15} /> Adjust Timeline / Regenerate
            </button>
            <button
              onClick={(e) => handleDeleteRoadmap(selectedRoadmap.id, e)}
              className="btn btn-secondary"
              style={{ color: "var(--accent-danger)", padding: "8px 12px" }}
              title="Delete this roadmap"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Roadmap Hero Card */}
        <div
          className="glass-panel"
          style={{
            padding: 28,
            borderRadius: 16,
            background: "var(--hero-bg)",
            border: "1px solid var(--border-subtle)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle background glow */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: selectedRoadmap.is_accelerated
                ? "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div style={{ flex: "1 1 500px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: selectedRoadmap.is_accelerated
                      ? "var(--badge-amber-bg)"
                      : "var(--badge-blue-bg)",
                    color: selectedRoadmap.is_accelerated ? "var(--badge-amber-text)" : "var(--badge-blue-text)",
                    border: `1px solid ${selectedRoadmap.is_accelerated ? "var(--badge-amber-border)" : "var(--badge-blue-border)"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {selectedRoadmap.is_accelerated ? <Zap size={13} /> : <Compass size={13} />}
                  {selectedRoadmap.is_accelerated ? "ACCELERATED CRASH COURSE" : "FULL MASTERY ROADMAP"}
                </span>

                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: isCompleted ? "var(--accent-success-bg)" : "var(--badge-indigo-bg)",
                    color: isCompleted ? "var(--accent-emerald)" : "var(--badge-indigo-text)",
                    border: `1px solid ${isCompleted ? "var(--accent-success-border)" : "var(--badge-indigo-border)"}`,
                  }}
                >
                  {selectedRoadmap.status || "In Progress"}
                </span>

                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Saved on {new Date(selectedRoadmap.created_at).toLocaleDateString()}
                </span>
              </div>

              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", margin: "8px 0" }}>
                {selectedRoadmap.skill_name}
              </h1>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6, maxWidth: 780 }}>
                {selectedRoadmap.description || "Structured, curriculum-aligned personalized roadmap generated by GrowSphere AI."}
              </p>

              {/* Badges / Metrics Row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text-secondary)", background: "var(--bg-subtle)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                  <Target size={15} color="var(--primary)" />
                  <span>Level: <strong>{selectedRoadmap.current_level}</strong> ➔ <strong>{selectedRoadmap.target_level}</strong></span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text-secondary)", background: "var(--bg-subtle)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                  <Calendar size={15} color="var(--accent-emerald)" />
                  <span>Duration: <strong>{selectedRoadmap.estimated_duration || "4 Weeks"}</strong></span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text-secondary)", background: "var(--bg-subtle)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                  <Clock size={15} color="var(--accent-warning)" />
                  <span>Commitment: <strong>{selectedRoadmap.hours_per_week || 15} hrs/week</strong></span>
                </div>
              </div>
            </div>

            {/* Circular / Progress Metric Card */}
            <div
              style={{
                flex: "0 0 240px",
                padding: 20,
                borderRadius: 14,
                background: "var(--hero-box-bg)",
                border: "1px solid var(--border-subtle)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Overall Progress
              </div>
              <div style={{ fontSize: "2.75rem", fontWeight: 900, color: isCompleted ? "var(--accent-emerald)" : "var(--primary)", lineHeight: 1 }}>
                {Math.round(selectedRoadmap.overall_progress || 0)}%
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 6 }}>
                {completedSet.size} of {plan.total_tasks_count || 5} Tasks Done
              </div>

              {/* Progress bar */}
              <div style={{ width: "100%", height: 8, background: "var(--badge-bg)", border: "1px solid var(--border-subtle)", borderRadius: 4, marginTop: 14, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, selectedRoadmap.overall_progress || 0)}%`,
                    height: "100%",
                    background: isCompleted ? "linear-gradient(90deg, #10b981, #34d399)" : "var(--primary)",
                    borderRadius: 4,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Validation / Scope Context Banner */}
        {selectedRoadmap.is_accelerated && validation.accelerated_scope_summary && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <Zap size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
              <strong style={{ color: "#f59e0b" }}>Accelerated Mode Scope Transparency:</strong>{" "}
              {validation.accelerated_scope_summary}
              <div style={{ marginTop: 4, color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                Want complete deep architectural mastery instead? Click <strong>Adjust Timeline / Regenerate</strong> above and select an extended timeline.
              </div>
            </div>
          </div>
        )}

        {/* Phase-wise Learning Plan Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
              <Layers size={20} color="var(--primary)" />
              Curriculum & Phase Breakdown
            </h2>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Check off tasks as you complete them to track live progress
            </span>
          </div>

          {phases.map((phase) => {
            const isExpanded = expandedPhases[phase.phase_id] !== false;
            const phaseTasks = phase.tasks || [];
            const phaseCompletedCount = phaseTasks.filter((t) => completedSet.has(t.id)).length;
            const phaseProgress = phaseTasks.length > 0 ? Math.round((phaseCompletedCount / phaseTasks.length) * 100) : 0;
            const isPhaseDone = phaseProgress === 100 && phaseTasks.length > 0;

            return (
              <div
                key={phase.phase_id}
                className="glass-panel"
                style={{
                  borderRadius: 14,
                  border: isPhaseDone ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-subtle)",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Phase Accordion Header */}
                <div
                  onClick={() => togglePhaseAccordion(phase.phase_id)}
                  style={{
                    padding: "18px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    background: isPhaseDone ? "rgba(16, 185, 129, 0.05)" : "rgba(255,255,255,0.02)",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isPhaseDone ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.15)",
                        color: isPhaseDone ? "#10b981" : "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                      }}
                    >
                      {isPhaseDone ? <Check size={18} /> : phase.phase_id}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                          {phase.title}
                        </h3>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {phase.duration}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                        {phase.objective}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ textAlign: "right", fontSize: "0.78rem" }}>
                      <span style={{ fontWeight: 700, color: isPhaseDone ? "#34d399" : "var(--text-secondary)" }}>
                        {phaseCompletedCount} / {phaseTasks.length} Completed
                      </span>
                      <div style={{ width: 100, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, marginTop: 4 }}>
                        <div
                          style={{
                            width: `${phaseProgress}%`,
                            height: "100%",
                            background: isPhaseDone ? "#10b981" : "var(--primary)",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>

                    {isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Phase Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: "8px 24px 24px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    {/* Phase Milestone Callout */}
                    {phase.milestone && (
                      <div
                        style={{
                          margin: "16px 0",
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "rgba(59, 130, 246, 0.05)",
                          borderLeft: "3px solid var(--primary)",
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Award size={16} color="var(--primary)" />
                        <span><strong>Phase Milestone Target:</strong> {phase.milestone}</span>
                      </div>
                    )}

                    {/* Phase Tasks List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      {phaseTasks.map((task) => {
                        const isTaskDone = completedSet.has(task.id);

                        return (
                          <div
                            key={task.id}
                            style={{
                              padding: 18,
                              borderRadius: 12,
                              background: isTaskDone ? "rgba(16, 185, 129, 0.03)" : "rgba(255,255,255,0.02)",
                              border: isTaskDone ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid var(--border-subtle)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {/* Task Title & Interactive Checkbox */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <button
                                  onClick={() => handleToggleTask(task.id, isTaskDone)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    marginTop: 2,
                                    color: isTaskDone ? "#10b981" : "var(--text-muted)",
                                    transition: "transform 0.15s ease",
                                  }}
                                  title={isTaskDone ? "Mark as in-progress" : "Mark as completed"}
                                >
                                  {isTaskDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                </button>

                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span
                                      style={{
                                        fontSize: "0.98rem",
                                        fontWeight: 700,
                                        color: isTaskDone ? "var(--text-muted)" : "var(--text-primary)",
                                        textDecoration: isTaskDone ? "line-through" : "none",
                                      }}
                                    >
                                      {task.title}
                                    </span>
                                    <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--text-secondary)" }}>
                                      {task.unit} · ~{task.estimated_hours}h study
                                    </span>
                                  </div>

                                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "6px 0 10px 0", lineHeight: 1.5 }}>
                                    {task.description}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleToggleTask(task.id, isTaskDone)}
                                className={isTaskDone ? "btn btn-secondary" : "btn btn-primary"}
                                style={{
                                  padding: "6px 14px",
                                  fontSize: "0.78rem",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                {isTaskDone ? (
                                  <>
                                    <Check size={14} /> Completed
                                  </>
                                ) : (
                                  "Mark Complete"
                                )}
                              </button>
                            </div>

                            {/* Learning Objectives */}
                            {task.learning_objectives && task.learning_objectives.length > 0 && (
                              <div style={{ marginTop: 12, paddingLeft: 34 }}>
                                <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                                  Learning Objectives:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                                  {task.learning_objectives.map((obj, i) => (
                                    <li key={i} style={{ marginBottom: 2 }}>{obj}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Practical Exercises */}
                            {task.practical_exercises && task.practical_exercises.length > 0 && (
                              <div style={{ marginTop: 14, paddingLeft: 34 }}>
                                <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                                  <Code size={13} color="var(--primary)" />
                                  Practical Hands-On Assignment:
                                </div>
                                {task.practical_exercises.map((ex, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      padding: 12,
                                      borderRadius: 8,
                                      background: "var(--bg-subtle)",
                                      border: "1px solid var(--border-subtle)",
                                      fontSize: "0.82rem",
                                    }}
                                  >
                                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{ex.title}</div>
                                    <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>{ex.instructions}</div>
                                    <div style={{ marginTop: 6, color: "var(--accent-cyan)", fontSize: "0.78rem" }}>
                                      📦 <strong>Deliverable:</strong> {ex.deliverable} (~{ex.estimated_minutes} mins)
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Recommended Courses from Catalog */}
                            {task.recommended_courses && task.recommended_courses.length > 0 && (
                              <div style={{ marginTop: 14, paddingLeft: 34 }}>
                                <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                  <BookOpen size={13} color="var(--accent-emerald)" />
                                  Recommended Genuine Courses from Catalog:
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                                  {task.recommended_courses.map((course, cIdx) => (
                                    <div
                                      key={cIdx}
                                      style={{
                                        padding: 10,
                                        borderRadius: 8,
                                        background: "var(--bg-subtle)",
                                        border: "1px solid var(--border-subtle)",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                          <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "var(--badge-blue-bg)", color: "var(--badge-blue-text)", border: "1px solid var(--badge-blue-border)" }}>
                                            {course.platform}
                                          </span>
                                          {course.rating && (
                                            <span style={{ fontSize: "0.72rem", color: "var(--accent-warning)", fontWeight: 700 }}>
                                              ★ {course.rating}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                                          {course.title}
                                        </div>
                                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                                          {course.institution} · {course.level}
                                        </div>
                                      </div>

                                      <a
                                        href={course.url || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          marginTop: 8,
                                          fontSize: "0.75rem",
                                          color: "var(--primary)",
                                          textDecoration: "none",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                          fontWeight: 600,
                                        }}
                                      >
                                        Launch Course <ExternalLink size={12} />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Assessment Details */}
                            {task.assessment && (
                              <div style={{ marginTop: 12, paddingLeft: 34 }}>
                                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                  <ShieldCheck size={14} color="#818cf8" />
                                  <span>Assessment Checkpoint: <strong>{task.assessment.title}</strong> ({task.assessment.type} · Pass: {task.assessment.pass_threshold})</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: LIST VIEW (OVERVIEW HUB)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero Header */}
      <div
        className="glass-panel"
        style={{
          padding: 28,
          borderRadius: 16,
          background: "var(--hero-bg)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ maxWidth: 740 }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px 0" }}>
            Personalized AI Learning Roadmaps
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
            Select any target skill, specify your current proficiency level, and provide your available timeline.
            Our AI validates feasibility, guards against unachievable commitments, and crafts a structured roadmap
            matched directly with verified courses from our catalog.
          </p>
        </div>

        <button
          onClick={() => openGenerator()}
          className="btn btn-primary"
          style={{
            padding: "12px 24px",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(10, 102, 194, 0.35)",
          }}
        >
          <Plus size={18} /> Create New Roadmap
        </button>
      </div>

      {/* Quick Summary Metric Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Saved Roadmaps
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
            {roadmaps.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
            Persisted to your account
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Active Learning Paths
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--primary)", marginTop: 4 }}>
            {roadmaps.filter((r) => r.status !== "Completed").length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
            Currently in progress
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Completed Roadmaps
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981", marginTop: 4 }}>
            {roadmaps.filter((r) => r.status === "Completed" || r.overall_progress >= 100).length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
            100% milestone achievement
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Catalog Integration
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>
            1,540+
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
            Real courses analyzed
          </div>
        </div>
      </div>

      {/* Roadmaps List Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Compass size={18} color="var(--primary)" />
            Your Learning Roadmaps ({roadmaps.length})
          </h2>
        </div>

        {loading ? (
          <div className="glass-panel" style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
            <div className="spinner" style={{ margin: "0 auto 12px auto" }} />
            Loading your personalized roadmaps...
          </div>
        ) : roadmaps.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: 48,
              textAlign: "center",
              borderRadius: 16,
              border: "1px dashed var(--border-subtle)",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.1)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <Compass size={32} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              No Learning Roadmaps Yet
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", maxWidth: 460, margin: "0 auto 20px auto" }}>
              Ready to learn a new skill? Tell our AI what you want to master, your current proficiency,
              and your deadline. We'll generate a structured roadmap with real courses and hands-on exercises.
            </p>
            <button
              onClick={() => openGenerator()}
              className="btn btn-primary"
              style={{ padding: "10px 22px", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> Generate Your First Roadmap
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
            {roadmaps.map((r) => {
              const completedCount = (r.completed_tasks || []).length;
              const totalTasks = r.learning_plan?.total_tasks_count || 5;
              const isDone = r.overall_progress >= 100 || r.status === "Completed";

              return (
                <div
                  key={r.id}
                  className="glass-panel"
                  style={{
                    padding: 22,
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                    border: isDone ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-subtle)",
                    position: "relative",
                  }}
                >
                  <div>
                    {/* Header Badges */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: r.is_accelerated ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                          color: r.is_accelerated ? "#f59e0b" : "#60a5fa",
                        }}
                      >
                        {r.is_accelerated ? "⚡ ACCELERATED" : "COMPREHENSIVE"}
                      </span>

                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: isDone ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.06)",
                          color: isDone ? "#34d399" : "var(--text-secondary)",
                        }}
                      >
                        {r.status || "In Progress"}
                      </span>
                    </div>

                    {/* Skill Title */}
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 8px 0" }}>
                      {r.skill_name}
                    </h3>

                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <Target size={14} color="var(--primary)" />
                      <span>{r.current_level} ➔ {r.target_level}</span>
                    </div>

                    {/* Timeline & Commitment */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={13} />
                        <span>{r.estimated_duration || "4 Weeks"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={13} />
                        <span>{r.hours_per_week || 15} hrs/wk</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Explore Button */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Completion</span>
                      <span style={{ fontWeight: 700, color: isDone ? "#34d399" : "var(--primary)" }}>
                        {Math.round(r.overall_progress || 0)}% ({completedCount}/{totalTasks})
                      </span>
                    </div>

                    <div style={{ width: "100%", height: 6, background: "var(--badge-bg)", border: "1px solid var(--border-subtle)", borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
                      <div
                        style={{
                          width: `${Math.min(100, r.overall_progress || 0)}%`,
                          height: "100%",
                          background: isDone ? "var(--accent-emerald)" : "var(--primary)",
                          borderRadius: 3,
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => {
                          setSelectedRoadmap(r);
                          setViewMode("details");
                        }}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: "9px 16px",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          fontWeight: 700,
                        }}
                      >
                        Explore Roadmap <ArrowRight size={14} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteRoadmap(r.id, e)}
                        className="btn btn-secondary"
                        style={{ padding: "9px 12px", color: "var(--text-muted)" }}
                        title="Delete roadmap"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          AI ROADMAP GENERATOR / ADJUSTMENT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {generatorOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              borderRadius: 18,
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--primary)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
                  <Sparkles size={14} />
                  {adjustingRoadmapId ? "Adjust Existing Roadmap" : "AI Learning Roadmap Generator"}
                </div>
                <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0 0" }}>
                  {adjustingRoadmapId ? `Adjust Timeline for ${skillInput}` : "What skill do you want to master?"}
                </h2>
              </div>

              <button
                onClick={() => setGeneratorOpen(false)}
                className="btn btn-secondary"
                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
              >
                ✕
              </button>
            </div>

            {/* Error Callout */}
            {generatorError && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  color: "#f43f5e",
                  fontSize: "0.85rem",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>{generatorError}</div>
              </div>
            )}

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Target Skill Input */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Target Skill Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning, React, Docker, FastAPI, System Design..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "0.95rem",
                  }}
                />

                {/* Popular Skill Suggestion Chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {POPULAR_SKILLS.slice(0, 6).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setSkillInput(skill)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: "0.74rem",
                        background: skillInput === skill ? "var(--primary)" : "rgba(255,255,255,0.04)",
                        color: skillInput === skill ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Proficiency Level */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Your Current Proficiency Level
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { id: "Beginner", label: "Beginner", sub: "Starting from scratch" },
                    { id: "Intermediate", label: "Intermediate", sub: "Know basics, need depth" },
                    { id: "Advanced", label: "Advanced", sub: "Mastery & principal level" },
                  ].map((lvl) => {
                    const isSelected = currentLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setCurrentLevel(lvl.id)}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          textAlign: "left",
                          background: isSelected ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.03)",
                          border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          color: "var(--text-primary)",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isSelected ? "var(--primary)" : "var(--text-primary)" }}>
                          {lvl.label}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                          {lvl.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Level */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Target Proficiency Goal
                </label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="Job-Ready / Advanced">Job-Ready / Production Grade (Recommended)</option>
                  <option value="Operational Foundations">Operational Foundations (Working Knowledge)</option>
                  <option value="Principal / Staff Mastery">Principal / Staff Mastery (Deep System Design)</option>
                </select>
              </div>

              {/* Available Timeline / Deadline */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Desired Deadline or Learning Timeline
                </label>

                {/* Quick Timeline Chips */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 }}>
                  {QUICK_DEADLINES.map((qd) => {
                    const isSelected = deadlineInput === qd.value && !customDeadline;
                    return (
                      <button
                        key={qd.value}
                        type="button"
                        onClick={() => {
                          setDeadlineInput(qd.value);
                          setCustomDeadline("");
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          fontSize: "0.78rem",
                          background: isSelected ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.03)",
                          border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                          color: isSelected ? "var(--primary)" : "var(--text-primary)",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{qd.label}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{qd.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date or Phrase */}
                <input
                  type="text"
                  placeholder="Or enter custom deadline (e.g. '3 days', '6 weeks', '2026-12-15')"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              {/* Weekly Study Commitment Hours */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                    Available Study Time Per Week
                  </label>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>
                    {hoursPerWeek} Hours / Week
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--primary)" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                  <span>5h (Casual)</span>
                  <span>15h (Balanced)</span>
                  <span>30h (Full-time)</span>
                  <span>40h (Intensive)</span>
                </div>
              </div>

              {/* ─── INTELLIGENT DEADLINE VALIDATION CARD ─── */}
              {skillInput.trim().length >= 2 && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: validating
                      ? "rgba(255,255,255,0.02)"
                      : validationResult?.is_feasible
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(244, 63, 94, 0.08)",
                    border: validating
                      ? "1px solid var(--border-subtle)"
                      : validationResult?.is_feasible
                      ? "1px solid rgba(16, 185, 129, 0.3)"
                      : "1px solid rgba(244, 63, 94, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {validating ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      <div className="spinner" style={{ width: 14, height: 14 }} />
                      AI evaluating timeline feasibility...
                    </div>
                  ) : validationResult ? (
                    <div>
                      {/* Feasibility Status Badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: validationResult.is_feasible ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                            color: validationResult.is_feasible ? "#34d399" : "#fb7185",
                          }}
                        >
                          {validationResult.status.toUpperCase()} TIMELINE
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          Complexity: <strong>{validationResult.complexity}</strong>
                        </span>
                      </div>

                      {/* Explanation Message */}
                      <p style={{ fontSize: "0.84rem", color: "var(--text-primary)", margin: "4px 0 10px 0", lineHeight: 1.5 }}>
                        {validationResult.message}
                      </p>

                      {/* Metrics: Hours Needed vs Available */}
                      <div style={{ display: "flex", gap: 14, fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                        <span>Required Effort: <strong>~{validationResult.estimated_total_hours}h</strong></span>
                        <span>Available in Window: <strong>~{validationResult.available_hours}h</strong></span>
                      </div>

                      {/* If Unrealistic: Offer 2 Concrete Choices */}
                      {!validationResult.is_feasible && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: 12,
                            borderRadius: 8,
                            background: "var(--badge-amber-bg)",
                            border: "1px solid var(--badge-amber-border)",
                          }}
                        >
                          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--badge-amber-text)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                            <Info size={14} /> Recommended Action:
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {/* Choice A: Adopt Recommended Timeline */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeadlineInput(`${validationResult.suggested_duration_weeks} weeks`);
                                setCustomDeadline("");
                              }}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--primary)",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>Adopt Recommended: <strong>{validationResult.suggested_timeline_text}</strong></span>
                              <ArrowRight size={14} />
                            </button>

                            {/* Choice B: Generate Accelerated Crash Course */}
                            <button
                              type="button"
                              onClick={() => handleGenerateRoadmap(true)}
                              disabled={actionLoading}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                                background: "var(--bg-surface)",
                                border: "1px solid var(--badge-amber-border)",
                                color: "var(--badge-amber-text)",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>Generate Accelerated Crash Roadmap (Essentials 80/20 Only)</span>
                              <Zap size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setGeneratorOpen(false)}
                className="btn btn-secondary"
                style={{ padding: "10px 18px", fontSize: "0.88rem" }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleGenerateRoadmap(false)}
                disabled={actionLoading || !skillInput.trim()}
                className="btn btn-primary"
                style={{
                  padding: "10px 22px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14 }} />
                    Generating Roadmap...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {adjustingRoadmapId ? "Update & Regenerate" : "Generate Roadmap"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

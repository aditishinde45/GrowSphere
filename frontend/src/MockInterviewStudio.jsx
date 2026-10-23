import React, { useState, useEffect, useRef } from "react";
import * as api from "./api";
import {
  Video, VideoOff, Mic, MicOff, Clock, Sparkles, Award,
  ChevronRight, RefreshCw, AlertTriangle, CheckCircle2,
  DollarSign, ArrowRight, Play, Check, Volume2, VolumeX,
  FileText, Upload, Compass, History, Zap, Shield, User,
  MessageSquare, BarChart2, BookOpen, Layers, Lightbulb, ChevronDown, ChevronUp
} from "lucide-react";

export default function MockInterviewStudio({
  user,
  targetRole,
  onOpenWallet,
  creditBalance,
  onInterviewComplete,
}) {
  // Navigation tabs: "setup", "interview", "diagnostic", "history"
  const [activeTab, setActiveTab] = useState("setup");

  // Pre-interview profiling configuration
  const [selectedRole, setSelectedRole] = useState(targetRole?.title || "Data Analyst");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [experienceLevel, setExperienceLevel] = useState("Mid-Level");
  const [resumeText, setResumeText] = useState("");
  const [interviewMode, setInterviewMode] = useState("voice"); // "voice" or "text_rubric"
  const [planPreview, setPlanPreview] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Active Session State
  const [session, setSession] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Voice Interaction & Media State
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [userTranscriptLive, setUserTranscriptLive] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [manualTextMode, setManualTextMode] = useState(false);
  const [manualAnswerText, setManualAnswerText] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [expandedExemplar, setExpandedExemplar] = useState({});

  // Media Refs
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);

  // Load past history on tab switch
  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getMockInterviewHistory();
      setHistoryList(data || []);
    } catch (err) {
      console.warn("Failed to load interview history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopListening();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Text-to-Speech (TTS) Voice Synthesis
  const speakText = (text, onEndCallback) => {
    if (ttsMuted || !synthRef.current) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.02;

      // Select natural voice if available
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Daniel")) && v.lang.startsWith("en")
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setAiSpeaking(true);
      utterance.onend = () => {
        setAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = () => {
        setAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      };

      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setAiSpeaking(false);
      if (onEndCallback) onEndCallback();
    }
  };

  // Speech-to-Text (STT) Speech Recognition
  const startListening = () => {
    if (!micEnabled) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser; fallback to manual input.");
      setManualTextMode(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserTranscriptLive(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error === "not-allowed") {
          setMicEnabled(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    }
  };

  // Camera toggle handler
  const toggleCamera = async () => {
    if (cameraEnabled) {
      stopCamera();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
      } catch (err) {
        console.warn("Camera access denied or unavailable; using fallback avatar.", err);
        setCameraEnabled(true); // simulated feed state
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  };

  // Preview Interview Plan
  const handlePreviewPlan = async () => {
    setGeneratingPlan(true);
    setError(null);
    try {
      const plan = await api.getVoiceInterviewPlan({
        target_role: selectedRole,
        duration_minutes: durationMinutes,
        experience_level: experienceLevel,
        resume_text: resumeText.trim() || undefined,
      });
      setPlanPreview(plan);
    } catch (err) {
      setError(err.message || "Failed to generate interview plan preview.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Start Live Interview Session
  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    setEvaluation(null);
    setCurrentIdx(0);
    setElapsedSeconds(0);
    setDialogueHistory([]);
    setUserTranscriptLive("");
    setManualAnswerText("");

    try {
      const res = await api.startMockInterview({
        target_role: selectedRole,
        interview_mode: interviewMode,
        duration_minutes: durationMinutes,
        experience_level: experienceLevel,
        resume_text: resumeText.trim() || undefined,
      });

      setSession(res);
      setActiveTab("interview");
      setTimerActive(true);

      const openingGreeting = res.greeting || `Welcome! I'm Dr. Aris. Let's begin our session for ${selectedRole}.`;
      setDialogueHistory([
        {
          speaker: "ai",
          text: openingGreeting,
          timestamp: 0,
        },
      ]);

      // Speak warm introduction and start listening once finished
      speakText(openingGreeting, () => {
        if (interviewMode === "voice") {
          startListening();
        }
      });
    } catch (err) {
      setError(err.message || "Failed to initialize interview. Please verify you have at least 10 credits.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Spoken Verbal Answer
  const handleSendTurn = async () => {
    const textToSend = (manualTextMode ? manualAnswerText : userTranscriptLive).trim();
    if (!textToSend || !session) return;

    stopListening();
    if (synthRef.current) synthRef.current.cancel();

    // Optimistically update conversation history
    const userTurn = {
      speaker: "user",
      text: textToSend,
      timestamp: elapsedSeconds,
      questionIndex: currentIdx,
    };
    const updatedHistory = [...dialogueHistory, userTurn];
    setDialogueHistory(updatedHistory);
    setUserTranscriptLive("");
    setManualAnswerText("");

    try {
      const turnRes = await api.sendVoiceTurn(session.id || session.session_id, {
        user_spoken_text: textToSend,
        elapsed_seconds: elapsedSeconds,
        question_index: currentIdx,
        is_final_turn: currentIdx >= (session.questions?.length || 1) - 1,
      });

      setLiveMetrics(turnRes.live_metrics);

      const aiTurn = {
        speaker: "ai",
        text: turnRes.ai_response_text,
        timestamp: elapsedSeconds,
        isFollowup: turnRes.is_followup,
        questionIndex: turnRes.next_question_index,
      };
      setDialogueHistory([...updatedHistory, aiTurn]);

      if (turnRes.is_session_complete) {
        // Complete the session
        speakText(turnRes.ai_response_text, () => {
          handleFinalizeSession();
        });
      } else {
        // Advance question index or maintain for follow-up probe
        setCurrentIdx(turnRes.next_question_index);
        speakText(turnRes.ai_response_text, () => {
          if (interviewMode === "voice") {
            startListening();
          }
        });
      }
    } catch (err) {
      setError(err.message || "Failed to process turn. Please try speaking again.");
    }
  };

  // Finalize Session and Load Diagnostics
  const handleFinalizeSession = async () => {
    if (!session) return;
    setTimerActive(false);
    stopListening();
    stopCamera();
    if (synthRef.current) synthRef.current.cancel();
    setFinalizing(true);
    setError(null);

    try {
      const report = await api.finalizeVoiceInterview(session.id || session.session_id, {
        elapsed_seconds: elapsedSeconds,
        final_transcript: dialogueHistory,
      });

      setEvaluation(report);
      setActiveTab("diagnostic");
      if (onInterviewComplete) onInterviewComplete();
    } catch (err) {
      setError(err.message || "Failed to generate comprehensive diagnostic report.");
    } finally {
      setFinalizing(false);
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = session?.questions?.[currentIdx];
  const totalSessionSeconds = (session?.duration_minutes || durationMinutes) * 60;
  const timeRemainingSeconds = Math.max(0, totalSessionSeconds - elapsedSeconds);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Studio Header Card */}
      <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              <Clock size={14} /> 10 Credits / Mock Session
            </span>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "2px 0 6px 0", color: "var(--text-primary)" }}>
            AI Voice Mock Interview Studio
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
            Engage in a fluid, natural voice conversation with AI Tech Lead Dr. Aris. Evaluates technical depth, STAR methodology, and real-time trade-offs.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ padding: "8px 14px", borderRadius: 10, background: "var(--badge-bg)", border: "1px solid var(--border-subtle)", textAlign: "right" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Your Balance</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
              {creditBalance?.balance ?? 50} Credits
            </div>
          </div>
          <button onClick={onOpenWallet} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "8px 14px" }}>
            <DollarSign size={14} /> Top Up
          </button>
          {activeTab !== "interview" && (
            <button
              onClick={() => setActiveTab(activeTab === "history" ? "setup" : "history")}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "8px 14px" }}
            >
              <History size={14} /> {activeTab === "history" ? "New Interview" : "Session History"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, borderRadius: 10, background: "var(--accent-danger-bg)", border: "1px solid var(--accent-danger-border)", color: "var(--accent-danger-text)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── TAB 1: PRE-INTERVIEW SETUP & PROFILING ─── */}
      {activeTab === "setup" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {/* Left Column: Role, Experience & Resume Profiler */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Compass size={18} style={{ color: "var(--accent-cyan)" }} /> Step 1: Candidate Profiling & Goals
            </h3>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Target Job Role
              </label>
              <input
                type="text"
                className="input-field"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                placeholder="e.g. Data Analyst, Senior Backend Engineer, AI Specialist"
              />
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {["Data Analyst", "Full Stack Engineer", "Machine Learning Engineer", "DevOps & Cloud"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSelectedRole(preset)}
                    style={{
                      background: selectedRole === preset ? "var(--primary)" : "var(--badge-bg)",
                      color: selectedRole === preset ? "#fff" : "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      padding: "3px 8px",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Interview Duration
                </label>
                <select
                  className="input-field"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                >
                  <option value={5}>5 min (Rapid Blitz)</option>
                  <option value={10}>10 min (Focused Screening)</option>
                  <option value={15}>15 min (Standard Technical)</option>
                  <option value={30}>30 min (In-Depth Architecture)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Target Seniority
                </label>
                <select
                  className="input-field"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="Entry-Level">Entry-Level / Intern</option>
                  <option value="Junior">Junior Engineer</option>
                  <option value="Mid-Level">Mid-Level Professional</option>
                  <option value="Senior">Senior Engineer</option>
                  <option value="Staff/Lead">Staff / Principal Lead</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  Resume Text or Project Summary (Optional)
                </label>
                <span style={{ fontSize: "0.72rem", color: "var(--accent-cyan)" }}>
                  Paste text for deep personalization
                </span>
              </div>
              <textarea
                className="input-field"
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste key bullet points from your resume, past projects (e.g. built microservices with Python, optimized SQL queries by 40%), or technical tools..."
                style={{ resize: "vertical", fontSize: "0.82rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handlePreviewPlan}
                disabled={generatingPlan}
                className="btn btn-secondary"
                style={{ flex: 1, padding: "10px 14px", fontSize: "0.85rem" }}
              >
                {generatingPlan ? <RefreshCw size={14} className="animate-spin" /> : <Layers size={14} />}
                Generate Custom Plan
              </button>
              <button
                onClick={handleStartSession}
                disabled={loading}
                className="btn btn-primary"
                style={{ flex: 1.2, padding: "10px 16px", fontSize: "0.88rem" }}
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={16} />}
                Start 10-Credit Interview
              </button>
            </div>
          </div>

          {/* Right Column: AI Interview Plan Preview & Candidate Snapshot */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={18} style={{ color: "var(--accent-emerald)" }} /> Step 2: Adaptive Interview Plan
            </h3>

            {planPreview ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--badge-bg)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>
                    Candidate Summary Profile
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {planPreview.candidate_summary?.user_name} · {planPreview.experience_level}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 4 }}>
                    Flagship Project: <strong>{planPreview.candidate_summary?.flagship_project}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {planPreview.candidate_summary?.verified_skills?.map((s, idx) => (
                      <span key={idx} className="badge badge-verified" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                    Time-Budgeted Session Agenda ({planPreview.duration_minutes} Mins)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {planPreview.agenda?.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: "0.82rem",
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--text-primary)" }}>Phase {idx + 1}: {item.phase}</strong>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{item.focus}</div>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                          {item.duration_mins}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--accent-cyan)" }}>AI Opening Script Preview:</strong>
                  <p style={{ margin: "4px 0 0 0", fontStyle: "italic", fontSize: "0.8rem" }}>
                    "{planPreview.greeting?.slice(0, 160)}..."
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                <Compass size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, margin: "0 0 4px 0" }}>
                  Plan Not Generated Yet
                </p>
                <p style={{ fontSize: "0.8rem", maxWidth: 300, margin: 0 }}>
                  Click "Generate Custom Plan" to preview your tailored questions, or click "Start Interview" to jump straight into voice mode.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: REAL-TIME VOICE INTERVIEW ROOM ─── */}
      {activeTab === "interview" && session && (
        <div className="glass-panel animate-fade-in" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Session HUD Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="badge badge-verified" style={{ background: "var(--accent-danger-bg)", color: "var(--accent-danger)", border: "1px solid var(--accent-danger-border)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-danger)", display: "inline-block" }} /> LIVE VOICE SESSION
              </span>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", color: "var(--text-primary)" }}>
                {formatTimer(elapsedSeconds)} / {session.duration_minutes || 15}:00
              </span>
              {timeRemainingSeconds <= 120 && (
                <span style={{ fontSize: "0.75rem", color: "var(--accent-warning)", fontWeight: 700 }}>
                  ⚠️ Wrapping up soon
                </span>
              )}
            </div>

            {/* Agenda progress indicators */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {session.questions?.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: idx === currentIdx ? "var(--primary)" : idx < currentIdx ? "var(--accent-success-bg)" : "var(--badge-bg)",
                    color: idx === currentIdx ? "#fff" : idx < currentIdx ? "var(--accent-emerald)" : "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  Q{idx + 1}: {q.skill_tested ? q.skill_tested.slice(0, 14) : `Topic ${idx + 1}`}
                </div>
              ))}
            </div>

            {/* Control buttons */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setTtsMuted(!ttsMuted)}
                className="btn btn-secondary"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                title={ttsMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              >
                {ttsMuted ? <VolumeX size={15} style={{ color: "var(--accent-danger)" }} /> : <Volume2 size={15} style={{ color: "var(--accent-emerald)" }} />}
                {ttsMuted ? "Muted" : "Voice On"}
              </button>
              <button
                onClick={toggleCamera}
                className={`btn ${cameraEnabled ? "btn-secondary" : "btn-primary"}`}
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              >
                {cameraEnabled ? <VideoOff size={15} /> : <Video size={15} />}
                {cameraEnabled ? "Stop Camera" : "Turn On Camera"}
              </button>
              <button
                onClick={handleFinalizeSession}
                disabled={finalizing}
                className="btn"
                style={{ padding: "6px 14px", fontSize: "0.8rem", background: "var(--accent-danger-bg)", color: "var(--accent-danger)", border: "1px solid var(--accent-danger-border)" }}
              >
                {finalizing ? <RefreshCw size={14} className="animate-spin" /> : <Award size={14} />}
                End & Get Diagnostic Report
              </button>
            </div>
          </div>

          {/* Central Voice Arena */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
            {/* Left Box: Pulsing Voice Orb Visualizer & Spoken State */}
            <div
              style={{
                borderRadius: 16,
                background: "var(--voice-arena-bg)",
                border: "1px solid var(--border-subtle)",
                padding: 30,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Optional Camera PiP feed */}
              {cameraEnabled && (
                <div style={{ position: "absolute", top: 16, right: 16, width: 130, height: 95, borderRadius: 10, overflow: "hidden", border: "2px solid var(--primary)", background: "#000", zIndex: 10 }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              {/* Status Pill */}
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  background: aiSpeaking
                    ? "rgba(56, 189, 248, 0.15)"
                    : isListening
                    ? "rgba(52, 211, 153, 0.15)"
                    : "rgba(255, 255, 255, 0.08)",
                  color: aiSpeaking
                    ? "var(--accent-cyan)"
                    : isListening
                    ? "var(--accent-emerald)"
                    : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 30,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: aiSpeaking ? "var(--accent-cyan)" : isListening ? "var(--accent-emerald)" : "var(--text-muted)",
                  }}
                />
                {aiSpeaking ? "AI Technical Lead is Speaking..." : isListening ? "Listening to your answer..." : "Paused / Ready"}
              </div>

              {/* Central Glowing Fluid Voice Orb */}
              <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0" }}>
                {aiSpeaking && (
                  <>
                    <div className="voice-orb-ripple" />
                    <div className="voice-orb-ripple voice-orb-ripple-delayed" />
                  </>
                )}
                {isListening && (
                  <div className="voice-orb-ripple" style={{ borderColor: "rgba(52, 211, 153, 0.5)" }} />
                )}

                <div
                  className={aiSpeaking ? "voice-orb-ai" : isListening ? "voice-orb-user" : ""}
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    background: aiSpeaking
                      ? "radial-gradient(circle, #38bdf8 0%, #0284c7 60%, #0f172a 100%)"
                      : isListening
                      ? "radial-gradient(circle, #34d399 0%, #059669 60%, #0f172a 100%)"
                      : "radial-gradient(circle, #64748b 0%, #334155 60%, #0f172a 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 35px rgba(56, 189, 248, 0.35)",
                    transition: "all 0.4s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (isListening) stopListening();
                    else startListening();
                  }}
                  title={isListening ? "Click to Pause Mic" : "Click to Speak"}
                >
                  {aiSpeaking ? (
                    <Volume2 size={36} color="#fff" />
                  ) : isListening ? (
                    <Mic size={36} color="#fff" />
                  ) : (
                    <MicOff size={36} color="#94a3b8" />
                  )}
                </div>
              </div>

              {/* Audio Equalizer Waveform Bars */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, height: 42, margin: "20px 0 10px 0" }}>
                {[12, 24, 36, 18, 30, 42, 22, 16, 28, 38, 20, 14].map((h, i) => (
                  <div
                    key={i}
                    className="audio-bar"
                    style={{
                      height: (aiSpeaking || isListening) ? `${h}px` : "6px",
                      opacity: (aiSpeaking || isListening) ? 0.9 : 0.3,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              {/* Current Question or Follow-up banner */}
              <div style={{ marginTop: 14, textAlign: "center", maxWidth: 460 }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-cyan)", fontWeight: 700, marginBottom: 4 }}>
                  Current Topic: {currentQuestion?.skill_tested || "Core Competency"}
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  "{currentQuestion?.question}"
                </div>
              </div>

              {/* Replay Question Button */}
              <button
                onClick={() => speakText(currentQuestion?.question)}
                className="btn btn-secondary"
                style={{ marginTop: 16, fontSize: "0.75rem", padding: "4px 12px" }}
              >
                <Volume2 size={13} /> Replay Question Audio
              </button>
            </div>

            {/* Right Box: Live Speech Stream & Input Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Turn-by-Turn Dialogue History Drawer */}
              <div
                style={{
                  borderRadius: 14,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  padding: 16,
                  height: 280,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                  Live Dialogue Stream
                </div>
                {dialogueHistory.map((d, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: d.speaker === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: d.speaker === "user" ? "var(--accent-emerald)" : "var(--accent-cyan)",
                        fontWeight: 700,
                        marginBottom: 2,
                      }}
                    >
                      {d.speaker === "user" ? `${user?.full_name || "You"} (Candidate)` : "Dr. Aris (AI Lead)"}
                      {d.isFollowup && " · Probing Follow-Up"}
                    </div>
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        maxWidth: "85%",
                        fontSize: "0.82rem",
                        lineHeight: 1.4,
                        background: d.speaker === "user" ? "rgba(52, 211, 153, 0.12)" : "var(--badge-bg)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {d.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Candidate Voice Transcription / Text Area */}
              <div style={{ borderRadius: 14, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: isListening ? "var(--accent-emerald)" : "var(--text-muted)" }} />
                    {manualTextMode ? "Type Your Answer" : "Your Spoken Transcript"}
                  </div>
                  <button
                    onClick={() => setManualTextMode(!manualTextMode)}
                    style={{ background: "none", border: "none", color: "var(--accent-cyan)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {manualTextMode ? "Switch to Voice Mic" : "Type Answer Instead"}
                  </button>
                </div>

                {manualTextMode ? (
                  <textarea
                    className="input-field"
                    rows={3}
                    value={manualAnswerText}
                    onChange={(e) => setManualAnswerText(e.target.value)}
                    placeholder="Structure your answer using the STAR method: Situation, Task, Action taken, Result achieved..."
                    style={{ resize: "vertical", fontSize: "0.85rem" }}
                  />
                ) : (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "var(--input-bg)",
                      border: "1px solid var(--border-subtle)",
                      minHeight: 70,
                      fontSize: "0.85rem",
                      color: userTranscriptLive ? "var(--text-primary)" : "var(--text-muted)",
                      fontStyle: userTranscriptLive ? "normal" : "italic",
                    }}
                  >
                    {userTranscriptLive || (isListening ? "Listening... Speak your technical explanation clearly." : "Mic idle. Click 'Start Speaking' or toggle above.")}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!manualTextMode && (
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`btn ${isListening ? "btn-secondary" : "btn-primary"}`}
                        style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                      >
                        {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                        {isListening ? "Pause Mic" : "Start Speaking"}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleSendTurn}
                    disabled={manualTextMode ? !manualAnswerText.trim() : !userTranscriptLive.trim()}
                    className="btn btn-primary"
                    style={{ padding: "6px 16px", fontSize: "0.82rem" }}
                  >
                    Send Answer <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: COMPREHENSIVE PERFORMANCE DIAGNOSTIC REPORT ─── */}
      {activeTab === "diagnostic" && evaluation && (
        <div className="glass-panel animate-fade-in" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24, border: "1px solid var(--accent-success-border)" }}>
          {/* Diagnostic Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span className="badge badge-verified" style={{ marginBottom: 6 }}>
                OFFICIAL 5-PILLAR DIAGNOSTIC SCORECARD
              </span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0" }}>
                Interview Assessment Complete
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                Role: <strong>{selectedRole}</strong> · Evaluated by Dr. Aris against industry senior engineering benchmarks.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "center", padding: "10px 20px", borderRadius: 12, background: "var(--accent-success-bg)", border: "1px solid var(--accent-success-border)" }}>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--accent-emerald)", fontWeight: 700 }}>Overall Score</div>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
                  {Math.round((evaluation.overall_score || 0.88) * 100)}%
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {evaluation.competency_status || "Senior / Principal Ready"}
                </div>
              </div>

              <button
                onClick={() => setActiveTab("setup")}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "0.85rem" }}
              >
                Start Another Session
              </button>
            </div>
          </div>

          {/* 5-Pillar Scorecard Grid */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart2 size={16} style={{ color: "var(--accent-cyan)" }} /> 5 Core Competency Evaluation Pillars
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { label: "Technical Knowledge", score: evaluation.pillar_scores?.technical_knowledge || 88 },
                { label: "Communication & Clarity", score: evaluation.pillar_scores?.communication_articulation || 92 },
                { label: "Relevance & Conciseness", score: evaluation.pillar_scores?.relevance_conciseness || 85 },
                { label: "Confidence & Fluency", score: evaluation.pillar_scores?.confidence_fluency || 86 },
                { label: "Problem Solving (STAR)", score: evaluation.pillar_scores?.problem_solving || 90 },
              ].map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                    <span>{p.label}</span>
                    <span style={{ color: p.score >= 80 ? "var(--accent-emerald)" : "var(--accent-warning)" }}>{p.score}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--badge-bg)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${p.score}%`,
                        background: p.score >= 80 ? "linear-gradient(90deg, #38bdf8, #34d399)" : "linear-gradient(90deg, #fbbf24, #f87171)",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Growth Areas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            <div style={{ padding: 18, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <CheckCircle2 size={16} /> Key Strengths Demonstrated
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 8 }}>
                {evaluation.strengths?.map((s, idx) => (
                  <li key={idx}><strong>{s}</strong></li>
                ))}
              </ul>
            </div>

            <div style={{ padding: 18, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-danger-text)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <AlertTriangle size={16} /> Areas for Technical Improvement
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 8 }}>
                {evaluation.weaknesses?.map((w, idx) => (
                  <li key={idx}><strong>{w}</strong></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Question-by-Question Deep Dive with Principal Engineer Exemplars */}
          <div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Award size={18} style={{ color: "var(--primary-accent)" }} /> Turn-by-Turn Review & Senior Engineer Exemplars
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {evaluation.question_reviews?.map((qReview, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 12,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--accent-cyan)", fontWeight: 700 }}>
                        Question {idx + 1} · {qReview.skill_tested}
                      </span>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                        {qReview.question}
                      </div>
                    </div>
                    <span className="badge badge-verified" style={{ fontSize: "0.75rem" }}>
                      Score: {Math.round((qReview.score || 0.85) * 100)}%
                    </span>
                  </div>

                  <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>Your Spoken Answer:</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", marginTop: 2, fontStyle: "italic", background: "var(--input-bg)", padding: 10, borderRadius: 6 }}>
                        "{qReview.candidate_answer}"
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-emerald)" }}>Dr. Aris Feedback:</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
                        {qReview.evaluator_critique}
                      </div>
                    </div>

                    {/* Collapsible Principal Engineer Model Exemplar */}
                    <div style={{ marginTop: 6 }}>
                      <button
                        onClick={() =>
                          setExpandedExemplar((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        style={{
                          background: "rgba(56, 189, 248, 0.08)",
                          border: "1px solid rgba(56, 189, 248, 0.25)",
                          color: "var(--accent-cyan)",
                          borderRadius: 6,
                          padding: "6px 12px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        <Lightbulb size={14} />
                        {expandedExemplar[idx] ? "Hide Principal Engineer Model Answer" : "How a Principal Engineer Would Answer This"}
                        {expandedExemplar[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {expandedExemplar[idx] && (
                        <div
                          className="animate-fade-in"
                          style={{
                            marginTop: 10,
                            padding: 14,
                            borderRadius: 8,
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: "0.82rem",
                            lineHeight: 1.5,
                            color: "var(--text-primary)",
                          }}
                        >
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {qReview.principal_engineer_exemplar}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Targeted Preparation Roadmap */}
          <div style={{ padding: 18, borderRadius: 12, background: "rgba(56, 189, 248, 0.06)", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={16} /> Targeted Preparation Roadmap
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 8 }}>
              {evaluation.roadmap_recommendations?.map((r, idx) => (
                <div key={idx} style={{ padding: 12, borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>{r.topic}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 4 }}>{r.reason}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 600, marginTop: 6 }}>
                    → {r.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SESSION HISTORY ARCHIVE ─── */}
      {activeTab === "history" && (
        <div className="glass-panel animate-fade-in" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <History size={18} style={{ color: "var(--accent-cyan)" }} /> Past Voice Interview Sessions
            </h3>
            <button onClick={() => setActiveTab("setup")} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
              Start New Interview
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <RefreshCw size={24} className="animate-spin" />
              <p style={{ marginTop: 8, fontSize: "0.85rem" }}>Loading past interviews...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <History size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600 }}>No mock interviews recorded yet</p>
              <p style={{ fontSize: "0.8rem" }}>Complete your first voice session to unlock personalized diagnostics.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {historyList.map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: 10,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {h.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                      Mode: {h.interview_mode || "Voice Mode"} · Duration: {h.duration_minutes || 15} mins · {h.created_at ? new Date(h.created_at).toLocaleDateString() : "Recent"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Score</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: (h.overall_score || 0.85) >= 0.75 ? "var(--accent-emerald)" : "var(--accent-warning)" }}>
                        {Math.round((h.overall_score || 0.85) * 100)}%
                      </div>
                    </div>
                    {h.feedback_report && (
                      <button
                        onClick={() => {
                          setEvaluation(h.feedback_report);
                          setSelectedRole(h.title.split(" ")[0]);
                          setActiveTab("diagnostic");
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                      >
                        View Report
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

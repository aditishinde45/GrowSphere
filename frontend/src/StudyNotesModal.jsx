import React, { useState } from "react";
import {
  BookOpen, Sparkles, CheckCircle2, ChevronRight, ChevronLeft,
  Copy, Download, Check, Award, AlertCircle, FileText, Layers, X
} from "lucide-react";

export default function StudyNotesModal({
  isOpen,
  onClose,
  topic,
  materials,
  onTakeAssessment,
}) {
  const [activeTab, setActiveTab] = useState("notes"); // notes | flashcards | cheat_sheet | quiz
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  if (!isOpen || !topic) return null;

  const notesContent = materials?.study_notes || materials?.notes || (
    `### Key Concepts: ${topic.title}\n\n` +
    `Mastering **${topic.title}** is an essential prerequisite for verified career readiness in ${topic.skill?.canonical_name || "Data Analysis"}.\n\n` +
    `**Core Production Principles:**\n` +
    `1. Focus on operational correctness and determinism.\n` +
    `2. Benchmark latency and resource utilization under peak data volume.\n` +
    `3. Handle nulls, missing schema attributes, and anomalous inputs gracefully.\n\n` +
    `**Industry Best Practice:**\n` +
    `Always write regression tests before promoting queries or pipeline logic to production environments.`
  );

  const flashcards = materials?.flashcards || [
    {
      front: `What is the primary role of ${topic.title} in real-world pipelines?`,
      back: `It provides standardized, reproducible transformations adhering to production standards with minimal execution latency.`,
    },
    {
      front: `How do you ensure data integrity during ${topic.title} execution?`,
      back: `By enforcing schema constraints, applying quarantine logging for anomalies, and validating with unit tests.`,
    },
    {
      front: `What is a common pitfall when implementing ${topic.title}?`,
      back: `Unbounded memory consumption or Cartesian products caused by improper join conditions or missing partition keys.`,
    },
  ];

  const practiceQuestions = materials?.practice_questions || [
    {
      question: `Which methodology is best suited for handling unexpected data schema anomalies in ${topic.title}?`,
      options: [
        "Ignore the anomalies and continue processing",
        "Quarantine anomalies into a dead-letter queue with audit logs",
        "Abort the whole cluster immediately without recording errors",
        "Delete the offending records permanently",
      ],
      correct_option_index: 1,
      explanation: "Quarantining preserves full data provenance and enables root-cause analysis without corrupting downstream pipelines.",
    },
  ];

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notesContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadNotes = () => {
    const blob = new Blob([notesContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${topic.title.replace(/\s+/g, "_")}_Study_Guide.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleQuizSelect = (qIdx, optIdx) => {
    setQuizAnswers({ ...quizAnswers, [qIdx]: optIdx });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 740, padding: 28 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-text)" }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                {topic.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="subtab-bar" style={{ marginBottom: 18 }}>
          <button className={`subtab-btn ${activeTab === "notes" ? "active" : ""}`} onClick={() => setActiveTab("notes")}>
            <FileText size={15} /> Core Concept Notes
          </button>
          <button className={`subtab-btn ${activeTab === "flashcards" ? "active" : ""}`} onClick={() => setActiveTab("flashcards")}>
            <Layers size={15} /> Flashcards ({flashcards.length})
          </button>
          <button className={`subtab-btn ${activeTab === "quiz" ? "active" : ""}`} onClick={() => setActiveTab("quiz")}>
            <Sparkles size={15} /> Practice Quiz
          </button>
        </div>

        {/* TAB 1: NOTES */}
        {activeTab === "notes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", maxHeight: 380, overflowY: "auto", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-primary)" }}>
              <div style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                {notesContent}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCopyNotes} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "8px 14px" }}>
                  {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  {copied ? "Copied Markdown!" : "Copy Notes"}
                </button>
                <button onClick={handleDownloadNotes} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "8px 14px" }}>
                  <Download size={14} /> Export .md Guide
                </button>
              </div>

              {onTakeAssessment && (
                <button onClick={() => { onClose(); onTakeAssessment(topic); }} className="btn btn-primary" style={{ fontSize: "0.82rem" }}>
                  <Award size={15} /> Ready? Take Assessment
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FLASHCARDS */}
        {activeTab === "flashcards" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Card {activeCardIdx + 1} of {flashcards.length} · Click card to flip
            </div>

            {/* Flashcard Box with Flip Animation */}
            <div
              onClick={() => setCardFlipped(!cardFlipped)}
              style={{
                width: "100%",
                minHeight: 220,
                borderRadius: 14,
                padding: 32,
                cursor: "pointer",
                background: cardFlipped ? "var(--bg-card-hover)" : "var(--bg-surface)",
                border: `2px solid ${cardFlipped ? "var(--primary)" : "var(--border-subtle)"}`,
                boxShadow: "var(--glass-shadow)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                transition: "all 0.25s ease",
              }}
            >
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: cardFlipped ? "var(--accent-cyan)" : "var(--primary)", marginBottom: 12 }}>
                {cardFlipped ? "ANSWER / KEY INSIGHT" : "QUESTION / PROMPT"}
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.5, maxWidth: 540 }}>
                {cardFlipped ? flashcards[activeCardIdx]?.back : flashcards[activeCardIdx]?.front}
              </div>
              <div style={{ marginTop: 16, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {cardFlipped ? "Click to return to question" : "Click to reveal answer"}
              </div>
            </div>

            {/* Navigation buttons */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={() => {
                  setActiveCardIdx(Math.max(0, activeCardIdx - 1));
                  setCardFlipped(false);
                }}
                disabled={activeCardIdx === 0}
                className="btn btn-secondary"
                style={{ padding: "8px 14px" }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={() => setCardFlipped(!cardFlipped)}
                className="btn btn-secondary"
                style={{ padding: "8px 16px" }}
              >
                Flip Card
              </button>
              <button
                onClick={() => {
                  setActiveCardIdx(Math.min(flashcards.length - 1, activeCardIdx + 1));
                  setCardFlipped(false);
                }}
                disabled={activeCardIdx === flashcards.length - 1}
                className="btn btn-secondary"
                style={{ padding: "8px 14px" }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: QUIZ */}
        {activeTab === "quiz" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {practiceQuestions.map((q, qIdx) => (
              <div key={qIdx} style={{ padding: 18, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: 12 }}>
                  Q{qIdx + 1}: {q.question}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = quizAnswers[qIdx] === optIdx;
                    const isCorrect = showQuizResults && optIdx === q.correct_option_index;
                    const isWrong = showQuizResults && isSelected && !isCorrect;

                    return (
                      <div
                        key={optIdx}
                        onClick={() => !showQuizResults && handleQuizSelect(qIdx, optIdx)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          cursor: showQuizResults ? "default" : "pointer",
                          background: isCorrect
                            ? "var(--accent-success-bg)"
                            : isWrong
                            ? "var(--accent-danger-bg)"
                            : isSelected
                            ? "var(--badge-bg)"
                            : "var(--input-bg)",
                          border: `1px solid ${
                            isCorrect
                              ? "var(--accent-success-border)"
                              : isWrong
                              ? "var(--accent-danger-border)"
                              : isSelected
                              ? "var(--primary)"
                              : "var(--border-subtle)"
                          }`,
                          fontSize: "0.85rem",
                          color: isCorrect ? "var(--accent-emerald)" : isWrong ? "var(--accent-danger-text)" : "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{opt}</span>
                        {showQuizResults && isCorrect && <CheckCircle2 size={16} color="var(--accent-emerald)" />}
                      </div>
                    );
                  })}
                </div>

                {showQuizResults && q.explanation && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: "var(--badge-bg)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {!showQuizResults ? (
                <button
                  onClick={() => setShowQuizResults(true)}
                  disabled={Object.keys(quizAnswers).length === 0}
                  className="btn btn-primary"
                >
                  Check Answers
                </button>
              ) : (
                <button onClick={() => { setShowQuizResults(false); setQuizAnswers({}); }} className="btn btn-secondary">
                  Reset Practice
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

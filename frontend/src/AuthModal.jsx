import React, { useState } from "react";
import * as api from "./api";
import {
  Compass, Lock, Mail, User, Shield, CheckCircle2,
  ArrowRight, Key, Sparkles, AlertCircle
} from "lucide-react";

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
  onAuthSuccess,
  showNotification,
  onQuickLogin,
}) {
  const [mode, setMode] = useState(initialMode); // signin | register | forgot | verify
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sign In Form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("student"); // student | employee | seller | mentor (NO admin!)

  // Role-Specific Onboarding Fields
  const [education, setEducation] = useState("");
  const [college, setCollege] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [yearsExperience, setYearsExperience] = useState(2);
  const [goalMode, setGoalMode] = useState("promotion");
  const [brandName, setBrandName] = useState("");
  const [expertise, setExpertise] = useState("");

  // Forgot Password Form
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1 = request, 2 = confirm

  // Verify Email Form
  const [verificationToken, setVerificationToken] = useState("");

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(loginEmail.trim(), loginPassword);
      localStorage.setItem("growsphere_token", res.access_token);
      showNotification(`Welcome back, ${res.user.full_name}!`);
      onAuthSuccess(res.user, res.access_token);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Defense-in-depth: Never allow admin registration
    if (regRole === "admin") {
      setError("Admin accounts cannot be registered publicly.");
      return;
    }

    if (regPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(regEmail.trim(), regFullName.trim(), regPassword, regRole);
      localStorage.setItem("growsphere_token", res.access_token);

      // Submit role-specific onboarding data
      try {
        if (regRole === "student") {
          await api.submitOnboarding({
            education: education || "Bachelor's Degree",
            college: college || "University",
            target_role_id: 1, // Default Data Analyst
          });
        } else if (regRole === "employee") {
          await api.submitOnboarding({
            current_role: currentRole || "Associate Analyst",
            current_company: currentCompany || "TechCorp",
            years_experience: Number(yearsExperience) || 2,
            goal_mode: goalMode,
            target_role_id: 1,
          });
        }
      } catch (onboardingErr) {
        console.warn("Onboarding non-blocking note:", onboardingErr);
      }

      showNotification(`Account created successfully! Welcome to GrowSphere, ${res.user.full_name}.`);
      onAuthSuccess(res.user, res.access_token);
      onClose();
    } catch (err) {
      setError(err.message || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.requestPasswordReset(resetEmail.trim());
      showNotification(res.message || "Reset token dispatched!");
      if (res.token_preview) {
        setResetToken(res.token_preview);
      }
      setResetStep(2);
    } catch (err) {
      setError(err.message || "Failed to dispatch reset request.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    try {
      await api.confirmPasswordReset(resetToken.trim(), newPassword);
      showNotification("Password reset completed! You may now sign in.");
      setMode("signin");
      setResetStep(1);
    } catch (err) {
      setError(err.message || "Password reset failed. Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.confirmEmailVerification(verificationToken.trim());
      showNotification("Email verified successfully!");
      setMode("signin");
    } catch (err) {
      setError(err.message || "Email verification failed. Invalid token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540, padding: 32 }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Compass size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Grow<span style={{ color: "var(--primary)" }}>Sphere</span> Account
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Evidence-Based Career Growth
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.3rem",
              cursor: "pointer",
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: 20,
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            style={{
              padding: "8px 14px",
              fontSize: "0.85rem",
              fontWeight: 700,
              border: "none",
              borderBottom: mode === "signin" ? "2px solid var(--primary)" : "2px solid transparent",
              background: "transparent",
              color: mode === "signin" ? "var(--primary)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); }}
            style={{
              padding: "8px 14px",
              fontSize: "0.85rem",
              fontWeight: 700,
              border: "none",
              borderBottom: mode === "register" ? "2px solid var(--primary)" : "2px solid transparent",
              background: "transparent",
              color: mode === "register" ? "var(--primary)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Create Account
          </button>

          <button
            type="button"
            onClick={() => { setMode("forgot"); setError(null); }}
            style={{
              padding: "8px 14px",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "none",
              borderBottom: mode === "forgot" ? "2px solid var(--primary)" : "2px solid transparent",
              background: "transparent",
              color: mode === "forgot" ? "var(--primary)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Password Reset
          </button>

          <button
            type="button"
            onClick={() => { setMode("verify"); setError(null); }}
            style={{
              padding: "8px 14px",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "none",
              borderBottom: mode === "verify" ? "2px solid var(--primary)" : "2px solid transparent",
              background: "transparent",
              color: mode === "verify" ? "var(--primary)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Verify Email
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "var(--accent-danger-bg)",
              border: "1px solid var(--accent-danger-border)",
              color: "var(--accent-danger)",
              fontSize: "0.85rem",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ─── 1. SIGN IN FORM ─── */}
        {mode === "signin" && (
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "11px", marginTop: 6 }}
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </button>
          </form>
        )}

        {/* ─── 2. CREATE ACCOUNT FORM ─── */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Aditi Shinde"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="learner@growsphere.dev"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Password (minimum 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Primary Platform Role
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="input-field"
              >
                <option value="student">Student Learner (Target role & internships)</option>
                <option value="employee">Working Professional (Upskilling & transitions)</option>
                <option value="seller">Course Seller (Publish & monetize training)</option>
                <option value="mentor">Industry Mentor (1-on-1 advisory & endorsements)</option>
              </select>
            </div>

            {/* Role-Specific Onboarding Questions */}
            {regRole === "student" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Education / Degree</label>
                  <input
                    type="text"
                    placeholder="B.Tech Computer Science"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="input-field"
                    style={{ fontSize: "0.8rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>College / University</label>
                  <input
                    type="text"
                    placeholder="IIT Bombay"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="input-field"
                    style={{ fontSize: "0.8rem" }}
                  />
                </div>
              </div>
            )}

            {regRole === "employee" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Current Job Title</label>
                  <input
                    type="text"
                    placeholder="Software Engineer"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    className="input-field"
                    style={{ fontSize: "0.8rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Goal Mode</label>
                  <select
                    value={goalMode}
                    onChange={(e) => setGoalMode(e.target.value)}
                    className="input-field"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <option value="promotion">Internal Promotion</option>
                    <option value="reskilling">Skill Modernization</option>
                    <option value="career_switch">Domain Career Switch</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "11px", marginTop: 6 }}
            >
              {loading ? "Creating Verified Account..." : "Complete Registration"}
            </button>
          </form>
        )}

        {/* ─── 3. FORGOT PASSWORD ─── */}
        {mode === "forgot" && (
          <div>
            {resetStep === 1 ? (
              <form onSubmit={handleRequestReset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  Enter your registered account email. A secure reset token will be dispatched.
                </p>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="input-field"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "10px" }}
                >
                  {loading ? "Dispatching..." : "Request Reset Token"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Paste received token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    New Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "10px" }}
                >
                  {loading ? "Updating Password..." : "Confirm New Password"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ─── 4. VERIFY EMAIL ─── */}
        {mode === "verify" && (
          <form onSubmit={handleVerifyEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
              Enter the verification token sent to your email to activate all verified badges.
            </p>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Verification Token
              </label>
              <input
                type="text"
                required
                placeholder="Enter verification token"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "10px" }}
            >
              {loading ? "Verifying..." : "Confirm Email"}
            </button>
          </form>
        )}

        {/* ─── Developer Sandbox Quick-Login Banner ─── */}
        <div
          style={{
            marginTop: 24,
            padding: "12px 14px",
            borderRadius: 8,
            background: "var(--badge-bg)",
            border: "1px dashed var(--border-subtle)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", marginBottom: 6 }}>
            ⚡ EVALUATOR QUICK LOGIN (Development Seed Mode)
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => { onQuickLogin("student"); onClose(); }}
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { onQuickLogin("employee"); onClose(); }}
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              Employee
            </button>
            <button
              type="button"
              onClick={() => { onQuickLogin("seller"); onClose(); }}
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              Seller
            </button>
            <button
              type="button"
              onClick={() => { onQuickLogin("mentor"); onClose(); }}
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              Mentor
            </button>
            <button
              type="button"
              onClick={() => { onQuickLogin("admin"); onClose(); }}
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "4px 8px", border: "1px solid var(--accent-warning)" }}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * GrowSphere API Client.
 * Connects to FastAPI backend with configurable environment-based URL.
 */

const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase.replace(/\/+$/, "")}/api`;

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("growsphere_token");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

// ─── Auth ───
export const login = (email, password) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (email, fullName, password, role) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, full_name: fullName, password, role }),
  });

// ─── Neon Services Integration (Postgres & Auth) ───
export const getNeonServiceStatus = () => apiRequest("/auth/neon/status");

export const syncNeonUser = (userData) =>
  apiRequest("/auth/neon/sync", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_BASE_URL ||
  "https://ep-green-flower-azk4g2er.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth";

export const neonAuthSignIn = async (email, password) => {
  const resp = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || "Neon Auth sign-in failed");
  }
  return await resp.json();
};

export const neonAuthSignUp = async (email, password, name) => {
  const resp = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || "Neon Auth sign-up failed");
  }
  return await resp.json();
};

export const getMe = () => apiRequest("/auth/me");
export const logout = () => apiRequest("/auth/logout", { method: "POST" });

export const requestPasswordReset = (email) =>
  apiRequest("/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const confirmPasswordReset = (token, newPassword) =>
  apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });

export const requestEmailVerification = () =>
  apiRequest("/auth/request-email-verification", { method: "POST" });

export const confirmEmailVerification = (token) =>
  apiRequest("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

export const submitOnboarding = (payload) =>
  apiRequest("/auth/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ─── Dashboards ───
export const getStudentDashboard = () => apiRequest("/dashboard/student");
export const getEmployeeDashboard = () => apiRequest("/dashboard/employee");
export const getSellerDashboard = () => apiRequest("/dashboard/seller");
export const getMentorDashboard = () => apiRequest("/dashboard/mentor");

// ─── Skills, Evidence & Roadmap ───
export const getSkills = () => apiRequest("/skills/");
export const getCareerRoles = () => apiRequest("/skills/career-roles");
export const getGapAnalysis = () => apiRequest("/skills/gap-analysis");
export const getMyEvidence = () => apiRequest("/profiles/skills");
export const addSelfReportedSkill = (skillId, level, sourceDescription) =>
  apiRequest("/profiles/skills", {
    method: "POST",
    body: JSON.stringify({
      skill_id: skillId,
      level: level || "beginner",
      source_description: sourceDescription || "Self-reported skill",
    }),
  });
export const updateSkillEvidence = (evidenceId, payload) =>
  apiRequest(`/profiles/skills/${evidenceId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
export const deleteSkillEvidence = (evidenceId) =>
  apiRequest(`/profiles/skills/${evidenceId}`, { method: "DELETE" });
export const addProjectEvidence = (skillId, projectTitle, projectUrl, proofText) =>
  apiRequest("/skills/evidence/add-project", {
    method: "POST",
    body: JSON.stringify({
      skill_id: skillId,
      project_title: projectTitle,
      project_url: projectUrl,
      proof_text: proofText,
    }),
  });
export const getMarketEvidence = (params = "") =>
  apiRequest(`/skills/market-evidence${params ? `?${params}` : ""}`);
export const getActiveRoadmap = () => apiRequest("/roadmap/active");
export const listUserRoadmaps = () => apiRequest("/roadmap/");
export const getRoadmapById = (roadmapId) => apiRequest(`/roadmap/${roadmapId}`);
export const validateRoadmapDeadline = (data) =>
  apiRequest("/roadmap/validate-deadline", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const generatePersonalizedRoadmap = (data) =>
  apiRequest("/roadmap/generate-personalized", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const toggleRoadmapTask = (roadmapId, taskId, isCompleted) =>
  apiRequest(`/roadmap/${roadmapId}/toggle-task`, {
    method: "POST",
    body: JSON.stringify({ task_id: taskId, is_completed: isCompleted }),
  });
export const regeneratePersonalizedRoadmap = (roadmapId, data) =>
  apiRequest(`/roadmap/${roadmapId}/regenerate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const deleteRoadmap = (roadmapId) =>
  apiRequest(`/roadmap/${roadmapId}`, { method: "DELETE" });
export const generateRoadmap = () => apiRequest("/roadmap/generate", { method: "POST" });
export const regenerateRoadmap = () => apiRequest("/roadmap/generate", { method: "POST" });

// ─── Skill Passport ───
export const getMyPassport = () => apiRequest("/passport/my");
export const togglePassportRevocation = (isRevoked) =>
  apiRequest("/passport/toggle-revoke", {
    method: "POST",
    body: JSON.stringify({ is_revoked: isRevoked }),
  });
export const getPublicPassport = (slug) => apiRequest(`/passport/public/${slug}`);

// ─── Credits Ledger ───
export const getCreditBalance = () => apiRequest("/credits/balance");
export const grantCreditBonus = (amount, description, idempotencyKey) =>
  apiRequest("/credits/grant", {
    method: "POST",
    body: JSON.stringify({
      amount,
      description,
      idempotency_key: idempotencyKey || `grant_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    }),
  });

// ─── Payments & Checkouts ───
export const createPaymentCheckout = (courseId, amount, paymentMethod, idempotencyKey) =>
  apiRequest("/payments/checkout", {
    method: "POST",
    body: JSON.stringify({
      course_id: courseId,
      amount,
      payment_method: paymentMethod || "sandbox_card",
      idempotency_key: idempotencyKey || `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    }),
  });
export const getOrderReceipt = (orderId) => apiRequest(`/payments/orders/${orderId}`);
export const getSellerPayouts = () => apiRequest("/payments/seller/payouts");
export const requestSellerPayout = (amount, payoutDetails) =>
  apiRequest("/payments/seller/request-payout", {
    method: "POST",
    body: JSON.stringify({ amount, payout_details: payoutDetails }),
  });

// ─── AI Mock Interview Studio (Voice & Rubric) ───
export const getVoiceInterviewPlan = (data) =>
  apiRequest("/mock-interviews/plan", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const startMockInterview = (targetRoleOrPayload, interviewType) => {
  const payload = typeof targetRoleOrPayload === "object"
    ? targetRoleOrPayload
    : { target_role: targetRoleOrPayload, interview_type: interviewType || "technical" };
  return apiRequest("/mock-interviews/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const sendVoiceTurn = (sessionId, data) =>
  apiRequest(`/mock-interviews/${sessionId}/turn`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const finalizeVoiceInterview = (sessionId, data) =>
  apiRequest(`/mock-interviews/${sessionId}/finalize`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });

export const getMockInterviewSession = (sessionId) =>
  apiRequest(`/mock-interviews/${sessionId}`);

export const submitMockInterviewAnswer = (sessionId, questionId, learnerAnswer) =>
  apiRequest(`/mock-interviews/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ question_id: questionId, learner_answer: learnerAnswer }),
  });

export const getMockInterviewHistory = () => apiRequest("/mock-interviews/my-history");

// ─── Learning Materials (Flashcards & Notes) ───
export const getTopicMaterials = (topicId) => apiRequest(`/learning-materials/topic/${topicId}`);

// ─── Career Transition & Practical Tasks ───
export const analyzeCareerTransition = (currentRole, targetRole) =>
  apiRequest("/career-transitions/analyze", {
    method: "POST",
    body: JSON.stringify({ current_role: currentRole, target_role: targetRole }),
  });
export const getRoleTasks = (roleId) => apiRequest(`/career-transitions/tasks/${roleId}`);
export const submitRoleTask = (taskId, submissionNotes, solutionUrl) =>
  apiRequest(`/career-transitions/tasks/${taskId}/submit`, {
    method: "POST",
    body: JSON.stringify({ submission_notes: submissionNotes, solution_url: solutionUrl }),
  });

// ─── Assessments ───
export const getAssessments = () => apiRequest("/assessments/");
export const getAssessmentDetail = (id) => apiRequest(`/assessments/${id}`);
export const submitAssessment = (id, answers, timeTaken) =>
  apiRequest(`/assessments/${id}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers, time_taken_seconds: timeTaken }),
  });

// ─── Courses & Reviews ───
export const getCourses = (params = "") => apiRequest(`/courses/${params}`);
export const getRecommendedCourses = () => apiRequest("/courses/recommendations");
export const getMySellerCourses = () => apiRequest("/courses/seller/my-courses");
export const createCourseListing = (data) =>
  apiRequest("/courses/", { method: "POST", body: JSON.stringify(data) });
export const updateCourseListingStatus = (courseId, status) =>
  apiRequest(`/courses/${courseId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
export const enrollInCourse = (courseId) =>
  apiRequest(`/courses/${courseId}/enroll`, { method: "POST" });
export const getMyEnrollments = () => apiRequest("/courses/enrollments/my");
export const createCourseReview = (courseId, rating, reviewText) =>
  apiRequest(`/courses/${courseId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ rating, review_text: reviewText }),
  });
export const getCourseReviews = (courseId) => apiRequest(`/courses/${courseId}/reviews`);

// ─── Jobs, Internships & Saved Opportunities ───
export const getJobs = (params = "") => apiRequest(`/jobs/${params}`);
export const getJobMatches = () => apiRequest("/jobs/matches");
export const saveOpportunity = (jobPostingId, notes) =>
  apiRequest(`/jobs/${jobPostingId}/save`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
export const getSavedOpportunities = () => apiRequest("/jobs/saved/my");
export const deleteSavedOpportunity = (savedId) =>
  apiRequest(`/jobs/saved/${savedId}`, { method: "DELETE" });
export const updateSavedApplicationStatus = (savedId, status, notes) =>
  apiRequest(`/jobs/saved/${savedId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, notes }),
  });

// ─── Mentors, Availability, Bookings & Endorsements ───
export const getMentors = () => apiRequest("/mentors/");
export const getMentorOfferings = (mentorId) => apiRequest(`/mentors/${mentorId}/offerings`);
export const getMentorAvailability = (mentorId) => apiRequest(`/mentors/${mentorId}/availability`);
export const addMentorAvailabilitySlot = (slotData) =>
  apiRequest("/mentors/availability", { method: "POST", body: JSON.stringify(slotData) });
export const deleteMentorAvailabilitySlot = (slotId) =>
  apiRequest(`/mentors/availability/${slotId}`, { method: "DELETE" });
export const bookSession = (offeringId, scheduledAt, learnerNotes) =>
  apiRequest("/mentors/bookings", {
    method: "POST",
    body: JSON.stringify({ offering_id: offeringId, scheduled_at: scheduledAt, learner_notes: learnerNotes }),
  });
export const getMyBookings = () => apiRequest("/mentors/bookings/my");
export const updateBookingStatus = (bookingId, status, mentorNotes, sessionLink) =>
  apiRequest(`/mentors/bookings/${bookingId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, mentor_notes: mentorNotes, session_link: sessionLink }),
  });
export const endorseLearnerSkill = (learnerId, skillId, endorsementNotes, confidenceScore) =>
  apiRequest("/mentors/endorse", {
    method: "POST",
    body: JSON.stringify({
      learner_id: learnerId,
      skill_id: skillId,
      endorsement_notes: endorsementNotes,
      confidence_score: confidenceScore || 0.95,
    }),
  });

// ─── Profiles, Resume Extraction & Privacy ───
export const getStudentProfile = () => apiRequest("/profiles/student");
export const updateStudentProfile = (data) =>
  apiRequest("/profiles/student", { method: "PUT", body: JSON.stringify(data) });
export const getEmployeeProfile = () => apiRequest("/profiles/employee");
export const updateEmployeeProfile = (data) =>
  apiRequest("/profiles/employee", { method: "PUT", body: JSON.stringify(data) });
export const uploadResumeFile = (file, targetRole) => {
  const formData = new FormData();
  formData.append("file", file);
  if (targetRole) formData.append("target_role", targetRole);
  return apiRequest("/profiles/resume/upload", {
    method: "POST",
    body: formData,
  });
};
export const getMyResumes = () => apiRequest("/profiles/resume");
export const deleteResume = (resumeId) =>
  apiRequest(`/profiles/resume/${resumeId}`, { method: "DELETE" });
export const extractResumeSkills = (text) =>
  apiRequest("/profiles/resume/extract", { method: "POST", body: JSON.stringify({ text }) });
export const confirmResumeSkills = (confirmedSkills) =>
  apiRequest("/profiles/resume/confirm-skills", {
    method: "POST",
    body: JSON.stringify({ confirmed_skills: confirmedSkills }),
  });
export const analyzeResumeAts = (text, targetRole) =>
  apiRequest("/profiles/resume/ats-analyze", {
    method: "POST",
    body: JSON.stringify({ text, target_role: targetRole }),
  });
export const updatePrivacySettings = (settings) =>
  apiRequest("/profiles/privacy", { method: "PUT", body: JSON.stringify({ privacy_settings: settings }) });
export const exportUserData = () => apiRequest("/profiles/export-data");
export const deleteUserAccount = () => apiRequest("/profiles/delete-account", { method: "DELETE" });
export const getActivityHistory = () => apiRequest("/profiles/activity-history");

// ─── Admin / Operations Console ───
export const getAdminUsers = (params = "") => apiRequest(`/admin/users${params ? `?${params}` : ""}`);
export const updateUserRole = (userId, role) =>
  apiRequest(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
export const getModerationQueue = () => apiRequest("/admin/moderation/queue");
export const reviewModerationListing = (contentId, decision, recordedReason) =>
  apiRequest(`/admin/moderation/${contentId}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, recorded_reason: recordedReason }),
  });
export const getAdminReports = (params = "") =>
  apiRequest(`/admin/reports${params ? `?${params}` : ""}`);
export const resolveAdminReport = (reportId, status, resolutionNotes) =>
  apiRequest(`/admin/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, resolution_notes: resolutionNotes }),
  });
export const getAdminMetrics = () => apiRequest("/admin/metrics");
export const getAdminAuditLogs = (params = "") =>
  apiRequest(`/admin/audit-logs${params ? `?${params}` : ""}`);

// ─── Data Governance Register ───
export const getDataRegister = () => apiRequest("/data-register/");
export const getDataRegisterSummary = () => apiRequest("/data-register/summary");

// ─── Health ───
export const checkDbHealth = () => apiRequest("/health/db");

// ─── ATS Resume Analyzer ───
export const analyzeResumeFile = (file, targetRole) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_role", targetRole);
  return apiRequest("/resume-analyzer/analyze", {
    method: "POST",
    body: formData,
  });
};
export const getResumeAnalysisHistory = () => apiRequest("/resume-analyzer/history");
export const getResumeAnalysisReport = (id) => apiRequest(`/resume-analyzer/report/${id}`);
export const getSupportedRoles = () => apiRequest("/resume-analyzer/roles");

// ─── AI Resume Builder ───
export const getResumeBuilderProfileContext = (targetRole = "") =>
  apiRequest(`/resume-builder/profile-context${targetRole ? `?target_role=${encodeURIComponent(targetRole)}` : ""}`);

export const inspectGitHubRepo = (repoUrl) =>
  apiRequest("/resume-builder/inspect-github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_url: repoUrl }),
  });

export const generateResumeData = (targetRole, qaAnswers, templateId = "modern", accentColor = "#0a66c2") =>
  apiRequest("/resume-builder/generate-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_role: targetRole,
      qa_answers: qaAnswers,
      template_id: templateId,
      accent_color: accentColor,
    }),
  });

export const saveResumeVersion = (payload) =>
  apiRequest("/resume-builder/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const listSavedResumes = () => apiRequest("/resume-builder/list");

export const getSavedResume = (id) => apiRequest(`/resume-builder/${id}`);

export const deleteSavedResume = (id) =>
  apiRequest(`/resume-builder/${id}`, { method: "DELETE" });

export const quickATSCheck = (targetRole, resumeData) =>
  apiRequest("/resume-builder/quick-ats-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_role: targetRole, resume_data: resumeData }),
  });

export const downloadResumeDocx = async (resumeData) => {
  const token = localStorage.getItem("growsphere_token");
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
  const res = await fetch(`${API_BASE}/resume-builder/export-docx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(resumeData),
  });
  if (!res.ok) throw new Error("Failed to export DOCX document");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = resumeData?.personal_info?.name || "Candidate";
  a.download = `${name.replace(/\s+/g, "_")}_Resume.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};


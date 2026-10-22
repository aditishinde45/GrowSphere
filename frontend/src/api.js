/**
 * GrowSphere API Client.
 * Connects to FastAPI backend with configurable environment-based URL.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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

// ─── AI Mock Interview Studio ───
export const startMockInterview = (targetRole, interviewType) =>
  apiRequest("/mock-interviews/start", {
    method: "POST",
    body: JSON.stringify({ target_role: targetRole, interview_type: interviewType }),
  });
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


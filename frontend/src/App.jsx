import React, { useState, useEffect } from "react";
import * as api from "./api";
import LandingPage from "./LandingPage";
import AuthModal from "./AuthModal";
import ResumeBuilder from "./ResumeBuilder";
import MockInterviewStudio from "./MockInterviewStudio";
import StudyNotesModal from "./StudyNotesModal";
import SkillDemandRadar from "./SkillDemandRadar";
import SellerDemandIntelligence from "./SellerDemandIntelligence";
import { MentorIntelligenceView, LearnerProfilePreviewModal } from "./MentorIntelligence";

import {
  EditStudentProfileModal,
  EditEmployeeProfileModal,
  AddSelfSkillModal,
  EditEvidenceModal,
} from "./ProfileModals";
import {
  Compass, CheckCircle2, AlertTriangle, BookOpen, Briefcase,
  UserCheck, Shield, ChevronRight, Lock, Unlock, PlayCircle,
  FileText, Award, RefreshCw, Sparkles, HelpCircle, Layers,
  ExternalLink, Calendar, Star, Check, CreditCard, Wallet,
  Send, Share2, Trash2, Download, Eye, EyeOff, Clock, Video,
  UserPlus, PlusCircle, CheckSquare, XCircle, Activity, FileCheck,
  TrendingUp, Users, DollarSign, Settings, LogOut, Sun, Moon,
  UploadCloud, Filter, Edit2, GraduationCap, ArrowRight
} from "lucide-react";

// Pre-seeded role demo credentials for instant 1-click role testing in dev sandbox
const DEMO_USERS = {
  student: { email: "student@growsphere.dev", password: "password123", label: "Student Learner", name: "Aditi Shinde" },
  employee: { email: "employee@growsphere.dev", password: "password123", label: "Employee (Professional)", name: "Rahul Verma" },
  seller: { email: "seller@growsphere.dev", password: "password123", label: "Course Seller", name: "DataOrbit Academy" },
  mentor: { email: "mentor@growsphere.dev", password: "password123", label: "Mentor", name: "Dr. Aris Thorne" },
  admin: { email: "admin@growsphere.dev", password: "password123", label: "Admin & Operations", name: "Operations Admin" },
};

export default function App() {
  const [activeRole, setActiveRole] = useState("student");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Theme Management (LinkedIn-inspired Light & Dark)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("growsphere_theme");
    if (saved) return saved;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("growsphere_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");

  // Active subtabs per role
  const [studentTab, setStudentTab] = useState("roadmap"); // roadmap | evidence | resume | mock_interview | jobs | courses
  const [employeeTab, setEmployeeTab] = useState("dashboard"); // dashboard | transition | roadmap | evidence | resume | jobs | mentors
  const [sellerTab, setSellerTab] = useState("courses"); // courses | ledger | reviews
  const [mentorTab, setMentorTab] = useState("bookings"); // bookings | availability | endorsements
  const [adminTab, setAdminTab] = useState("moderation"); // moderation | users | reports | metrics | governance

  // ─── Student & Profile State ───
  const [studentProfile, setStudentProfile] = useState(null);
  const [careerRoles, setCareerRoles] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [marketEvidence, setMarketEvidence] = useState(null);
  const [myEvidence, setMyEvidence] = useState([]);
  const [evidenceFilter, setEvidenceFilter] = useState("all");
  const [passport, setPassport] = useState(null);
  const [courses, setCourses] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [mentorShareConsent, setMentorShareConsent] = useState(true);

  // Profile and Evidence Modals
  const [editStudentModalOpen, setEditStudentModalOpen] = useState(false);
  const [editEmployeeModalOpen, setEditEmployeeModalOpen] = useState(false);
  const [addSelfSkillModalOpen, setAddSelfSkillModalOpen] = useState(false);
  const [editEvidenceModalOpen, setEditEvidenceModalOpen] = useState(false);
  const [selectedEvidenceForEdit, setSelectedEvidenceForEdit] = useState(null);

  // Assessment Quiz Modal
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Learning Deck / Flashcards Modal
  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [studyMaterials, setStudyMaterials] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // ATS Resume State
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [selectedResumeTargetRole, setSelectedResumeTargetRole] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [candidateConfirmedSkills, setCandidateConfirmedSkills] = useState({});
  const [atsSuggestions, setAtsSuggestions] = useState([]);
  const [extractingResume, setExtractingResume] = useState(false);

  // AI Mock Interview Studio State
    // New Modular Feature States (PRD Sections 5.2, 5.4, 5.9, 5.10, 7.2, 8.3)
  const [resumeMode, setResumeMode] = useState("builder"); // builder | scanner
  const [studyNotesTopic, setStudyNotesTopic] = useState(null);
  const [studyNotesMaterials, setStudyNotesMaterials] = useState(null);
  const [previewBooking, setPreviewBooking] = useState(null);

  const handleOpenStudyNotes = async (topic) => {
    setStudyNotesTopic(topic);
    try {
      const res = await api.getTopicMaterials(topic.id);
      setStudyNotesMaterials(res);
    } catch (err) {
      console.warn("Could not fetch topic materials, fallback to dynamic generator:", err);
      setStudyNotesMaterials(null);
    }
  };

  const [interviewSession, setInterviewSession] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [learnerAnswer, setLearnerAnswer] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);

  // Project Evidence Modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [projectProof, setProjectProof] = useState("");

  // ─── Employee State ───
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [goalMode, setGoalMode] = useState("promotion");
  const [transitionAnalysis, setTransitionAnalysis] = useState(null);
  const [roleTasks, setRoleTasks] = useState([]);
  const [selectedTaskSubmission, setSelectedTaskSubmission] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);

  // ─── Course Seller State ───
  const [sellerCourses, setSellerCourses] = useState([]);
  const [sellerPayouts, setSellerPayouts] = useState([]);
  const [newCourseModalOpen, setNewCourseModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "", description: "", price: 0, is_free: false, duration_hours: 10,
    skills_taught: "", prerequisites: "",
  });

  // ─── Mentor State ───
  const [mentorData, setMentorData] = useState(null);
  const [mentorAvailability, setMentorAvailability] = useState([]);
  const [newSlot, setNewSlot] = useState({ day_of_week: "Monday", start_time: "10:00", end_time: "11:00", max_bookings: 1 });
  const [endorseModalOpen, setEndorseModalOpen] = useState(false);
  const [endorseTargetUserId, setEndorseTargetUserId] = useState(1);
  const [endorseSkillId, setEndorseSkillId] = useState("");
  const [endorseNotes, setEndorseNotes] = useState("");

  // ─── Admin State ───
  const [adminUsers, setAdminUsers] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [adminReports, setAdminReports] = useState([]);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [adminAuditLogs, setAdminAuditLogs] = useState([]);
  const [registerRecords, setRegisterRecords] = useState([]);
  const [registerSummary, setRegisterSummary] = useState(null);
  const [moderationReason, setModerationReason] = useState("");
  const [selectedModItem, setSelectedModItem] = useState(null);

  // ─── Shared Universal Modals ───
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({ profile_visibility: "public", hide_current_employer: false });
  const [publicPassportModalOpen, setPublicPassportModalOpen] = useState(false);
  const [publicPassportData, setPublicPassportData] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutCourse, setCheckoutCourse] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingOffering, setBookingOffering] = useState(null);
  const [bookingNotes, setBookingNotes] = useState("");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadRoleData = async (roleKey) => {
    if (roleKey === "student") await loadStudentView();
    else if (roleKey === "employee") await loadEmployeeView();
    else if (roleKey === "mentor") await loadMentorView();
    else if (roleKey === "seller") await loadSellerView();
    else if (roleKey === "admin") await loadAdminView();
  };

  // Switch role and log in automatically in dev sandbox mode
  const switchRole = async (roleKey) => {
    setLoading(true);
    setError(null);
    setActiveRole(roleKey);
    const creds = DEMO_USERS[roleKey];

    try {
      const authRes = await api.login(creds.email, creds.password);
      localStorage.setItem("growsphere_token", authRes.access_token);
      setUser(authRes.user);
      await loadRoleData(roleKey);
    } catch (err) {
      console.error("Login / Switch role error:", err);
      setError(`Could not switch to ${roleKey}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // non-blocking
    }
    localStorage.removeItem("growsphere_token");
    setUser(null);
    showNotification("You have signed out of GrowSphere.");
  };

  useEffect(() => {
    const token = localStorage.getItem("growsphere_token");
    if (token) {
      api.getMe()
        .then((me) => {
          setUser(me);
          setActiveRole(me.role);
          loadRoleData(me.role);
        })
        .catch(() => {
          localStorage.removeItem("growsphere_token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  // ─── Student Loader ───
  const loadStudentView = async () => {
    try {
      const [
        dash, gap, road, recCourses, recJobs, evidence, mEvidence, myPass,
        allSk, saved, enrolls, bookings, mentors, sProf, roles, myResumes
      ] = await Promise.all([
        api.getStudentDashboard().catch(() => null),
        api.getGapAnalysis().catch(() => null),
        api.getActiveRoadmap().catch(() => null),
        api.getRecommendedCourses().catch(() => []),
        api.getJobMatches().catch(() => []),
        api.getMyEvidence().catch(() => []),
        api.getMarketEvidence("role_title=Data Analyst").catch(() => null),
        api.getMyPassport().catch(() => null),
        api.getSkills().catch(() => []),
        api.getSavedOpportunities().catch(() => []),
        api.getMyEnrollments().catch(() => []),
        api.getMyBookings().catch(() => []),
        api.getMentors().catch(() => []),
        api.getStudentProfile().catch(() => null),
        api.getCareerRoles().catch(() => []),
        api.getMyResumes().catch(() => []),
      ]);
      setDashboardData(dash);
      setGapData(gap);
      setRoadmapData(road);
      setCourses(recCourses);
      setJobMatches(recJobs);
      setMyEvidence(Array.isArray(evidence) ? evidence : []);
      setMarketEvidence(mEvidence);
      setPassport(myPass);
      setAllSkills(allSk);
      setSavedJobs(saved);
      setMyEnrollments(enrolls);
      setMyBookings(bookings);
      setMentorsList(mentors);
      setStudentProfile(sProf);
      setCareerRoles(roles);
      setUploadedResumes(myResumes);
    } catch (e) {
      console.error("Student load error:", e);
    }
  };

  // ─── Employee Loader ───
  const loadEmployeeView = async () => {
    try {
      const [
        dash, gap, road, empProf, allSk, evidence, enrolls,
        bookings, mentors, saved, roles, myResumes, recJobs, recCourses
      ] = await Promise.all([
        api.getEmployeeDashboard().catch(() => null),
        api.getGapAnalysis().catch(() => null),
        api.getActiveRoadmap().catch(() => null),
        api.getEmployeeProfile().catch(() => null),
        api.getSkills().catch(() => []),
        api.getMyEvidence().catch(() => []),
        api.getMyEnrollments().catch(() => []),
        api.getMyBookings().catch(() => []),
        api.getMentors().catch(() => []),
        api.getSavedOpportunities().catch(() => []),
        api.getCareerRoles().catch(() => []),
        api.getMyResumes().catch(() => []),
        api.getJobMatches().catch(() => []),
        api.getRecommendedCourses().catch(() => []),
      ]);
      setDashboardData(dash);
      setGapData(gap);
      setRoadmapData(road);
      setEmployeeProfile(empProf);
      setAllSkills(allSk);
      setMyEvidence(Array.isArray(evidence) ? evidence : []);
      setMyEnrollments(enrolls);
      setMyBookings(bookings);
      setMentorsList(mentors);
      setSavedJobs(saved);
      setCareerRoles(roles);
      setUploadedResumes(myResumes);
      setJobMatches(recJobs);
      setCourses(recCourses);
      if (empProf?.goal_mode) setGoalMode(empProf.goal_mode);

      // Dynamically run transition analysis using employee's actual role and target
      const curRole = empProf?.current_role || "Operations Analyst";
      const tgtRoleId = empProf?.target_role_id || 2;
      const trans = await api.analyzeCareerTransition(curRole, tgtRoleId).catch(() => null);
      setTransitionAnalysis(trans);

      // Fetch role tasks for employee's target role
      const tasks = await api.getRoleTasks(tgtRoleId).catch(() => []);
      setRoleTasks(tasks);
    } catch (e) {
      console.error("Employee load error:", e);
    }
  };

  // ─── Mentor Loader ───
  const loadMentorView = async () => {
    try {
      const [mDash, bookings, allSk] = await Promise.all([
        api.getMentorDashboard().catch(() => null),
        api.getMyBookings().catch(() => []),
        api.getSkills().catch(() => []),
      ]);
      setMentorData(mDash);
      setMyBookings(bookings);
      setAllSkills(allSk);
      if (mDash?.mentor_profile?.id) {
        const slots = await api.getMentorAvailability(mDash.mentor_profile.id).catch(() => []);
        setMentorAvailability(slots);
      }
    } catch (e) {
      console.error("Mentor load error:", e);
    }
  };

  // ─── Seller Loader ───
  const loadSellerView = async () => {
    try {
      const [sDash, myCourses, payouts] = await Promise.all([
        api.getSellerDashboard().catch(() => null),
        api.getMySellerCourses().catch(() => []),
        api.getSellerPayouts().catch(() => []),
      ]);
      setSellerData(sDash);
      setSellerCourses(myCourses);
      setSellerPayouts(payouts);
    } catch (e) {
      console.error("Seller load error:", e);
    }
  };

  // ─── Admin Loader ───
  const loadAdminView = async () => {
    try {
      const [recs, sum, queue, reports, metrics, auditLogs, users] = await Promise.all([
        api.getDataRegister().catch(() => []),
        api.getDataRegisterSummary().catch(() => null),
        api.getModerationQueue().catch(() => []),
        api.getAdminReports().catch(() => []),
        api.getAdminMetrics().catch(() => null),
        api.getAdminAuditLogs().catch(() => []),
        api.getAdminUsers().catch(() => []),
      ]);
      setRegisterRecords(recs);
      setRegisterSummary(sum);
      setModerationQueue(queue);
      setAdminReports(reports);
      setAdminMetrics(metrics);
      setAdminAuditLogs(auditLogs);
      setAdminUsers(users);
    } catch (e) {
      console.error("Admin view error:", e);
      setError("Admin access restricted. Ensure you are authenticated with Admin privileges.");
    }
  };

  // ─── Wallet & Credits Loader ───
  const openWalletModal = async () => {
    try {
      const bal = await api.getCreditBalance();
      setCreditBalance(bal);
      setWalletModalOpen(true);
    } catch (err) {
      alert("Error loading credit balance: " + err.message);
    }
  };

  const handleGrantBonusCredits = async () => {
    try {
      setActionLoading(true);
      await api.grantCreditBonus(50, "Development / Sandbox Credit Allocation");
      const bal = await api.getCreditBalance();
      setCreditBalance(bal);
      showNotification("Successfully granted 50 GrowSphere sandbox credits!");
    } catch (err) {
      alert("Failed to grant bonus credits: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Assessment Handler ───
  const openQuiz = async (assessmentId) => {
    try {
      setLoading(true);
      const detail = await api.getAssessmentDetail(assessmentId);
      setActiveQuiz(detail);
      setQuizAnswers({});
      setQuizResult(null);
      setQuizModalOpen(true);
    } catch (err) {
      alert("Failed to load assessment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);
    try {
      const res = await api.submitAssessment(activeQuiz.id, quizAnswers, 90);
      setQuizResult(res);
      showNotification(res.passed ? "Assessment Passed! Roadmap updated." : "Assessment Completed. Review weak areas.");
      if (activeRole === "student") await loadStudentView();
      else await loadEmployeeView();
    } catch (err) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // ─── Flashcards / Study Deck ───
  const openStudyDeck = async (topicId) => {
    try {
      setActionLoading(true);
      const mats = await api.getTopicMaterials(topicId);
      setStudyMaterials(mats);
      setActiveCardIndex(0);
      setCardFlipped(false);
      setStudyModalOpen(true);
    } catch (err) {
      alert("Failed to load study deck: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── ATS Resume Analyzer & Upload ───
  const handleExtractResumeSkills = async () => {
    if (!resumeText.trim()) return;
    setExtractingResume(true);
    try {
      const res = await api.extractResumeSkills(resumeText);
      const skills = res.extracted_skills || [];
      setExtractedSkills(skills);
      const initialMap = {};
      skills.forEach((sk) => { initialMap[sk.skill] = true; });
      setCandidateConfirmedSkills(initialMap);
      setAtsSuggestions(res.ats_recommendations || []);
      showNotification(`Extracted ${skills.length} candidate skills for your review.`);
    } catch (err) {
      alert("Resume extraction failed: " + err.message);
    } finally {
      setExtractingResume(false);
    }
  };

  const handleUploadResumeFile = async (e) => {
    const file = e?.target?.files?.[0] || resumeFile;
    if (!file) {
      alert("Please choose a PDF, DOCX, or TXT file to upload.");
      return;
    }
    setUploadingResume(true);
    try {
      const tgt = selectedResumeTargetRole || (dashboardData?.target_role?.title) || "Data Analyst";
      const res = await api.uploadResumeFile(file, tgt);
      showNotification(`Extracted ${res.extracted_skills?.length || 0} candidate skills from ${res.filename}!`);
      const skills = res.extracted_skills || [];
      setExtractedSkills(skills);
      const initialMap = {};
      skills.forEach((sk) => { initialMap[sk.skill] = true; });
      setCandidateConfirmedSkills(initialMap);
      setAtsSuggestions(res.ats_recommendations || []);
      const myResumes = await api.getMyResumes().catch(() => []);
      setUploadedResumes(myResumes);
    } catch (err) {
      alert("Resume upload failed: " + err.message);
    } finally {
      setUploadingResume(false);
      setResumeFile(null);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!confirm("Are you sure you want to securely delete this resume from your profile storage?")) return;
    try {
      setActionLoading(true);
      await api.deleteResume(resumeId);
      showNotification("Resume securely deleted from storage.");
      const myResumes = await api.getMyResumes().catch(() => []);
      setUploadedResumes(myResumes);
    } catch (err) {
      alert("Failed to delete resume: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmResumeSkills = async () => {
    const checkedSkills = extractedSkills
      .filter((s) => candidateConfirmedSkills[s.skill] !== false)
      .map((s) => s.skill);

    if (!checkedSkills.length) {
      alert("Please select at least one skill checkbox to confirm.");
      return;
    }
    try {
      setActionLoading(true);
      await api.confirmResumeSkills(checkedSkills);
      showNotification(`Confirmed ${checkedSkills.length} skills committed to your profile with verified resume evidence tier!`);
      if (activeRole === "student") await loadStudentView();
      else await loadEmployeeView();
    } catch (err) {
      alert("Confirmation error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId) => {
    if (!confirm("Are you sure you want to remove this skill evidence from your profile?")) return;
    try {
      setActionLoading(true);
      await api.deleteSkillEvidence(evidenceId);
      showNotification("Skill evidence removed from profile.");
      if (activeRole === "student") await loadStudentView();
      else await loadEmployeeView();
    } catch (err) {
      alert("Failed to remove evidence: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSavedOpportunity = async (savedId) => {
    try {
      await api.deleteSavedOpportunity(savedId);
      showNotification("Opportunity removed from your tracker.");
      const saved = await api.getSavedOpportunities();
      setSavedJobs(saved);
    } catch (err) {
      alert("Failed to remove opportunity: " + err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this scheduled mentorship session?")) return;
    try {
      setActionLoading(true);
      await api.updateBookingStatus(bookingId, "cancelled", "Cancelled by user");
      showNotification("Mentorship session cancelled.");
      if (activeRole === "student") await loadStudentView();
      else await loadEmployeeView();
    } catch (err) {
      alert("Failed to cancel session: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerNextAction = (action) => {
    if (!action) return;
    if (action.type === "profile") {
      if (activeRole === "student") setEditStudentModalOpen(true);
      else setEditEmployeeModalOpen(true);
    } else if (action.type === "learn" && action.assessment_id) {
      openQuiz(action.assessment_id);
    } else if (action.type === "upskill" || action.type === "task") {
      if (activeRole === "employee") setEmployeeTab("transition");
      else setStudentTab("roadmap");
    } else if (action.type === "mentors") {
      if (activeRole === "employee") setEmployeeTab("mentors");
      else setStudentTab("courses");
    } else {
      if (activeRole === "student") setStudentTab("roadmap");
      else setEmployeeTab("dashboard");
    }
  };

  // ─── Project Evidence Submission ───
  const handleAddProjectEvidence = async (e) => {
    e.preventDefault();
    if (!selectedSkillId || !projectTitle.trim() || !projectProof.trim()) {
      alert("Please fill in the required skill, project title, and proof summary.");
      return;
    }
    try {
      setActionLoading(true);
      await api.addProjectEvidence(parseInt(selectedSkillId), projectTitle, projectUrl, projectProof);
      showNotification("Practical project evidence verified and committed to profile!");
      setProjectModalOpen(false);
      setProjectTitle("");
      setProjectUrl("");
      setProjectProof("");
      await loadStudentView();
    } catch (err) {
      alert("Project submission error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Skill Passport Toggle ───
  const handleTogglePassportRevoke = async () => {
    if (!passport) return;
    try {
      setActionLoading(true);
      const updated = await api.togglePassportRevocation(!passport.is_revoked);
      setPassport(updated);
      showNotification(updated.is_revoked ? "Skill Passport access has been REVOKED." : "Skill Passport has been ACTIVATED.");
    } catch (err) {
      alert("Error toggling passport: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPublicPassport = async (slug) => {
    try {
      setActionLoading(true);
      const data = await api.getPublicPassport(slug || passport?.share_slug);
      setPublicPassportData(data);
      setPublicPassportModalOpen(true);
    } catch (err) {
      alert("Passport lookup error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── AI Mock Interview Studio ───
  const handleStartMockInterview = async () => {
    try {
      setActionLoading(true);
      const session = await api.startMockInterview("Data Analyst", "technical");
      setInterviewSession(session);
      setCurrentQuestionIdx(0);
      setLearnerAnswer("");
      setInterviewFeedback(null);
      showNotification("Interview session initiated! 10 credits deducted.");
    } catch (err) {
      alert("Could not start mock interview: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitInterviewAnswer = async () => {
    if (!interviewSession || !learnerAnswer.trim()) return;
    const currentQ = interviewSession.questions[currentQuestionIdx];
    setSubmittingAnswer(true);
    try {
      const feedback = await api.submitMockInterviewAnswer(interviewSession.id, currentQ.id, learnerAnswer);
      setInterviewFeedback(feedback);
      showNotification("Response scored against STAR and technical precision rubrics.");
    } catch (err) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // ─── Opportunities & Job Tracking ───
  const handleSaveJob = async (jobId) => {
    try {
      await api.saveOpportunity(jobId, "Saved from recommended radar");
      showNotification("Opportunity saved to your application tracker!");
      const saved = await api.getSavedOpportunities();
      setSavedJobs(saved);
    } catch (err) {
      alert("Save error: " + err.message);
    }
  };

  const handleUpdateAppStatus = async (savedId, newStatus) => {
    try {
      await api.updateSavedApplicationStatus(savedId, newStatus, `Updated to ${newStatus}`);
      showNotification(`Application status updated to ${newStatus}!`);
      const saved = await api.getSavedOpportunities();
      setSavedJobs(saved);
    } catch (err) {
      alert("Update error: " + err.message);
    }
  };

  // ─── Course Checkout & Enrollment ───
  const handleEnrollCourse = async (course) => {
    if (course.is_free) {
      try {
        setActionLoading(true);
        await api.enrollInCourse(course.id);
        showNotification(`Successfully enrolled in ${course.title}!`);
        await loadStudentView();
      } catch (err) {
        alert("Enrollment failed: " + err.message);
      } finally {
        setActionLoading(false);
      }
    } else {
      setCheckoutCourse(course);
      setCheckoutModalOpen(true);
    }
  };

  const handleExecuteCheckout = async () => {
    if (!checkoutCourse) return;
    try {
      setActionLoading(true);
      await api.createPaymentCheckout(checkoutCourse.id, checkoutCourse.price, "sandbox_card");
      showNotification(`Payment successful! Enrolled in ${checkoutCourse.title}.`);
      setCheckoutModalOpen(false);
      setCheckoutCourse(null);
      await loadStudentView();
    } catch (err) {
      alert("Checkout error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Mentor Booking ───
  const handleOpenBookingModal = (offering) => {
    setBookingOffering(offering);
    setBookingNotes("");
    setBookingModalOpen(true);
  };

  const handleExecuteBooking = async () => {
    if (!bookingOffering) return;
    try {
      setActionLoading(true);
      const nextWeek = new Date(Date.now() + 86400000 * 3).toISOString();
      const notesWithConsent = `${bookingNotes}${mentorShareConsent ? " [Consent granted: Share verified skill profile & roadmap for session preparation]" : " [Evidence sharing declined]"}`;
      await api.bookSession(bookingOffering.id, nextWeek, notesWithConsent);
      showNotification("Mentorship session confirmed! Sandbox meeting link generated.");
      setBookingModalOpen(false);
      setBookingOffering(null);
      if (activeRole === "student") await loadStudentView();
      else await loadEmployeeView();
    } catch (err) {
      alert("Booking error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Course Seller Actions ───
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.createCourseListing({
        title: newCourse.title,
        description: newCourse.description,
        price: parseFloat(newCourse.price) || 0,
        is_free: Boolean(newCourse.is_free),
        duration_hours: parseInt(newCourse.duration_hours) || 10,
        skills_taught: newCourse.skills_taught ? newCourse.skills_taught.split(",").map(s => s.trim()) : ["Data Analysis"],
        prerequisites: newCourse.prerequisites ? newCourse.prerequisites.split(",").map(s => s.trim()) : [],
      });
      showNotification("Course listing draft created! Submit for moderation when ready.");
      setNewCourseModalOpen(false);
      setNewCourse({ title: "", description: "", price: 0, is_free: false, duration_hours: 10, skills_taught: "", prerequisites: "" });
      await loadSellerView();
    } catch (err) {
      alert("Create course error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCourseStatus = async (courseId, status) => {
    try {
      setActionLoading(true);
      await api.updateCourseListingStatus(courseId, status);
      showNotification(`Listing status updated to ${status}.`);
      await loadSellerView();
    } catch (err) {
      alert("Status update error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = prompt("Enter payout amount in INR (e.g. 5000):", "2500");
    if (!amount) return;
    try {
      setActionLoading(true);
      await api.requestSellerPayout(parseFloat(amount), "Bank Transfer AC: 9876543210 / IFSC: SBIN0001234");
      showNotification(`Payout request of ₹${amount} submitted for processing!`);
      await loadSellerView();
    } catch (err) {
      alert("Payout request error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Mentor Availability & Endorsement Actions ───
  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.addMentorAvailabilitySlot(newSlot);
      showNotification("Availability slot added successfully.");
      await loadMentorView();
    } catch (err) {
      alert("Slot error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      setActionLoading(true);
      await api.deleteMentorAvailabilitySlot(slotId);
      showNotification("Availability slot deleted.");
      await loadMentorView();
    } catch (err) {
      alert("Delete slot error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndorseLearner = async (e) => {
    e.preventDefault();
    if (!endorseSkillId || !endorseNotes.trim()) {
      alert("Please choose a skill and enter endorsement rationale.");
      return;
    }
    try {
      setActionLoading(true);
      await api.endorseLearnerSkill(parseInt(endorseTargetUserId), parseInt(endorseSkillId), endorseNotes, 0.95);
      showNotification("Verified Mentor Skill Endorsement recorded to learner's profile!");
      setEndorseModalOpen(false);
      setEndorseNotes("");
    } catch (err) {
      alert("Endorsement error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMentorBookingStatus = async (bookingId, status) => {
    try {
      setActionLoading(true);
      await api.updateBookingStatus(bookingId, status, `Status changed by mentor to ${status}`, "https://meeting.growsphere.dev/sandbox-session-live");
      showNotification(`Booking status updated to ${status}.`);
      await loadMentorView();
    } catch (err) {
      alert("Booking update error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Admin Moderation Actions ───
  const handleReviewListing = async (contentId, decision) => {
    if (!moderationReason.trim()) {
      alert("Mandatory recorded review reason is required to ensure audit trail compliance.");
      return;
    }
    try {
      setActionLoading(true);
      await api.reviewModerationListing(contentId, decision, moderationReason);
      showNotification(`Listing ${decision === "approve" ? "APPROVED" : "REJECTED"} with recorded audit reason.`);
      setModerationReason("");
      setSelectedModItem(null);
      await loadAdminView();
    } catch (err) {
      alert("Moderation error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveReport = async (reportId, status) => {
    const reason = prompt("Enter resolution notes:", "Investigated and resolved in compliance with policy.");
    if (!reason) return;
    try {
      setActionLoading(true);
      await api.resolveAdminReport(reportId, status, reason);
      showNotification(`Report #${reportId} status updated to ${status}.`);
      await loadAdminView();
    } catch (err) {
      alert("Report resolution error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteUserRole = async (userId, newRole) => {
    try {
      setActionLoading(true);
      await api.updateUserRole(userId, newRole);
      showNotification(`User #${userId} role updated to ${newRole}.`);
      await loadAdminView();
    } catch (err) {
      alert("Role update error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Privacy & Export Actions ───
  const handleExportData = async () => {
    try {
      setActionLoading(true);
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `growsphere_data_export_${user?.id || 'me'}.json`;
      a.click();
      showNotification("GDPR data export downloaded successfully!");
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Signed-Out Public Landing View ───
  if (!user && !loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthMode(mode || "signin");
            setAuthModalOpen(true);
          }}
          theme={theme}
          toggleTheme={toggleTheme}
          onQuickLogin={switchRole}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
          onAuthSuccess={(authenticatedUser) => {
            setUser(authenticatedUser);
            setActiveRole(authenticatedUser.role);
            loadRoleData(authenticatedUser.role);
          }}
          showNotification={showNotification}
          onQuickLogin={switchRole}
        />
        {notification && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 110, background: "var(--accent-success)", color: "var(--text-primary)", padding: "12px 20px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--glass-shadow)", fontWeight: 600, fontSize: "0.875rem" }}>
            <CheckCircle2 size={18} />
            <span>{notification}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── Initial Loading View ───
  if (loading && !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Compass size={24} color="#ffffff" />
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Loading GrowSphere...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ─── Top Authenticated Sticky Header ─── */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(14px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* Brand Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(10,102,194,0.3)" }}>
              <Compass size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                Grow<span style={{ color: "var(--primary)" }}>Sphere</span>
              </span>
              <span style={{ marginLeft: 8, fontSize: "0.65rem", padding: "2px 8px", borderRadius: 4, background: "var(--accent-success-bg)", color: "var(--accent-success)", fontWeight: 700, border: "1px solid var(--accent-success-border)" }}>
                {user ? `${user.role.toUpperCase()} WORKSPACE` : "FULL PRODUCT"}
              </span>
            </div>
          </div>

          {/* Dev Sandbox Persona Switcher */}
          <div style={{ display: "flex", alignItems: "center", background: "var(--badge-bg)", padding: 4, borderRadius: 10, border: "1px solid var(--border-subtle)", gap: 4 }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, padding: "0 4px" }}>[DEV TEST SWITCHER]</span>
            {Object.entries(DEMO_USERS).map(([key, item]) => {
              const isActive = activeRole === key;
              return (
                <button
                  key={key}
                  onClick={() => switchRole(key)}
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background: isActive ? "var(--primary)" : "transparent",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                  }}
                >
                  {item.label.split("(")[0].trim()}
                </button>
              );
            })}
          </div>

          {/* Right Header Controls: Theme, Wallet, Privacy, User & Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              style={{ padding: "6px 10px" }}
              aria-label="Toggle visual theme"
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <button
              onClick={openWalletModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "var(--accent-success-bg)",
                border: "1px solid var(--accent-success-border)",
                color: "var(--accent-success)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Wallet size={15} />
              Credits & Ledger
            </button>

            <button
              onClick={() => setPrivacyModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              <Lock size={14} />
              Privacy & GDPR
            </button>

            {/* Authenticated User Identity */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid var(--border-subtle)", paddingLeft: 10 }}>
              <div style={{ textAlign: "right", fontSize: "0.75rem" }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{user?.full_name || DEMO_USERS[activeRole]?.name}</div>
                <div style={{ color: "var(--primary)", textTransform: "capitalize" }}>{user?.email || activeRole}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--primary-text)" }}>
                {(user?.full_name || DEMO_USERS[activeRole]?.name || "U")[0].toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                title="Sign out of GrowSphere"
                style={{ padding: "6px 10px", color: "var(--accent-danger)", fontSize: "0.8rem", marginLeft: 4 }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Global Notification Toast ─── */}
      {notification && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, background: "rgba(16, 185, 129, 0.95)", color: "var(--text-primary)", padding: "12px 20px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", fontWeight: 600, fontSize: "0.875rem" }}>
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* ─── Main Content Container ─── */}
      <main style={{ flex: 1, maxWidth: 1360, margin: "0 auto", padding: "24px 20px", width: "100%" }}>
        {error && (
          <div style={{ padding: 16, marginBottom: 20, borderRadius: 12, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "var(--accent-danger-text)", display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE 1: STUDENT VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeRole === "student" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Student Subtab Bar */}
            {/* Student Personal Profile & Goal Hero Header */}
            <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="badge badge-verified">STUDENT LEARNER WORKSPACE</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 4 }}>
                    <GraduationCap size={14} /> {studentProfile?.education || "Undergraduate / Graduate"}
                  </span>
                </div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0" }}>
                  {user?.full_name || "Student Learner"}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "4px 0" }}>
                  Institution: <strong style={{ color: "var(--text-primary)" }}>{studentProfile?.college || "College / University not set"}</strong> · Location: <strong>{studentProfile?.location || "Not specified"}</strong> · Class of <strong>{studentProfile?.graduation_year || 2025}</strong>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 4 }}>
                    ⏱️ Study Pace: {studentProfile?.learning_time_hours_per_week || 10} hrs/week
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 4 }}>
                    🌐 Languages: {studentProfile?.preferred_languages || "English"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 4 }}>
                    💼 Seeking: {studentProfile?.opportunity_preferences || "Full-time, Internship"}
                  </span>
                </div>
              </div>
              <button onClick={() => setEditStudentModalOpen(true)} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Edit2 size={14} /> Edit Profile & Goals
              </button>
            </div>

            {/* Next Recommended Career Action Card */}
            {dashboardData?.next_action && (
              <div style={{ padding: "16px 20px", borderRadius: 12, background: "linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.1) 100%)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-text)" }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="badge badge-verified" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>RECOMMENDED NEXT ACTION</span>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{dashboardData.next_action.title}</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>{dashboardData.next_action.description}</div>
                  </div>
                </div>
                <button onClick={() => handleTriggerNextAction(dashboardData.next_action)} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                  {dashboardData.next_action.cta} <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Subtab Bar */}
            <div className="subtab-bar">
              <button className={`subtab-btn ${studentTab === "roadmap" ? "active" : ""}`} onClick={() => setStudentTab("roadmap")}>
                <Compass size={16} /> Roadmap & Adaptive Learning
              </button>
              <button className={`subtab-btn ${studentTab === "radar" ? "active" : ""}`} onClick={() => setStudentTab("radar")}>
                <TrendingUp size={16} /> Skill Demand Radar & Forecasts
              </button>
              <button className={`subtab-btn ${studentTab === "evidence" ? "active" : ""}`} onClick={() => setStudentTab("evidence")}>
                <Shield size={16} /> 5-Tier Evidence & Skill Passport
              </button>
              <button className={`subtab-btn ${studentTab === "resume" ? "active" : ""}`} onClick={() => setStudentTab("resume")}>
                <FileText size={16} /> Explainable ATS Resume Scanner
              </button>
              <button className={`subtab-btn ${studentTab === "mock_interview" ? "active" : ""}`} onClick={() => setStudentTab("mock_interview")}>
                <Sparkles size={16} /> AI Mock Interview Studio
              </button>
              <button className={`subtab-btn ${studentTab === "jobs" ? "active" : ""}`} onClick={() => setStudentTab("jobs")}>
                <Briefcase size={16} /> Opportunity Radar & Tracking ({savedJobs.length})
              </button>
              <button className={`subtab-btn ${studentTab === "courses" ? "active" : ""}`} onClick={() => setStudentTab("courses")}>
                <BookOpen size={16} /> Courses & Mentors Marketplace
              </button>
            </div>

            {/* TAB 1: ROADMAP & ADAPTIVE LEARNING */}
            {studentTab === "roadmap" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Target Role & Market Evidence Header Card */}
                <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="badge badge-verified">TARGET CAREER GOAL</span>
                      {marketEvidence && (
                        <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 4 }}>
                          <TrendingUp size={13} /> {marketEvidence.source} · N={marketEvidence.sample_size} postings · {marketEvidence.freshness}
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0" }}>
                      {dashboardData?.target_role?.title || studentProfile?.target_role_title || "Target Role Not Set"}
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: 640, marginTop: 4 }}>
                      {dashboardData?.target_role?.description || "Select your target role to calibrate real-time skill gaps, market demand, and adaptive roadmap."}
                    </p>
                    {marketEvidence?.limitations && (
                      <div style={{ marginTop: 8, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        ⚠️ Governance note: {marketEvidence.limitations}
                      </div>
                    )}
                  </div>

                  {/* Readiness Score Gauge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>EVIDENCE READINESS SCORE</div>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
                        {gapData ? `${Math.round(gapData.readiness_score * 100)}%` : "0%"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {gapData ? `${gapData.verified_count} verified · ${gapData.self_reported_count} self-reported · ${gapData.gap_count} gaps` : "Configure target role"}
                      </div>
                    </div>
                    <button onClick={async () => { await api.generateRoadmap(); await loadStudentView(); showNotification("Roadmap regenerated based on current evidence!"); }} className="btn btn-primary">
                      <RefreshCw size={16} /> Regenerate Roadmap
                    </button>
                  </div>
                </div>

                {/* Grid: Gap Breakdown & Sequential Roadmap */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
                  {/* Skill Gap Breakdown Card */}
                  <div className="glass-panel" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                        <Layers size={18} color="var(--primary)" /> Skill Gap Breakdown
                      </h3>
                      <span className="badge badge-verified">{gapData ? `${gapData.total_required} Target Skills` : "Loading"}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {gapData?.skill_details?.map((item, idx) => {
                        const isVerified = item.status === "verified";
                        const isSelf = item.status === "self_reported";
                        return (
                          <div key={idx} style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{item.skill.canonical_name}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.skill.category || "Technical Skill"}</div>
                            </div>
                            <div>
                              {isVerified && <span className="badge badge-verified"><CheckCircle2 size={12} /> Verified ({Math.round((item.confidence || 0.9) * 100)}%)</span>}
                              {isSelf && <span className="badge badge-self-reported">Self-Reported (50%)</span>}
                              {!isVerified && !isSelf && <span className="badge badge-gap">Missing Gap</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sequential Roadmap Card */}
                  <div className="glass-panel" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                          <Compass size={18} color="var(--accent-cyan)" /> Sequential Dependency Roadmap
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Gated by practical assessments (course completion alone ≠ proof)</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                        {roadmapData ? `${Math.round(roadmapData.overall_progress * 100)}% Complete` : "0%"}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {roadmapData?.topics?.map((topic) => (
                        <div
                          key={topic.id}
                          style={{
                            padding: "14px 16px",
                            borderRadius: 12,
                            background: topic.is_completed ? "rgba(16, 185, 129, 0.08)" : topic.is_locked ? "rgba(0,0,0,0.3)" : "rgba(99, 102, 241, 0.08)",
                            border: topic.is_completed ? "1px solid rgba(16, 185, 129, 0.25)" : topic.is_locked ? "1px solid var(--border-subtle)" : "1px solid var(--border-active)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: topic.is_completed ? "var(--accent-emerald)" : topic.is_locked ? "rgba(255,255,255,0.06)" : "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                              {topic.is_completed ? <Check size={16} /> : topic.is_locked ? <Lock size={14} /> : topic.order}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: topic.is_locked ? "var(--text-muted)" : "#ffffff" }}>
                                {topic.title}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {topic.is_completed ? "Proficiency Demonstrated & Recorded" : topic.is_locked ? "Prerequisites Required" : "Ready to Assess"}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => openStudyDeck(topic.id)} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "5px 10px" }}>
                              <BookOpen size={13} /> Flashcards
                            </button>
                            {!topic.is_completed && !topic.is_locked && topic.assessment_id && (
                              <button onClick={() => openQuiz(topic.assessment_id)} className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
                                <PlayCircle size={14} /> Take Assessment
                              </button>
                            )}
                            {topic.is_completed && <span className="badge badge-verified">Verified</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 5-TIER EVIDENCE & SKILL PASSPORT */}
            {studentTab === "evidence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Skill Passport Header */}
                <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <span className="badge badge-verified" style={{ marginBottom: 6 }}>VERIFIABLE CREDENTIAL</span>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      Public Skill Passport: {passport?.title || "Data Analyst Proficiency"}
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>
                      Slug: <code style={{ color: "var(--accent-cyan)", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/passport/public/{passport?.share_slug}</code>
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={handleTogglePassportRevoke} className={passport?.is_revoked ? "btn btn-accent" : "btn btn-danger"}>
                      {passport?.is_revoked ? <Unlock size={15} /> : <Lock size={15} />}
                      {passport?.is_revoked ? "Re-activate Passport" : "Revoke Passport"}
                    </button>
                    <button onClick={() => handleOpenPublicPassport(passport?.share_slug)} className="btn btn-primary">
                      <Share2 size={15} /> View Public Credential
                    </button>
                  </div>
                </div>

                {/* 5-Tier Evidence Breakdown Card */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>5-Tier Objective Evidence Portfolio</h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                        Distinguishes self-reported, resume-extracted, assessment-verified, project-verified, and mentor-endorsed proof.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => setAddSelfSkillModalOpen(true)} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <PlusCircle size={15} /> Add Self-Reported Skill
                      </button>
                      <button onClick={() => setProjectModalOpen(true)} className="btn btn-accent" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <PlusCircle size={15} /> Submit Project Proof
                      </button>
                    </div>
                  </div>

                  {/* Tier Filter Tabs */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {[
                      { key: "all", label: `All (${myEvidence.length})` },
                      { key: "verified", label: `Verified (${myEvidence.filter(e => ["assessed", "project", "mentor_endorsed"].includes((e.evidence_type || "").toLowerCase())).length})` },
                      { key: "resume_extracted", label: `Resume (${myEvidence.filter(e => (e.evidence_type || "").toLowerCase() === "resume_extracted").length})` },
                      { key: "self_reported", label: `Self-Reported (${myEvidence.filter(e => (e.evidence_type || "").toLowerCase() === "self_reported").length})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setEvidenceFilter(tab.key)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          border: "1px solid var(--border-subtle)",
                          background: evidenceFilter === tab.key ? "var(--primary)" : "rgba(255,255,255,0.03)",
                          color: evidenceFilter === tab.key ? "#fff" : "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const filtered = myEvidence.filter((ev) => {
                      const et = (ev.evidence_type || "").toLowerCase();
                      if (evidenceFilter === "verified") return ["assessed", "project", "mentor_endorsed"].includes(et);
                      if (evidenceFilter === "resume_extracted" || evidenceFilter === "resume") return et === "resume_extracted";
                      if (evidenceFilter === "self_reported" || evidenceFilter === "self") return et === "self_reported";
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", background: "rgba(255,255,255,0.01)", borderRadius: 10, border: "1px dashed var(--border-subtle)" }}>
                          No evidence items recorded in this tier. Click <strong>"Add Self-Reported Skill"</strong> or take an assessment to register evidence.
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                        {filtered.map((ev) => {
                          const et = (ev.evidence_type || "self_reported").toLowerCase();
                          return (
                            <div key={ev.id} style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                                    {ev.skill?.canonical_name || ev.skill_name || `Skill #${ev.skill_id}`}
                                  </div>
                                  <span className={`badge badge-${['mentor_endorsed', 'assessed', 'project'].includes(et) ? 'verified' : et === 'resume_extracted' ? 'synthetic' : 'self-reported'}`}>
                                    {et.replace(/_/g, ' ').toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 8 }}>
                                  {ev.source_description || ev.proof_summary || "Demonstrated in platform curriculum"}
                                </div>
                              </div>

                              <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  Conf: <strong style={{ color: "var(--accent-cyan)" }}>{Math.round((ev.confidence_score || 0.8) * 100)}%</strong> · Level: <span style={{ textTransform: "capitalize", color: "var(--text-primary)" }}>{ev.level || "intermediate"}</span>
                                </div>
                                {et !== "assessed" && (
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button
                                      onClick={() => { setSelectedEvidenceForEdit(ev); setEditEvidenceModalOpen(true); }}
                                      className="btn btn-secondary"
                                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                      title="Edit proficiency level or notes"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEvidence(ev.id)}
                                      className="btn btn-danger"
                                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                      title="Remove evidence"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 3: ATS RESUME SCANNER & BUILDER */}
            {studentTab === "resume" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Mode Selector Toggle */}
                <div style={{ display: "flex", gap: 8, padding: 4, background: "var(--badge-bg)", borderRadius: 10, width: "fit-content", border: "1px solid var(--border-subtle)" }}>
                  <button
                    onClick={() => setResumeMode("builder")}
                    className={`btn ${resumeMode === "builder" ? "btn-primary" : "btn-secondary"}`}
                    style={{ fontSize: "0.82rem", padding: "6px 16px" }}
                  >
                    <FileText size={15} /> AI Resume Builder & Export Studio
                  </button>
                  <button
                    onClick={() => setResumeMode("scanner")}
                    className={`btn ${resumeMode === "scanner" ? "btn-primary" : "btn-secondary"}`}
                    style={{ fontSize: "0.82rem", padding: "6px 16px" }}
                  >
                    <Sparkles size={15} /> ATS Resume Scanner & Parser
                  </button>
                </div>

                {resumeMode === "builder" ? (
                  <ResumeBuilder
                    user={user}
                    studentProfile={studentProfile}
                    employeeProfile={employeeProfile}
                    targetRole={dashboardData?.target_role || { title: studentProfile?.target_role_title || "Data Analyst" }}
                    myEvidence={myEvidence}
                  />
                ) : (
                  <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Sparkles size={22} color="var(--primary)" />
                      <div>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          Explainable ATS Resume & Project Scanner
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          Strictly fact-based: extracted candidate skills will <strong>never</strong> enter your verified profile until you confirm them.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                      {/* File Upload Box */}
                      <div style={{ padding: 18, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                          <UploadCloud size={18} color="var(--accent-cyan)" /> Upload Resume File (PDF, DOCX, TXT)
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          Secure document parsing. Extracted text is analyzed against your target role for skill matches and readability.
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={handleUploadResumeFile}
                          disabled={uploadingResume}
                          style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}
                        />
                        {uploadingResume && <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)" }}>Parsing document and extracting candidate skills...</span>}
                      </div>

                      {/* Manual Paste Box */}
                      <div style={{ padding: 18, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                          <FileText size={18} color="var(--accent-emerald)" /> Or Paste Resume / Experience Text
                        </div>
                        <textarea
                          className="input-field"
                          rows={3}
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Paste work experience, project descriptions, or technical competencies..."
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button onClick={handleExtractResumeSkills} disabled={extractingResume || !resumeText.trim()} className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
                            {extractingResume ? "Scanning..." : "Scan Pasted Text"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Skills Extracted Review & Confirmation */}
                    {extractedSkills.length > 0 && (
                      <div style={{ marginTop: 8, padding: 16, borderRadius: 10, background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                              Candidate Skills Extracted ({extractedSkills.length}) - Review & Confirm:
                            </h4>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              Uncheck any skill that was extracted incorrectly or out of context. Only checked skills will enter your Tier 2 Resume-Extracted profile.
                            </p>
                          </div>
                          <button onClick={handleConfirmResumeSkills} disabled={actionLoading} className="btn btn-accent" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
                            <CheckCircle2 size={16} /> Confirm Checked Skills to Profile
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                          {extractedSkills.map((sk, i) => {
                            const isChecked = candidateConfirmedSkills[sk.skill] !== false;
                            return (
                              <label key={i} style={{ padding: "8px 12px", borderRadius: 8, background: isChecked ? "rgba(99, 102, 241, 0.18)" : "rgba(255,255,255,0.03)", border: `1px solid ${isChecked ? "rgba(99, 102, 241, 0.4)" : "var(--border-subtle)"}`, display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => setCandidateConfirmedSkills({ ...candidateConfirmedSkills, [sk.skill]: e.target.checked })}
                                  style={{ marginTop: 3 }}
                                />
                                <div>
                                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{sk.skill}</div>
                                  <div style={{ color: "var(--accent-cyan)", fontSize: "0.75rem" }}>{Math.round((sk.confidence || 0.8) * 100)}% match confidence</div>
                                  {sk.matched_span && <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: 2 }}>matched: "{sk.matched_span}"</div>}
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        {atsSuggestions.length > 0 && (
                          <div style={{ marginTop: 8, padding: 14, borderRadius: 8, background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 6 }}>ATS Formatting & Readability Recommendations:</div>
                            <ul style={{ paddingLeft: 20, fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                              {atsSuggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Uploaded Resumes on File Management */}
                    <div style={{ marginTop: 8 }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText size={16} color="var(--primary)" /> Resumes Stored in Profile ({uploadedResumes.length})
                      </h4>
                      {uploadedResumes.length === 0 ? (
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No resumes uploaded yet. Upload your PDF/DOCX to store evidence and generate role gap alignments.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {uploadedResumes.map((r) => (
                            <div key={r.id} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                              <div>
                                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{r.filename}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  Target Role: {r.target_role || "General"} · Uploaded: {new Date(r.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteResume(r.id)}
                                disabled={actionLoading}
                                className="btn btn-secondary"
                                style={{ fontSize: "0.75rem", padding: "4px 10px", color: "var(--accent-danger-text)" }}
                                title="Securely delete resume file"
                              >
                                <Trash2 size={13} /> Delete File
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AI MOCK INTERVIEW STUDIO */}
            {studentTab === "mock_interview" && (
              <MockInterviewStudio
                user={user}
                targetRole={dashboardData?.target_role || { title: studentProfile?.target_role_title || "Data Analyst" }}
                onOpenWallet={openWalletModal}
                creditBalance={creditBalance}
                onInterviewComplete={() => { if (activeRole === "student") loadStudentView(); }}
              />
            )}

            {/* TAB 5: OPPORTUNITIES & APPLICATION TRACKER */}
            {studentTab === "jobs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Application Tracking Kanban-style List */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckSquare size={18} color="var(--accent-emerald)" /> Active Application Tracker ({savedJobs.length} Opportunities)
                  </h3>

                  {savedJobs.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No saved opportunities yet. Save matching roles below to track your applications!</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {savedJobs.map((item) => (
                        <div key={item.id} style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{item.job_posting?.title || `Posting #${item.job_posting_id}`}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.job_posting?.company} · {item.job_posting?.location}</div>
                            {item.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>Note: {item.notes}</div>}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateAppStatus(item.id, e.target.value)}
                              className="input-field"
                              style={{ padding: "6px 10px", fontSize: "0.8rem", width: "auto" }}
                            >
                              <option value="saved">Saved</option>
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offered">Offered</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <span className="badge badge-verified">{item.status.toUpperCase()}</span>
                            <button
                              onClick={() => handleDeleteSavedOpportunity(item.id)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 10px", fontSize: "0.75rem", color: "var(--accent-danger-text)" }}
                              title="Remove opportunity from tracking"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Matches Radar */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <Briefcase size={18} color="var(--primary)" /> Transparent Opportunity Matches
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
                    {jobMatches.map((jm, i) => (
                      <div key={i} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{jm.job.title}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{jm.job.company} · {jm.job.location}</div>
                          </div>
                          <span className="badge badge-verified">{Math.round(jm.match_score * 100)}% Match</span>
                        </div>

                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 10 }}>
                          {jm.explanation}
                        </div>

                        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Source: {jm.job.source || "Naukri"}</span>
                          <button onClick={() => handleSaveJob(jm.job.id)} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
                            Save Opportunity
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: COURSES & MENTORS MARKETPLACE */}
            {studentTab === "courses" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Courses Section */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={18} color="var(--accent-cyan)" /> Gap-Targeted Courses (Free First)
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
                    {courses.map((rec, i) => {
                      const isEnrolled = myEnrollments.some(e => e.course_id === rec.course.id);
                      return (
                        <div key={i} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{rec.course.title}</div>
                            <span className="badge badge-verified">{rec.course.is_free ? "FREE" : `₹${rec.course.price}`}</span>
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 8 }}>
                            {rec.explanation}
                          </div>
                          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{rec.course.duration_hours} Hours</span>
                            {isEnrolled ? (
                              <span className="badge badge-verified">Enrolled</span>
                            ) : (
                              <button onClick={() => handleEnrollCourse(rec.course)} className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
                                {rec.course.is_free ? "Enroll Free" : "Purchase (Sandbox)"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mentors Section */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <UserCheck size={18} color="var(--accent-emerald)" /> Verified Mentors & 1-on-1 Sessions
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
                    {mentorsList.map((m) => (
                      <div key={m.id} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{m.user?.full_name || "Verified Mentor"}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>{m.years_experience} Years Exp · {m.languages?.join(", ") || "English"}</div>
                          </div>
                          <span className="badge badge-verified">Verified</span>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 8 }}>{m.bio}</p>
                        <div style={{ marginTop: 14 }}>
                          <button
                            onClick={() => handleOpenBookingModal({ id: 1, title: `1-on-1 Guidance with ${m.user?.full_name}`, duration_minutes: 45, price: 500 })}
                            className="btn btn-primary"
                            style={{ fontSize: "0.75rem", width: "100%" }}
                          >
                            <Calendar size={13} /> Book 1-on-1 Session (Sandbox)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduled Mentorship Sessions */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={18} color="var(--primary)" /> My Scheduled Mentorship Sessions ({myBookings.length})
                  </h3>

                  {myBookings.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      No sessions scheduled yet. Book a verified mentor above for 1-on-1 career guidance or code reviews.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {myBookings.map((b) => (
                        <div key={b.id} style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{b.offering?.title || `Session #${b.id}`}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Scheduled: {new Date(b.scheduled_at).toLocaleString()} · Status: <span style={{ color: b.status === "confirmed" ? "var(--accent-emerald)" : "var(--accent-rose)", fontWeight: 600 }}>{b.status.toUpperCase()}</span>
                            </div>
                            {b.meeting_link && (
                              <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", marginTop: 4 }}>
                                Video Room: <a href={b.meeting_link} target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "underline" }}>{b.meeting_link}</a>
                              </div>
                            )}
                          </div>
                          {b.status !== "cancelled" && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              disabled={actionLoading}
                              className="btn btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "6px 12px", color: "var(--accent-danger-text)" }}
                            >
                              Cancel Session
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE 2: EMPLOYEE VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeRole === "employee" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Employee Subtab Bar */}
            <div className="subtab-bar">
              <button className={`subtab-btn ${employeeTab === "dashboard" ? "active" : ""}`} onClick={() => setEmployeeTab("dashboard")}>
                <Compass size={16} /> Command Center & Goals
              </button>
              <button className={`subtab-btn ${employeeTab === "transition" ? "active" : ""}`} onClick={() => setEmployeeTab("transition")}>
                <TrendingUp size={16} /> Transferable Skills & Role Tasks
              </button>
              <button className={`subtab-btn ${employeeTab === "roadmap" ? "active" : ""}`} onClick={() => setEmployeeTab("roadmap")}>
                <Layers size={16} /> Adaptive Roadmap
              </button>
              <button className={`subtab-btn ${employeeTab === "evidence" ? "active" : ""}`} onClick={() => setEmployeeTab("evidence")}>
                <Award size={16} /> Evidence & Skill Passport
              </button>
              <button className={`subtab-btn ${employeeTab === "resume" ? "active" : ""}`} onClick={() => setEmployeeTab("resume")}>
                <Sparkles size={16} /> Executive ATS Resume
              </button>
              <button className={`subtab-btn ${employeeTab === "jobs" ? "active" : ""}`} onClick={() => setEmployeeTab("jobs")}>
                <Briefcase size={16} /> Opportunities Radar ({jobMatches.length})
              </button>
              <button className={`subtab-btn ${employeeTab === "mentors" ? "active" : ""}`} onClick={() => setEmployeeTab("mentors")}>
                <Users size={16} /> Mentors & Advisory
              </button>
            </div>

            {/* ════════ SUBTAB 1: COMMAND CENTER & PRIVATE GOALS ════════ */}
            {employeeTab === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Employee Profile Header */}
                <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="badge badge-verified">EMPLOYEE PROFESSIONAL</span>
                      <span className="badge badge-self-reported">VERIFIED ACCOUNT</span>
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                      {user?.full_name || "Professional"}
                    </h1>
                    <div style={{ fontSize: "1rem", color: "var(--accent-cyan)", fontWeight: 600, marginTop: 4 }}>
                      {employeeProfile?.current_role || "Professional"} · {employeeProfile?.current_company || "Organization Not Specified"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 10, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      <span>Experience: <strong style={{ color: "var(--text-primary)" }}>{employeeProfile?.years_experience || 0} Years</strong></span>
                      <span>Industry: <strong style={{ color: "var(--text-primary)" }}>{employeeProfile?.industry || "Technology & Operations"}</strong></span>
                      <span>Target Role: <strong style={{ color: "var(--accent-emerald)" }}>{dashboardData?.target_role?.title || "Leadership Track"}</strong></span>
                      <span>Schedule: <strong style={{ color: "var(--text-primary)" }}>{employeeProfile?.learning_schedule || "Flexible"}</strong></span>
                      <span>Intent: <strong style={{ color: "var(--accent-cyan)" }}>{employeeProfile?.career_change_intent || "Active Growth"}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditEmployeeModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Edit2 size={15} /> Edit Professional Profile & Goals
                  </button>
                </div>

                {/* Private Career Goal Card */}
                <div style={{ padding: 20, borderRadius: 12, background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <Shield size={24} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Private Career Goal</h3>
                        <span className="badge badge-verified" style={{ fontSize: "0.7rem" }}><Lock size={10} style={{ marginRight: 3 }} /> CONFIDENTIAL TO YOU</span>
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--accent-cyan)", margin: "4px 0 0 0", fontWeight: 500 }}>
                        "{employeeProfile?.career_goal || "Upskilling toward Senior / Lead competencies and internal promotion"}"
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                        Strictly confidential: Protected by GrowSphere access isolation. Hidden from your employer ({employeeProfile?.current_company || "organization"}), course sellers, and public searches.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>MODE:</div>
                    <select
                      value={goalMode}
                      onChange={async (e) => {
                        setGoalMode(e.target.value);
                        await api.updateEmployeeProfile({ goal_mode: e.target.value });
                        showNotification(`Career goal mode updated to ${e.target.value}!`);
                      }}
                      className="input-field"
                      style={{ width: "auto", fontSize: "0.8rem", padding: "6px 10px" }}
                    >
                      <option value="promotion">Internal Promotion</option>
                      <option value="reskilling">Cross-Disciplinary Reskilling</option>
                      <option value="career_switch">Full Career Switch</option>
                    </select>
                  </div>
                </div>

                {/* Recommended Next Career Action */}
                {dashboardData?.next_action && (
                  <div style={{ padding: 18, borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Sparkles size={22} color="var(--accent-emerald)" />
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-emerald)", textTransform: "uppercase" }}>Recommended Next Career Action</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>{dashboardData.next_action.title}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{dashboardData.next_action.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTriggerNextAction(dashboardData.next_action)}
                      className="btn btn-primary"
                      style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                    >
                      {dashboardData.next_action.action_label || "Execute Action"} <ArrowRight size={14} style={{ marginLeft: 6 }} />
                    </button>
                  </div>
                )}

                {/* Professional Metrics Overview Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <div className="glass-panel" style={{ padding: 18 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Target Role Readiness</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-cyan)", marginTop: 4 }}>
                      {Math.round((dashboardData?.readiness_score || 0) * 100)}%
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                      Target: {dashboardData?.target_role?.title || "Leadership Track"}
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: 18 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Transferable Overlap</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-emerald)", marginTop: 4 }}>
                      {Math.round((transitionAnalysis?.overlap_percentage || 0.6) * 100)}%
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                      Est. Effort: ~{transitionAnalysis?.estimated_effort_weeks || 8} Weeks
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: 18 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Roadmap Completion</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                      {roadmapData?.completed_topics || 0} / {roadmapData?.total_topics || 0}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                      Active Milestone Topics
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: 18 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Verified Skills</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)", marginTop: 4 }}>
                      {myEvidence.filter(e => e.evidence_type !== "SELF_REPORTED").length}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                      Across Tiers 2–5
                    </div>
                  </div>
                </div>

                {/* Two Columns: Skills Snapshot & Career Actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Left Column: Target Competencies & Transferable Skills */}
                  <div className="glass-panel" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                        Target Competency Snapshot ({gapData?.skill_details?.length || 0})
                      </h3>
                      <button onClick={() => setEmployeeTab("transition")} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                        View Full Matrix →
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {gapData?.skill_details?.slice(0, 5).map((item, idx) => (
                        <div key={idx} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{item.skill.canonical_name}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Target Competency</div>
                          </div>
                          <span className={`badge badge-${item.status}`}>{item.status.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Scheduled Advisory & Top Opportunities */}
                  <div className="glass-panel" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                        Leadership Opportunities Radar ({jobMatches.length})
                      </h3>
                      <button onClick={() => setEmployeeTab("jobs")} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                        View All →
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {jobMatches.slice(0, 3).map((jm, i) => (
                        <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{jm.job.title}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{jm.job.company} · {jm.job.location}</div>
                          </div>
                          <span className="badge badge-verified">{Math.round(jm.match_score * 100)}% Match</span>
                        </div>
                      ))}
                      {jobMatches.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No matched opportunities currently loaded. Switch target role to explore openings.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════ SUBTAB 2: TRANSFERABLE SKILLS & ROLE TASKS ════════ */}
            {employeeTab === "transition" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {transitionAnalysis && (
                  <div className="glass-panel" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                      <div>
                        <span className="badge badge-verified" style={{ marginBottom: 6 }}>CAREER SWITCH & PROMOTION ESTIMATION</span>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                          {transitionAnalysis.current_role} → {transitionAnalysis.target_role}
                        </h2>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TRANSFERABLE MATCH</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
                          {Math.round(transitionAnalysis.overlap_percentage * 100)}%
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>
                          Est. Effort: ~{transitionAnalysis.estimated_effort_weeks} Weeks (Estimate)
                        </div>
                      </div>
                    </div>

                    {/* Uncertainty Notice */}
                    <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
                      <strong>Notice on Timeline Estimates:</strong> Effort estimates represent heuristic guidelines calculated from prerequisite topic complexity at an assumed 8-10 hours/week pace. Actual velocity varies by individual background and prior hands-on exposure.
                    </div>

                    {/* 3-Column Skills Matrix */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                      {/* Column 1: Direct Transferable */}
                      <div style={{ padding: 16, borderRadius: 10, background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                        <div style={{ fontWeight: 700, color: "var(--accent-emerald)", marginBottom: 8, fontSize: "0.9rem" }}>
                          ✓ Direct Transferable Skills ({transitionAnalysis.transferable_skills?.length || 0}):
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {transitionAnalysis.transferable_skills?.map((s, i) => (
                            <span key={i} className="badge badge-verified">{s}</span>
                          ))}
                          {(!transitionAnalysis.transferable_skills || transitionAnalysis.transferable_skills.length === 0) && (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Column 2: Needs Stronger Evidence */}
                      <div style={{ padding: 16, borderRadius: 10, background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                        <div style={{ fontWeight: 700, color: "var(--accent-warning)", marginBottom: 8, fontSize: "0.9rem" }}>
                          ⚡ Needs Stronger Evidence:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {myEvidence.filter(e => e.evidence_type === "SELF_REPORTED").map((e, i) => (
                            <span key={i} className="badge badge-self-reported">{e.skill?.canonical_name || "Self-reported"} (Baseline)</span>
                          ))}
                          {myEvidence.filter(e => e.evidence_type === "SELF_REPORTED").length === 0 && (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>All current skills backed by Tier 2+ evidence.</span>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Skill Gaps to Close */}
                      <div style={{ padding: 16, borderRadius: 10, background: "rgba(244, 63, 94, 0.05)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                        <div style={{ fontWeight: 700, color: "var(--accent-danger-text)", marginBottom: 8, fontSize: "0.9rem" }}>
                          ✕ Skill Gaps to Close ({transitionAnalysis.missing_skills?.length || 0}):
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {transitionAnalysis.missing_skills?.map((s, i) => (
                            <span key={i} className="badge badge-gap">{s}</span>
                          ))}
                          {(!transitionAnalysis.missing_skills || transitionAnalysis.missing_skills.length === 0) && (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No gaps identified!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Practical Role-Based Tasks Sandbox */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                        Real-World Practical Role Tasks (Tier 4 Project Verification)
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                        Submissions are scored against rigorous production rubrics to earn verified Project Evidence on your Skill Passport.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {roleTasks.map((t) => (
                      <div key={t.id} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{t.title}</div>
                          <span className="badge badge-verified">Rubric Validated</span>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 6 }}>{t.prompt_text}</p>
                        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Enter solution URL, GitHub PR, or artifact documentation link..."
                            value={selectedTaskSubmission}
                            onChange={(e) => setSelectedTaskSubmission(e.target.value)}
                            className="input-field"
                            style={{ flex: 1 }}
                          />
                          <button
                            onClick={async () => {
                              if (!selectedTaskSubmission) return;
                              setSubmittingTask(true);
                              try {
                                const res = await api.submitRoleTask(t.id, "Executive task completed", selectedTaskSubmission);
                                showNotification(res.feedback || "Practical role task submitted for rubric evaluation!");
                                setSelectedTaskSubmission("");
                                await loadEmployeeView();
                              } catch (err) {
                                alert("Submission error: " + err.message);
                              } finally {
                                setSubmittingTask(false);
                              }
                            }}
                            disabled={submittingTask}
                            className="btn btn-primary"
                          >
                            {submittingTask ? "Evaluating..." : "Submit Solution"}
                          </button>
                        </div>
                      </div>
                    ))}
                    {roleTasks.length === 0 && (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No simulation tasks defined for this target role.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ════════ SUBTAB 3: ADAPTIVE ROADMAP ════════ */}
            {employeeTab === "roadmap" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="glass-panel" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
                    <div>
                      <span className="badge badge-verified" style={{ marginBottom: 6 }}>ADAPTIVE EXECUTIVE ROADMAP</span>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                        Sequential Learning & Verification Milestones
                      </h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                        Target: <strong>{roadmapData?.target_role?.title || "Senior Competency Track"}</strong> · Total Topics: {roadmapData?.total_topics || 0}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        onClick={async () => {
                          await api.regenerateRoadmap();
                          showNotification("Roadmap refreshed against your latest verified evidence!");
                          await loadEmployeeView();
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <RefreshCw size={14} /> Refresh Roadmap
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {roadmapData?.topics?.map((topic, i) => (
                      <div key={topic.id || i} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${topic.is_completed ? "rgba(16, 185, 129, 0.4)" : "var(--border-subtle)"}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 800, color: topic.is_completed ? "var(--accent-emerald)" : "#fff", fontSize: "1rem" }}>
                              {i + 1}. {topic.title}
                            </span>
                            <span className={`badge ${topic.is_completed ? "badge-verified" : "badge-self-reported"}`}>
                              {topic.is_completed ? "VERIFIED / COMPLETED" : "IN PROGRESS"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                            Skill Category: <strong style={{ color: "var(--accent-cyan)" }}>{topic.skill?.canonical_name || "Technical Competency"}</strong>
                          </div>

                          {topic.prerequisites?.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Prerequisites:</span>
                              {topic.prerequisites.map((p, pi) => (
                                <span key={pi} className="badge badge-gap" style={{ fontSize: "0.68rem" }}>{p}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Est. {topic.estimated_hours || 6}h</span>
                          <button onClick={() => openStudyDeck(topic.id)} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
                            <BookOpen size={13} /> Study Deck
                          </button>
                          <button onClick={() => openQuiz(topic.assessment_id || 1)} className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
                            Take Assessment
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!roadmapData?.topics || roadmapData.topics.length === 0) && (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No roadmap generated yet. Select a target role to build your adaptive roadmap.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ════════ SUBTAB 4: EVIDENCE & SKILL PASSPORT ════════ */}
            {employeeTab === "evidence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* 5-Tier Evidence Matrix Header */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                    <div>
                      <span className="badge badge-verified" style={{ marginBottom: 6 }}>VERIFIABLE EVIDENCE MATRIX</span>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                        Professional Skill Passport & Evidence Records ({myEvidence.length})
                      </h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                        Distinguishes 5 distinct tiers: Self-Reported, Resume-Extracted, Assessment-Verified, Project-Verified, and Mentor-Endorsed.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={() => setAddSelfSkillModalOpen(true)} className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
                        <PlusCircle size={14} /> Add Self-Reported Skill
                      </button>
                      <button onClick={() => setProjectModalOpen(true)} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
                        <UploadCloud size={14} /> Submit Project Proof
                      </button>
                    </div>
                  </div>

                  {/* Evidence Filter Tabs */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    {["all", "verified", "resume", "self"].map((tabKey) => (
                      <button
                        key={tabKey}
                        onClick={() => setEvidenceFilter(tabKey)}
                        className={`btn ${evidenceFilter === tabKey ? "btn-primary" : "btn-secondary"}`}
                        style={{ fontSize: "0.75rem", padding: "6px 12px", textTransform: "capitalize" }}
                      >
                        {tabKey === "all" ? `All Evidence (${myEvidence.length})` : tabKey === "verified" ? "Verified (Tiers 3–5)" : tabKey === "resume" ? "Resume Extracted (Tier 2)" : "Self-Reported (Tier 1)"}
                      </button>
                    ))}
                  </div>

                  {/* Filtered Evidence Cards Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
                    {myEvidence
                      .filter((ev) => {
                        const et = (ev.evidence_type || "").toLowerCase();
                        if (evidenceFilter === "verified") return ["assessed", "project", "mentor_endorsed"].includes(et);
                        if (evidenceFilter === "resume") return et === "resume_extracted";
                        if (evidenceFilter === "self") return et === "self_reported";
                        return true;
                      })
                      .map((ev) => {
                        const et = (ev.evidence_type || "self_reported").toLowerCase();
                        return (
                          <div key={ev.id} style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                                  {ev.skill?.canonical_name || ev.skill_name || "Technical Competency"}
                                </div>
                                <span className={`badge badge-${['mentor_endorsed', 'assessed', 'project'].includes(et) ? 'verified' : et === 'resume_extracted' ? 'synthetic' : 'self-reported'}`}>
                                  {et.replace(/_/g, " ").toUpperCase()}
                                </span>
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", marginTop: 4 }}>
                                Proficiency Level: {ev.level || "Intermediate"}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 6 }}>
                                {ev.source_description || "Verified on platform"}
                              </div>
                            </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              Updated: {new Date(ev.verified_at || Date.now()).toLocaleDateString()}
                            </span>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => { setSelectedEvidenceForEdit(ev); setEditEvidenceModalOpen(true); }}
                                className="btn btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEvidence(ev.id)}
                                className="btn btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "0.72rem", color: "var(--accent-danger-text)" }}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Public Skill Passport & Revocation Controls */}
                {passport && (
                  <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Shield size={20} color="var(--primary)" />
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                          Cryptographic Skill Passport: {passport.passport_id}
                        </h3>
                        <span className={`badge ${passport.is_revoked ? "badge-gap" : "badge-verified"}`}>
                          {passport.is_revoked ? "REVOKED / PRIVATE" : "ACTIVE"}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 6 }}>
                        Public verification slug: <code style={{ color: "var(--accent-cyan)" }}>{passport.public_slug}</code>
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={handleTogglePassportRevoke}
                        disabled={actionLoading}
                        className={`btn ${passport.is_revoked ? "btn-accent" : "btn-secondary"}`}
                        style={{ fontSize: "0.8rem" }}
                      >
                        {passport.is_revoked ? <Unlock size={14} /> : <Lock size={14} />}
                        {passport.is_revoked ? "Re-Activate Passport Access" : "Revoke Public Access"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════ SUBTAB 5: EXECUTIVE ATS RESUME & BUILDER ════════ */}
            {employeeTab === "resume" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Mode Selector Toggle */}
                <div style={{ display: "flex", gap: 8, padding: 4, background: "var(--badge-bg)", borderRadius: 10, width: "fit-content", border: "1px solid var(--border-subtle)" }}>
                  <button
                    onClick={() => setResumeMode("builder")}
                    className={`btn ${resumeMode === "builder" ? "btn-primary" : "btn-secondary"}`}
                    style={{ fontSize: "0.82rem", padding: "6px 16px" }}
                  >
                    <FileText size={15} /> AI Executive Resume Builder
                  </button>
                  <button
                    onClick={() => setResumeMode("scanner")}
                    className={`btn ${resumeMode === "scanner" ? "btn-primary" : "btn-secondary"}`}
                    style={{ fontSize: "0.82rem", padding: "6px 16px" }}
                  >
                    <Sparkles size={15} /> ATS Scanner & Experience Parser
                  </button>
                </div>

                {resumeMode === "builder" ? (
                  <ResumeBuilder
                    user={user}
                    studentProfile={studentProfile}
                    employeeProfile={employeeProfile}
                    targetRole={dashboardData?.target_role || { title: employeeProfile?.current_role || "Leadership Candidate" }}
                    myEvidence={myEvidence}
                  />
                ) : (
                  <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Sparkles size={22} color="var(--primary)" />
                      <div>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                          Executive ATS Resume & Experience Scanner
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                          Strictly fact-based: extracted candidate skills will <strong>never</strong> enter your verified profile until you confirm them.
                        </p>
                      </div>
                    </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                  {/* Upload Box */}
                  <div style={{ padding: 18, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <UploadCloud size={18} color="var(--accent-cyan)" /> Upload Executive Resume (PDF, DOCX, TXT)
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      Secure document analysis. Extracted text is checked against target leadership competencies.
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleUploadResumeFile}
                      disabled={uploadingResume}
                      style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}
                    />
                    {uploadingResume && <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)" }}>Parsing document and extracting candidate skills...</span>}
                  </div>

                  {/* Manual Paste Box */}
                  <div style={{ padding: 18, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <FileText size={18} color="var(--accent-emerald)" /> Or Paste Resume / Experience Text
                    </div>
                    <textarea
                      className="input-field"
                      rows={3}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste executive experience, project achievements, or leadership competencies..."
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={handleExtractResumeSkills} disabled={extractingResume || !resumeText.trim()} className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
                        {extractingResume ? "Scanning..." : "Scan Pasted Text"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Candidate Skills Extracted Review & Confirmation */}
                {extractedSkills.length > 0 && (
                  <div style={{ marginTop: 8, padding: 16, borderRadius: 10, background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)", margin: 0 }}>
                          Candidate Skills Extracted ({extractedSkills.length}) - Review & Confirm:
                        </h4>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                          Uncheck any skill that was extracted incorrectly. Only checked skills enter your Tier 2 Resume-Extracted profile.
                        </p>
                      </div>
                      <button onClick={handleConfirmResumeSkills} disabled={actionLoading} className="btn btn-accent" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
                        <CheckCircle2 size={16} /> Confirm Checked Skills to Profile
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                      {extractedSkills.map((sk, i) => {
                        const isChecked = candidateConfirmedSkills[sk.skill] !== false;
                        return (
                          <label key={i} style={{ padding: "8px 12px", borderRadius: 8, background: isChecked ? "rgba(99, 102, 241, 0.18)" : "rgba(255,255,255,0.03)", border: `1px solid ${isChecked ? "rgba(99, 102, 241, 0.4)" : "var(--border-subtle)"}`, display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setCandidateConfirmedSkills({ ...candidateConfirmedSkills, [sk.skill]: e.target.checked })}
                              style={{ marginTop: 3 }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{sk.skill}</div>
                              <div style={{ color: "var(--accent-cyan)", fontSize: "0.75rem" }}>{Math.round((sk.confidence || 0.8) * 100)}% match confidence</div>
                              {sk.matched_span && <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: 2 }}>matched: "{sk.matched_span}"</div>}
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {atsSuggestions.length > 0 && (
                      <div style={{ marginTop: 8, padding: 14, borderRadius: 8, background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 6 }}>ATS Formatting & Readability Recommendations:</div>
                        <ul style={{ paddingLeft: 20, fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                          {atsSuggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Uploaded Resumes on File Management */}
                <div style={{ marginTop: 8 }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <FileText size={16} color="var(--primary)" /> Executive Resumes Stored ({uploadedResumes.length})
                  </h4>
                  {uploadedResumes.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No resumes uploaded yet. Upload your executive PDF/DOCX to store evidence and generate role gap alignments.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {uploadedResumes.map((r) => (
                        <div key={r.id} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{r.filename}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Target Role: {r.target_role || "Leadership"} · Uploaded: {new Date(r.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteResume(r.id)}
                            disabled={actionLoading}
                            className="btn btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 10px", color: "var(--accent-danger-text)" }}
                            title="Securely delete resume file"
                          >
                            <Trash2 size={13} /> Delete File
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

            {/* ════════ SUBTAB 6: OPPORTUNITIES RADAR & TRACKER ════════ */}
            {employeeTab === "jobs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Active Application Tracker */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckSquare size={18} color="var(--accent-emerald)" /> Professional Application Tracker ({savedJobs.length} Opportunities)
                  </h3>

                  {savedJobs.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No saved opportunities yet. Save matching roles below to track your applications!</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {savedJobs.map((item) => (
                        <div key={item.id} style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{item.job_posting?.title || `Posting #${item.job_posting_id}`}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.job_posting?.company} · {item.job_posting?.location}</div>
                            {item.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>Note: {item.notes}</div>}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateAppStatus(item.id, e.target.value)}
                              className="input-field"
                              style={{ padding: "6px 10px", fontSize: "0.8rem", width: "auto" }}
                            >
                              <option value="saved">Saved</option>
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offered">Offered</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <span className="badge badge-verified">{item.status.toUpperCase()}</span>
                            <button
                              onClick={() => handleDeleteSavedOpportunity(item.id)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 10px", fontSize: "0.75rem", color: "var(--accent-danger-text)" }}
                              title="Remove opportunity from tracking"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Matches Radar */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <Briefcase size={18} color="var(--primary)" /> Lateral & Leadership Opportunity Matches
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
                    {jobMatches.map((jm, i) => (
                      <div key={i} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{jm.job.title}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{jm.job.company} · {jm.job.location}</div>
                          </div>
                          <span className="badge badge-verified">{Math.round(jm.match_score * 100)}% Match</span>
                        </div>

                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 10 }}>
                          {jm.explanation}
                        </div>

                        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Source: {jm.job.source || "Naukri"}</span>
                          <button onClick={() => handleSaveJob(jm.job.id)} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
                            Save Opportunity
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════════ SUBTAB 7: EXECUTIVE MENTORS & ADVISORY ════════ */}
            {employeeTab === "mentors" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Mentors Directory */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <UserCheck size={18} color="var(--accent-emerald)" /> Executive Mentors & Leadership Advisors
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
                    {mentorsList.map((m) => (
                      <div key={m.id} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{m.user?.full_name || "Executive Mentor"}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>{m.years_experience} Years Exp · {m.languages?.join(", ") || "English"}</div>
                          </div>
                          <span className="badge badge-verified">Verified</span>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 8 }}>{m.bio}</p>
                        <div style={{ marginTop: 14 }}>
                          <button
                            onClick={() => handleOpenBookingModal({ id: 1, title: `Executive Advisory with ${m.user?.full_name}`, duration_minutes: 45, price: 500 })}
                            className="btn btn-primary"
                            style={{ fontSize: "0.75rem", width: "100%" }}
                          >
                            <Calendar size={13} /> Book Advisory Session (Sandbox)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduled Advisory Sessions */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={18} color="var(--primary)" /> Scheduled Advisory Sessions ({myBookings.length})
                  </h3>

                  {myBookings.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      No sessions scheduled yet. Book an executive advisor above for leadership coaching or role switch guidance.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {myBookings.map((b) => (
                        <div key={b.id} style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{b.offering?.title || `Session #${b.id}`}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Scheduled: {new Date(b.scheduled_at).toLocaleString()} · Status: <span style={{ color: b.status === "confirmed" ? "var(--accent-emerald)" : "var(--accent-rose)", fontWeight: 600 }}>{b.status.toUpperCase()}</span>
                            </div>
                            {b.meeting_link && (
                              <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", marginTop: 4 }}>
                                Video Room: <a href={b.meeting_link} target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "underline" }}>{b.meeting_link}</a>
                              </div>
                            )}
                          </div>
                          {b.status !== "cancelled" && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              disabled={actionLoading}
                              className="btn btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "6px 12px", color: "var(--accent-danger-text)" }}
                            >
                              Cancel Session
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE 3: COURSE SELLER VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeRole === "seller" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Seller Subtabs */}
            <div className="subtab-bar">
              <button className={`subtab-btn ${sellerTab === "courses" ? "active" : ""}`} onClick={() => setSellerTab("courses")}>
                <BookOpen size={16} /> Course Lifecycle Management ({sellerCourses.length})
              </button>
              <button className={`subtab-btn ${sellerTab === "demand" ? "active" : ""}`} onClick={() => setSellerTab("demand")}>
                <Sparkles size={16} /> Demand Intelligence & Catalog Gaps
              </button>
              <button className={`subtab-btn ${sellerTab === "ledger" ? "active" : ""}`} onClick={() => setSellerTab("ledger")}>
                <DollarSign size={16} /> Revenue, Commissions & Payouts
              </button>
            </div>

            {sellerTab === "courses" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header */}
                <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <span className="badge badge-verified" style={{ marginBottom: 6 }}>VERIFIED COURSE SELLER</span>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      {user?.full_name || "DataOrbit Academy"}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>
                      Lifecycle state machine: Draft → Submit for Moderation → Published → Paused → Archived
                    </p>
                  </div>
                  <button onClick={() => setNewCourseModalOpen(true)} className="btn btn-accent">
                    <PlusCircle size={16} /> Create New Course
                  </button>
                </div>

                {/* Course Lifecycle Cards */}
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                    My Course Catalog & Moderation Status
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {sellerCourses.map((c) => (
                      <div key={c.id} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>{c.title}</span>
                            <span className={`badge badge-${c.status === 'published' ? 'verified' : c.status === 'pending_review' ? 'self-reported' : 'quarantined'}`}>
                              {c.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                            {c.description}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", marginTop: 4 }}>
                            Price: {c.is_free ? "FREE" : `₹${c.price}`} · Duration: {c.duration_hours}h
                          </div>
                        </div>

                        {/* Lifecycle action buttons */}
                        <div style={{ display: "flex", gap: 8 }}>
                          {c.status === "draft" && (
                            <button onClick={() => handleUpdateCourseStatus(c.id, "pending_review")} className="btn btn-primary" style={{ fontSize: "0.75rem" }}>
                              Submit for Review
                            </button>
                          )}
                          {c.status === "published" && (
                            <button onClick={() => handleUpdateCourseStatus(c.id, "paused")} className="btn btn-secondary" style={{ fontSize: "0.75rem" }}>
                              Pause Listing
                            </button>
                          )}
                          {c.status === "paused" && (
                            <button onClick={() => handleUpdateCourseStatus(c.id, "published")} className="btn btn-primary" style={{ fontSize: "0.75rem" }}>
                              Resume Listing
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sellerTab === "ledger" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="glass-panel" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className="badge badge-verified" style={{ marginBottom: 6 }}>CREATOR MONETIZATION</span>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      Creator Revenue Split: 85% Creator / 15% Platform
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>
                      Payouts are settled idempotently via sandbox banking rails.
                    </p>
                  </div>
                  <button onClick={handleRequestPayout} className="btn btn-accent">
                    <DollarSign size={16} /> Request Payout
                  </button>
                </div>

                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                    Payout Settlement Records
                  </h3>
                  {sellerPayouts.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No payout records yet. Click "Request Payout" above to initiate one.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {sellerPayouts.map((p) => (
                        <div key={p.id} style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Payout #{p.id} · ₹{p.amount}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.payout_details}</div>
                          </div>
                          <span className="badge badge-verified">{p.status.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE 4: MENTOR VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeRole === "mentor" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Mentor Subtabs */}
            <div className="subtab-bar">
              <button className={`subtab-btn ${mentorTab === "bookings" ? "active" : ""}`} onClick={() => setMentorTab("bookings")}>
                <Calendar size={16} /> Mentorship Bookings & Sessions ({myBookings.length})
              </button>
              <button className={`subtab-btn ${mentorTab === "intelligence" ? "active" : ""}`} onClick={() => setMentorTab("intelligence")}>
                <Sparkles size={16} /> Mentor Intelligence & Analytics
              </button>
              <button className={`subtab-btn ${mentorTab === "availability" ? "active" : ""}`} onClick={() => setMentorTab("availability")}>
                <Clock size={16} /> Availability Schedule ({mentorAvailability.length} slots)
              </button>
              <button className={`subtab-btn ${mentorTab === "endorsements" ? "active" : ""}`} onClick={() => setMentorTab("endorsements")}>
                <Award size={16} /> Verified Learner Endorsements
              </button>
            </div>

            {/* Subtab 1: Bookings */}
            {mentorTab === "bookings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="glass-panel" style={{ padding: 24 }}>
                  <span className="badge badge-verified" style={{ marginBottom: 6 }}>MENTOR WORKFLOW</span>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {user?.full_name || "Dr. Aris Thorne"}
                  </h1>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>
                    Automated sandbox meeting links and RFC 5545 calendar integration.
                  </p>
                </div>

                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                    Bookings Queue & Session Management
                  </h3>

                  {myBookings.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No session bookings yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {myBookings.map((b) => (
                        <div key={b.id} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>Booking #{b.id}</span>
                              <span className={`badge badge-${b.status === 'confirmed' ? 'verified' : b.status === 'pending' ? 'self-reported' : 'quarantined'}`}>
                                {b.status.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                              Learner: Learner #{b.learner_id} · Notes: {b.learner_notes || "Career guidance"}
                            </div>
                            {b.session_link && (
                              <div style={{ marginTop: 6, fontSize: "0.75rem" }}>
                                <a href={b.session_link} target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 4 }}>
                                  <Video size={13} /> {b.session_link}
                                </a>
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setPreviewBooking(b)} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "6px 12px" }} title="Preview Learner Skill Passport">
                              <Eye size={13} /> Inspect Profile
                            </button>
                            {b.status === "pending" && (
                              <>
                                <button onClick={() => handleUpdateMentorBookingStatus(b.id, "confirmed")} className="btn btn-primary" style={{ fontSize: "0.75rem" }}>
                                  Accept & Generate Video Link
                                </button>
                                <button onClick={() => handleUpdateMentorBookingStatus(b.id, "cancelled")} className="btn btn-danger" style={{ fontSize: "0.75rem" }}>
                                  Decline
                                </button>
                              </>
                            )}
                            {b.status === "confirmed" && (
                              <button onClick={() => handleUpdateMentorBookingStatus(b.id, "completed")} className="btn btn-accent" style={{ fontSize: "0.75rem" }}>
                                Mark Completed
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subtab 2: Availability */}
            {mentorTab === "availability" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                    Add Recurring Availability Slot
                  </h3>
                  <form onSubmit={handleAddSlot} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Day of Week</label>
                      <select value={newSlot.day_of_week} onChange={(e) => setNewSlot({ ...newSlot, day_of_week: e.target.value })} className="input-field">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Start Time</label>
                      <input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>End Time</label>
                      <input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} className="input-field" />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ width: "100%" }}>
                        Add Slot
                      </button>
                    </div>
                  </form>
                </div>

                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                    Active Availability Slots
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    {mentorAvailability.map((slot) => (
                      <div key={slot.id} style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{slot.day_of_week}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)" }}>{slot.start_time} - {slot.end_time}</div>
                        </div>
                        <button onClick={() => handleDeleteSlot(slot.id)} style={{ background: "transparent", border: "none", color: "var(--accent-danger-text)", cursor: "pointer" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subtab 3: Endorsements */}
            {mentorTab === "endorsements" && (
              <div className="glass-panel" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Verified Mentor Endorsement Studio</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Endorsements grant learners the highest 5th-tier objective evidence rating (95% confidence).
                    </p>
                  </div>
                  <button onClick={() => setEndorseModalOpen(true)} className="btn btn-accent">
                    <Award size={16} /> Endorse Learner Skill
                  </button>
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Click "Endorse Learner Skill" to verify a student or employee who has demonstrated practical mastery in a session.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE 5: ADMIN / OPERATIONS CONSOLE
        ══════════════════════════════════════════════════════════════════ */}
        {activeRole === "admin" && (
          user?.role !== "admin" ? (
            <div className="glass-panel" style={{ padding: 40, textAlign: "center", maxWidth: 640, margin: "40px auto" }}>
              <div style={{ color: "var(--accent-danger)", marginBottom: 16 }}>
                <Shield size={48} />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                403 Forbidden: Restricted Admin Console
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                The Admin & Operations console is restricted to platform administrators with verified credentials.
                Your account is authenticated as <strong style={{ color: "var(--text-primary)" }}>{user?.email}</strong> with role <strong style={{ color: "var(--accent-warning)" }}>{user?.role}</strong>. Public accounts cannot access internal administrative operations.
              </p>
              <button
                onClick={() => {
                  setActiveRole(user?.role || "student");
                  loadRoleData(user?.role || "student");
                }}
                className="btn btn-primary"
              >
                Return to My {user?.role ? user.role.toUpperCase() : "STUDENT"} Workspace
              </button>
            </div>
          ) : (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Admin Subtabs */}
            <div className="subtab-bar">
              <button className={`subtab-btn ${adminTab === "moderation" ? "active" : ""}`} onClick={() => setAdminTab("moderation")}>
                <Shield size={16} /> Listing Moderation Queue ({moderationQueue.length})
              </button>
              <button className={`subtab-btn ${adminTab === "users" ? "active" : ""}`} onClick={() => setAdminTab("users")}>
                <Users size={16} /> User & Role Governance ({adminUsers.length})
              </button>
              <button className={`subtab-btn ${adminTab === "reports" ? "active" : ""}`} onClick={() => setAdminTab("reports")}>
                <AlertTriangle size={16} /> Safety & User Reports ({adminReports.length})
              </button>
              <button className={`subtab-btn ${adminTab === "metrics" ? "active" : ""}`} onClick={() => setAdminTab("metrics")}>
                <Activity size={16} /> Operational Metrics & Audit Logs
              </button>
              <button className={`subtab-btn ${adminTab === "governance" ? "active" : ""}`} onClick={() => setAdminTab("governance")}>
                <FileCheck size={16} /> Data Usage Register (28 Files)
              </button>
            </div>

            {/* Subtab 1: Moderation Queue */}
            {adminTab === "moderation" && (
              <div className="glass-panel" style={{ padding: 24 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                  Listing Moderation Queue (Mandatory recorded reason required)
                </h3>

                {moderationQueue.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Moderation queue is clean. All listings reviewed!</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {moderationQueue.map((item) => (
                      <div key={item.id} style={{ padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>{item.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>Type: {item.content_type} · Submitted by User #{item.user_id}</div>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 6 }}>{item.description}</p>
                          </div>
                          <span className="badge badge-self-reported">PENDING REVIEW</span>
                        </div>

                        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Mandatory review reason (e.g. Meets curriculum standards)..."
                            value={selectedModItem === item.id ? moderationReason : ""}
                            onChange={(e) => {
                              setSelectedModItem(item.id);
                              setModerationReason(e.target.value);
                            }}
                            className="input-field"
                            style={{ flex: 1 }}
                          />
                          <button onClick={() => handleReviewListing(item.id, "approve")} className="btn btn-accent" style={{ fontSize: "0.8rem" }}>
                            Approve
                          </button>
                          <button onClick={() => handleReviewListing(item.id, "reject")} className="btn btn-danger" style={{ fontSize: "0.8rem" }}>
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtab 2: User & Role Governance */}
            {adminTab === "users" && (
              <div className="glass-panel" style={{ padding: 24, overflowX: "auto" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                  Registered Users & RBAC Authorization
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                      <th style={{ padding: "10px 12px" }}>User ID</th>
                      <th style={{ padding: "10px 12px" }}>Full Name</th>
                      <th style={{ padding: "10px 12px" }}>Email</th>
                      <th style={{ padding: "10px 12px" }}>Active Role</th>
                      <th style={{ padding: "10px 12px" }}>Change Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 12px" }}>#{u.id}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{u.full_name}</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{u.email}</td>
                        <td style={{ padding: "10px 12px" }}><span className="badge badge-verified">{u.role}</span></td>
                        <td style={{ padding: "10px 12px" }}>
                          <select
                            value={u.role}
                            onChange={(e) => handlePromoteUserRole(u.id, e.target.value)}
                            className="input-field"
                            style={{ padding: "4px 8px", fontSize: "0.75rem", width: "auto" }}
                          >
                            <option value="student">student</option>
                            <option value="employee">employee</option>
                            <option value="seller">seller</option>
                            <option value="mentor">mentor</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Subtab 3: Safety & Reports */}
            {adminTab === "reports" && (
              <div className="glass-panel" style={{ padding: 24 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                  User Incident Reports & Safety Escalations
                </h3>
                {adminReports.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No active user reports.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {adminReports.map((r) => (
                      <div key={r.id} style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Report #{r.id} · {r.reason}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Reported by User #{r.reporter_id} · Details: {r.details}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleResolveReport(r.id, "resolved")} className="btn btn-accent" style={{ fontSize: "0.75rem" }}>Resolve</button>
                          <button onClick={() => handleResolveReport(r.id, "dismissed")} className="btn btn-secondary" style={{ fontSize: "0.75rem" }}>Dismiss</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtab 4: Operational Metrics & Audit Logs */}
            {adminTab === "metrics" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {adminMetrics && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    <div className="glass-panel" style={{ padding: 18 }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TOTAL REGISTERED USERS</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>{adminMetrics.total_users}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: 18 }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PUBLISHED COURSES</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-cyan)" }}>{adminMetrics.published_courses}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: 18 }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>MODERATION BACKLOG</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: adminMetrics.pending_moderation_listings > 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
                        {adminMetrics.pending_moderation_listings}
                      </div>
                    </div>
                    <div className="glass-panel" style={{ padding: 18 }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TOTAL ENROLLMENTS</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-emerald)" }}>{adminMetrics.total_enrollments}</div>
                    </div>
                  </div>
                )}

                <div className="glass-panel" style={{ padding: 24, overflowX: "auto" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
                    Immutable Security & Administrative Audit Logs
                  </h3>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                        <th style={{ padding: "8px 10px" }}>Log ID</th>
                        <th style={{ padding: "8px 10px" }}>Actor ID</th>
                        <th style={{ padding: "8px 10px" }}>Action</th>
                        <th style={{ padding: "8px 10px" }}>Target Entity</th>
                        <th style={{ padding: "8px 10px" }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminAuditLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "8px 10px" }}>#{log.id}</td>
                          <td style={{ padding: "8px 10px" }}>User #{log.actor_user_id || 'System'}</td>
                          <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--accent-cyan)" }}>{log.action}</td>
                          <td style={{ padding: "8px 10px" }}>{log.entity_type} #{log.entity_id}</td>
                          <td style={{ padding: "8px 10px", color: "var(--text-muted)" }}>{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subtab 5: Data Governance Register */}
            {adminTab === "governance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="glass-panel" style={{ padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <Shield size={24} color="var(--primary)" />
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      Authoritative Data Usage Register & Governance Matrix
                    </h1>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Verified accounting for all 28 physical files across 26 unique hashes. Strictly enforces quarantine of leaky student placement targets.
                  </p>

                  {registerSummary && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 16 }}>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>FILES ACCOUNTED FOR</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{registerSummary.total_files_accounted_for} / 28</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TOTAL RAW ROWS AUDITED</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-cyan)" }}>{registerSummary.total_raw_rows?.toLocaleString()}</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CANONICAL PROCESSED ROWS</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-emerald)" }}>{registerSummary.total_canonical_processed_rows?.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-panel" style={{ padding: 24, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                        <th style={{ padding: "10px 12px" }}>Source File</th>
                        <th style={{ padding: "10px 12px" }}>SHA-256 Hash</th>
                        <th style={{ padding: "10px 12px" }}>Raw Rows</th>
                        <th style={{ padding: "10px 12px" }}>Canonical Rows</th>
                        <th style={{ padding: "10px 12px" }}>Status</th>
                        <th style={{ padding: "10px 12px" }}>Governance Restrictions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registerRecords.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{r.source_filename}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "var(--text-muted)" }}>{r.sha256_hash?.slice(0, 12)}...</td>
                          <td style={{ padding: "10px 12px" }}>{r.raw_row_count ? r.raw_row_count.toLocaleString() : "—"}</td>
                          <td style={{ padding: "10px 12px", color: "var(--accent-emerald)", fontWeight: 700 }}>{r.processed_row_count ? r.processed_row_count.toLocaleString() : "0"}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span className={`badge badge-${r.status === 'quarantined' ? 'quarantined' : r.status === 'synthetic_demo' ? 'synthetic' : 'verified'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "var(--text-secondary)", maxWidth: 300 }}>{r.restrictions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          )
        )}
      </main>

      {/* ─── MODAL 1: PRACTICAL ASSESSMENT QUIZ ─── */}
      {quizModalOpen && activeQuiz && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span className="badge badge-verified" style={{ marginBottom: 4 }}>PRACTICAL ASSESSMENT</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{activeQuiz.title}</h2>
              </div>
              <button onClick={() => setQuizModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 20 }}>
              {activeQuiz.description} (Pass Threshold: {Math.round(activeQuiz.pass_threshold * 100)}%)
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {activeQuiz.questions?.map((q, qIdx) => (
                <div key={q.id} style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: 12 }}>
                    {qIdx + 1}. {q.question}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = quizAnswers[q.id] === opt;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            textAlign: "left",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            background: isSelected ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.02)",
                            border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                            color: isSelected ? "#ffffff" : "var(--text-secondary)",
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {quizResult && (
              <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: quizResult.passed ? "var(--accent-success-bg)" : "var(--accent-danger-bg)", border: quizResult.passed ? "1px solid var(--accent-success-border)" : "1px solid var(--accent-danger-border)" }}>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: quizResult.passed ? "var(--accent-emerald)" : "var(--accent-danger-text)" }}>
                  {quizResult.passed ? "🎉 Assessment Passed!" : "⚠️ Assessment Failed"}
                </div>
                <div style={{ fontSize: "0.875rem", marginTop: 4, color: "var(--text-primary)" }}>
                  Score: <strong>{Math.round(quizResult.score * 100)}%</strong> (Required: {Math.round(activeQuiz.pass_threshold * 100)}%)
                </div>
                <p style={{ fontSize: "0.8rem", color: quizResult.passed ? "var(--accent-emerald)" : "var(--accent-danger-text)", marginTop: 6 }}>
                  {quizResult.passed
                    ? "Proficiency verified and recorded on your learner profile! The next sequential topic in your roadmap has been unlocked."
                    : `Weak areas detected: ${quizResult.weak_areas?.join(", ") || "Core concepts"}. Review recommended learning resources before retrying.`}
                </p>
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setQuizModalOpen(false)} className="btn btn-secondary">
                {quizResult ? "Close" : "Cancel"}
              </button>
              {!quizResult && (
                <button
                  onClick={handleQuizSubmit}
                  disabled={submittingQuiz || Object.keys(quizAnswers).length < (activeQuiz.questions?.length || 0)}
                  className="btn btn-primary"
                >
                  {submittingQuiz ? "Grading..." : "Submit Answers"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: STUDY DECK & FLASHCARDS ─── */}
      {studyModalOpen && studyMaterials && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span className="badge badge-verified" style={{ marginBottom: 4 }}>TOPIC STUDY DECK</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{studyMaterials.topic_title}</h2>
              </div>
              <button onClick={() => setStudyModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            {studyMaterials.flashcards && studyMaterials.flashcards.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>Flashcard {activeCardIndex + 1} of {studyMaterials.flashcards.length}</span>
                  <span>Click card to flip</span>
                </div>

                <div
                  onClick={() => setCardFlipped(!cardFlipped)}
                  style={{
                    minHeight: 180,
                    padding: 24,
                    borderRadius: 14,
                    background: cardFlipped ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.04)",
                    border: cardFlipped ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-cyan)", marginBottom: 8, fontWeight: 700 }}>
                    {cardFlipped ? "Answer / Explanation" : "Question / Concept"}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {cardFlipped
                      ? studyMaterials.flashcards[activeCardIndex]?.back
                      : studyMaterials.flashcards[activeCardIndex]?.front}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    onClick={() => {
                      if (activeCardIndex > 0) {
                        setActiveCardIndex(activeCardIndex - 1);
                        setCardFlipped(false);
                      }
                    }}
                    disabled={activeCardIndex === 0}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (activeCardIndex < studyMaterials.flashcards.length - 1) {
                        setActiveCardIndex(activeCardIndex + 1);
                        setCardFlipped(false);
                      }
                    }}
                    disabled={activeCardIndex === studyMaterials.flashcards.length - 1}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {studyMaterials.study_notes && (
              <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Key Study Notes:</div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{studyMaterials.study_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 3: PROJECT EVIDENCE SUBMISSION ─── */}
      {projectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>Submit Practical Project Proof</h2>
              <button onClick={() => setProjectModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleAddProjectEvidence} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target Skill Demonstrated *</label>
                <select value={selectedSkillId} onChange={(e) => setSelectedSkillId(e.target.value)} required className="input-field">
                  <option value="">Select a skill...</option>
                  {allSkills.map(s => <option key={s.id} value={s.id}>{s.canonical_name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Project Title *</label>
                <input
                  type="text"
                  placeholder="e.g. End-to-End Sales Pipeline in SQL & Tableau"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Project / GitHub Repository URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/myname/sales-analytics"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Proof Summary & Metrics Demonstrated *</label>
                <textarea
                  rows={3}
                  placeholder="Describe your implementation, datasets queried, and measurable outcomes..."
                  value={projectProof}
                  onChange={(e) => setProjectProof(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setProjectModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-accent">Submit Project Proof</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: PUBLIC SKILL PASSPORT PREVIEW ─── */}
      {publicPassportModalOpen && publicPassportData && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span className="badge badge-verified" style={{ marginBottom: 4 }}>CRYPTOGRAPHIC PASSPORT</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{publicPassportData.full_name}'s Skill Passport</h2>
              </div>
              <button onClick={() => setPublicPassportModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            {publicPassportData.is_revoked ? (
              <div style={{ padding: 18, borderRadius: 12, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "var(--accent-danger-text)" }}>
                <AlertTriangle size={20} />
                <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 6 }}>Credential Revoked</div>
                <p style={{ fontSize: "0.85rem", marginTop: 4 }}>This Skill Passport has been revoked by the holder or platform compliance.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: 16, borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--accent-emerald)", fontSize: "1.1rem" }}>Status: Active & Verified</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Role: {publicPassportData.target_role || "Data Analyst"}</div>
                  </div>
                  <CheckCircle2 size={24} color="var(--accent-emerald)" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Demonstrated Evidence-Backed Skills:</div>
                  {publicPassportData.verified_skills?.map((s, idx) => (
                    <div key={idx} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.skill_name}</span>
                      <span className="badge badge-verified">{s.evidence_type} ({Math.round(s.confidence_score * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 5: WALLET & CREDITS LEDGER ─── */}
      {walletModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span className="badge badge-verified" style={{ marginBottom: 4 }}>IDEMPOTENT LEDGER</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>Credits & Ledger Balance</h2>
              </div>
              <button onClick={() => setWalletModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            {creditBalance && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: 20, borderRadius: 14, background: "rgba(99, 102, 241, 0.15)", border: "1px solid var(--primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 700 }}>AVAILABLE BALANCE</div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)" }}>{creditBalance.available_balance} Credits</div>
                  </div>
                  <button onClick={handleGrantBonusCredits} disabled={actionLoading} className="btn btn-primary">
                    + Grant 50 Sandbox Credits
                  </button>
                </div>

                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Ledger Activity Log:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {creditBalance.recent_transactions?.map((tx, idx) => (
                    <div key={idx} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{tx.description}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{new Date(tx.created_at).toLocaleString()}</div>
                      </div>
                      <span style={{ fontWeight: 700, color: tx.amount > 0 ? "var(--accent-emerald)" : "var(--accent-danger-text)" }}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 6: PRIVACY & GDPR DATA EXPORT ─── */}
      {privacyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>Privacy & GDPR Controls</h2>
              <button onClick={() => setPrivacyModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                  <input
                    type="checkbox"
                    checked={privacySettings.hide_current_employer}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, hide_current_employer: e.target.checked })}
                  />
                  <span>Hide my current employer and professional activity from recruiters</span>
                </label>
              </div>

              <div style={{ padding: 16, borderRadius: 10, background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Export All Personal Data (GDPR Article 20)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Download a machine-readable JSON archive of your entire profile and evidence.</div>
                </div>
                <button onClick={handleExportData} disabled={actionLoading} className="btn btn-secondary">
                  <Download size={14} /> Export JSON
                </button>
              </div>

              <div style={{ padding: 16, borderRadius: 10, background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--accent-danger-text)" }}>Permanent Account Deletion (Right to be Forgotten)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Irrevocably erases personal records, tokens, and evidence history.</div>
                </div>
                <button
                  onClick={async () => {
                    if (confirm("Are you certain you want to permanently delete your account? This action is irreversible.")) {
                      try {
                        await api.deleteUserAccount();
                        alert("Account deleted. Logging out.");
                        localStorage.removeItem("growsphere_token");
                        window.location.reload();
                      } catch (err) {
                        alert("Deletion error: " + err.message);
                      }
                    }
                  }}
                  className="btn btn-danger"
                >
                  <Trash2 size={14} /> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: CREATE COURSE LISTING (SELLER) ─── */}
      {newCourseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>Create Course Listing</h2>
              <button onClick={() => setNewCourseModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateCourse} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Course Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Practical SQL & Data Warehousing Masterclass"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Description *</label>
                <textarea
                  rows={3}
                  placeholder="Course summary and learning outcomes..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Price (INR)</label>
                  <input
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Duration (Hours)</label>
                  <input
                    type="number"
                    value={newCourse.duration_hours}
                    onChange={(e) => setNewCourse({ ...newCourse, duration_hours: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Skills Taught (comma-separated)</label>
                <input
                  type="text"
                  placeholder="SQL, Data Modeling, ETL"
                  value={newCourse.skills_taught}
                  onChange={(e) => setNewCourse({ ...newCourse, skills_taught: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setNewCourseModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">Create Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 8: ENDORSE LEARNER (MENTOR) ─── */}
      {endorseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>Endorse Learner Skill (Verified 5th Tier)</h2>
              <button onClick={() => setEndorseModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleEndorseLearner} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Learner User ID *</label>
                <input
                  type="number"
                  value={endorseTargetUserId}
                  onChange={(e) => setEndorseTargetUserId(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Skill to Endorse *</label>
                <select value={endorseSkillId} onChange={(e) => setEndorseSkillId(e.target.value)} required className="input-field">
                  <option value="">Select skill...</option>
                  {allSkills.map(s => <option key={s.id} value={s.id}>{s.canonical_name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Endorsement Rationale & Evaluation *</label>
                <textarea
                  rows={3}
                  placeholder="Demonstrated technical mastery during 1-on-1 code review session..."
                  value={endorseNotes}
                  onChange={(e) => setEndorseNotes(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setEndorseModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-accent">Submit Verified Endorsement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 9: CHECKOUT (PAYMENTS) ─── */}
      {checkoutModalOpen && checkoutCourse && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span className="badge badge-verified" style={{ marginBottom: 4 }}>SANDBOX CHECKOUT</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>Purchase {checkoutCourse.title}</h2>
              </div>
              <button onClick={() => setCheckoutModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--text-primary)" }}>
                  <span>Course Price:</span>
                  <span>₹{checkoutCourse.price}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                  <span>Platform Commission (15%):</span>
                  <span>₹{Math.round(checkoutCourse.price * 0.15)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--accent-emerald)", marginTop: 4 }}>
                  <span>Creator Earnings (85%):</span>
                  <span>₹{Math.round(checkoutCourse.price * 0.85)}</span>
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Note: Operates in sandbox payment mode with idempotent transaction guarantees. No real payment card is charged.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setCheckoutModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleExecuteCheckout} disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? "Processing..." : `Confirm Payment of ₹${checkoutCourse.price}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 10: MENTOR BOOKING ─── */}
      {bookingModalOpen && bookingOffering && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span className="badge badge-verified" style={{ marginBottom: 4 }}>MENTORSHIP BOOKING</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{bookingOffering.title}</h2>
              </div>
              <button onClick={() => setBookingModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Session Notes & Focus Areas</label>
                <textarea
                  rows={3}
                  placeholder="What would you like to focus on during this 45-minute session? (e.g. Resume critique, system design mock, portfolio project review)"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.82rem", color: "var(--text-primary)", cursor: "pointer", background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <input
                  type="checkbox"
                  checked={mentorShareConsent}
                  onChange={(e) => setMentorShareConsent(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <strong>Share Profile Evidence with Mentor:</strong> Grant this verified mentor view-only access to my active roadmap and verified skill passport for session prep. (Private goals, applications, and salary targets remain strictly confidential).
                </span>
              </label>

              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                A secure sandbox video link (<code style={{ color: "var(--accent-cyan)" }}>https://meeting.growsphere.dev/sandbox-...</code>) and calendar invite will be generated instantly upon confirmation.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setBookingModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleExecuteBooking} disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? "Scheduling..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 11: EDIT STUDENT PROFILE ─── */}
      <EditStudentProfileModal
        isOpen={editStudentModalOpen}
        onClose={() => setEditStudentModalOpen(false)}
        initialProfile={studentProfile}
        targetRoles={careerRoles}
        onSave={async (updatedData) => {
          await api.updateStudentProfile(updatedData);
          showNotification("Student profile & career goals updated!");
          setEditStudentModalOpen(false);
          await loadStudentView();
        }}
      />

      {/* ─── MODAL 12: EDIT EMPLOYEE PROFILE ─── */}
      <EditEmployeeProfileModal
        isOpen={editEmployeeModalOpen}
        onClose={() => setEditEmployeeModalOpen(false)}
        initialProfile={employeeProfile}
        targetRoles={careerRoles}
        onSave={async (updatedData) => {
          await api.updateEmployeeProfile(updatedData);
          showNotification("Employee profile & private goals updated!");
          setEditEmployeeModalOpen(false);
          await loadEmployeeView();
        }}
      />

      {/* ─── MODAL 13: ADD SELF-REPORTED SKILL ─── */}
      <AddSelfSkillModal
        isOpen={addSelfSkillModalOpen}
        onClose={() => setAddSelfSkillModalOpen(false)}
        skillsList={allSkills}
        onSave={async ({ skill_id, level, notes }) => {
          await api.addSelfReportedSkill(parseInt(skill_id), level, notes);
          showNotification("Self-reported baseline skill added to your profile!");
          setAddSelfSkillModalOpen(false);
          if (activeRole === "student") await loadStudentView();
          else await loadEmployeeView();
        }}
      />

      {/* ─── MODAL 14: EDIT EVIDENCE ─── */}
      <EditEvidenceModal
        isOpen={editEvidenceModalOpen}
        onClose={() => { setEditEvidenceModalOpen(false); setSelectedEvidenceForEdit(null); }}
        evidence={selectedEvidenceForEdit}
        onSave={async (evidenceId, { level, source_description }) => {
          await api.updateSkillEvidence(evidenceId, level, source_description);
          showNotification("Skill evidence record updated!");
          setEditEvidenceModalOpen(false);
          setSelectedEvidenceForEdit(null);
          if (activeRole === "student") await loadStudentView();
          else await loadEmployeeView();
        }}
      />
    </div>
  );
}
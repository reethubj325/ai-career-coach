import axios from "axios";

// ✅ Axios instance
const API = axios.create({ baseURL: "http://localhost:5000" });

// ===============================
// 🧍 User APIs
// ===============================
export const registerUser = async (userData) => {
  const response = await API.post("/api/register", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await API.post("/api/login", userData);
  return response.data;
};
// ==================== Forgot & Reset Password ====================

// 1️⃣ Send forgot password email
export const sendForgotPasswordEmail = async (email) => {
  try {
    const res = await API.post("/api/forgot-password", { email });
    return res.data; // { message: "Check your email to reset your password" }
  } catch (err) {
    console.error("Error sending forgot password email:", err);
    throw err;
  }
};

// 2️⃣ Reset password using token
export const resetPassword = async (token, newPassword) => {
  try {
    const res = await API.post("/api/reset-password", { token, newPassword });
    return res.data; // { message: "Password updated successfully" }
  } catch (err) {
    console.error("Error resetting password:", err);
    throw err;
  }
};

// ===============================
// FEEDBACK API
// ===============================
export const submitFeedback = async (feedback) => {
  try {
    const res = await API.post("/api/submit-feedback", { feedback });
    return res.data;
  } catch (err) {
    console.error("Error submitting feedback:", err);
    throw err;
  }
};

// ===============================
// 📄 Resume APIs
// ===============================
export const saveResume = async (resumeData) => {
  const response = await API.post("/api/resume", resumeData);
  return response.data;
};

export const getResume = async (userId) => {
  const response = await API.get(`/api/resume/${userId}`);
  return response.data;
};

// ===============================
// 🧠 Resume Enhancer
// ===============================
export const enhanceResume = async (form) => {
  try {
    const response = await API.post("/api/generate-resume", { form });
    return response.data.enhanced;
  } catch (error) {
    console.error("Resume Enhancement Error:", error);
    throw error;
  }
};

// ===============================
// 📄 Resume Analyzer
// ===============================
export const analyzeResume = async (file) => {
  if (!file) throw new Error("No file provided for analysis");

  const formData = new FormData();
  formData.append("resume", file); // Must match backend key

  try {
    const response = await API.post("/api/analyze-resume-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Validate response
    if (!response.data) {
      throw new Error("No data received from server");
    }

    return response.data;
  } catch (error) {
    console.error(
      "Resume Analysis Error:",
      error.response?.data || error.message || error
    );
    throw error;
  }
};

// ---- Interview Questions ----
export const getInterviewQuestions = async (topic) => {
  try {
    const res = await API.post("/api/interview-questions", { topic });
    return res.data;
  } catch (err) {
    console.error("Error fetching interview questions:", err);
    throw err;
  }
};

// ---- Ask Doubt ----
export const askDoubt = async (doubt) => {
  try {
    const res = await API.post("/api/ask-doubt", { doubt });
    return res.data;
  } catch (err) {
    console.error("Error resolving doubt:", err);
    throw err;
  }
};

// ---- Quiz Questions ----
export const getQuizQuestions = async (topic) => {
  try {
    const res = await API.post("/api/quiz-questions", { topic });
    return res.data;
  } catch (err) {
    console.error("Error fetching quiz questions:", err);
    throw err;
  }
};

// CAREER: IMPORTANT — return the roadmap text (string)
export const getCareerRoadmap = async (career) => {
  try {
    const res = await API.post("/api/career-guidance", { career });
    // backend returns { roadmap: "text..." }
    return res.data.roadmap;
  } catch (err) {
    console.error("Error fetching career roadmap:", err);
    throw err;
  }
};
// api.js
// ===============================
// 🎤 MOCK INTERVIEW APIs
// ===============================

// 1️⃣ Generate Questions (Upload Resume + Get Questions)
export const generateMockInterviewQuestions = async (resumeFile) => {
  const formData = new FormData();
  formData.append("resume", resumeFile); // MUST match backend field

  const res = await API.post(
    "/api/mock-interview/questions",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data; // returns { success, userId, questions }
};

// 2️⃣ Start Interview
export const startMockInterview = async (userId) => {
  const res = await API.post("/api/mock-interview/start", { userId });
  return res.data; // returns { success, questions }
};

// 3️⃣ Upload Interview Video
export const uploadInterviewVideo = async (file, userId) => {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("userId", userId);

  const res = await API.post(
    "/api/mock-interview/upload-video",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data; // returns { success, videoUrl }
};

// 4️⃣ Get Feedback
export const getMockInterviewFeedback = async (userId) => {
  const res = await API.get(`/api/mock-interview/feedback/${userId}`);
  return res.data; // returns { success, feedback }
};

// 5️⃣ Submit User Feedback
export const submitInterviewFeedback = async (feedback) => {
  const res = await API.post("/api/submit-feedback", { feedback });
  return res.data; // returns { message }
};


// ✅ FIXED: Export correct axios instance
export default API;

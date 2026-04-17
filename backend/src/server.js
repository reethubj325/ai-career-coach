import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// In-memory reset tokens (for simplicity; in production, store in DB)
const resetTokens = {};


// General upload (memory) – used by resume analyzer
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// 🔑 GEMINI AI setup  (MUST be before any genAI usage)
// ===============================
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY missing in .env file");
  process.exit(1);
}
console.log("🔑 GEMINI_API_KEY loaded successfully");
const genAI = new GoogleGenerativeAI(apiKey);

// ---------------------------------------------
// Extract text: pdf → text OR pdf → image → OCR
// ---------------------------------------------
// ===============================
// PDF TEXT EXTRACTION USING GEMINI
// ===============================
const extractPdfText = async (buffer) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      "Extract all text from this PDF. Return only plain text.",
    ]);

    return result.response.text();
  } catch (err) {
    console.error("PDF extraction failed:", err);
    return "";
  }
};

// ===============================
// 📌 MySQL Connection
// ===============================
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Reethubj123",
  database: process.env.DB_NAME || "career_coach",
});

db.getConnection()
  .then(() => console.log("MySQL connected"))
  .catch((err) => console.log("DB error:", err));

// ===============================
// 🧍 Register API
// ===============================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const [exists] = await db.query("SELECT id FROM user WHERE email = ?", [email]);
    if (exists.length > 0)
      return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    res.status(201).json({ message: "User registered successfully", userId: result.insertId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// 🔑 Login API
// ===============================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM user WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});// ==================== Forgot Password ====================
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const userSql = "SELECT id, email FROM users WHERE email = ?";
  db.query(userSql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!results.length) return res.status(404).json({ message: "Email not found" });

    const user = results[0];
    const token = crypto.randomBytes(32).toString("hex");
    resetTokens[token] = { userId: user.id, expires: Date.now() + 3600000 }; // 1 hour

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to send email" });
      }
      res.json({ message: "Check your email to reset your password" });
    });
  });
});

// ==================== Reset Password ====================
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: "Token & password required" });

  const tokenData = resetTokens[token];
  if (!tokenData || tokenData.expires < Date.now()) {
    return res.status(400).json({ message: "Token is invalid or expired" });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updateSql = "UPDATE users SET password = ? WHERE id = ?";
  db.query(updateSql, [hashedPassword, tokenData.userId], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });

    // Remove used token
    delete resetTokens[token];

    res.json({ message: "Password updated successfully" });
  });
});
// ===============================
// 📄 Resume Builder APIs
// ===============================
app.post("/api/resume", async (req, res) => {
  try {
    const { user_id, full_name, email, phone, linkedin, summary, skills, education, experience, projects } = req.body;

    if (!full_name || !email)
      return res.status(400).json({ message: "Full name and email are required" });

    await db.query(
      `INSERT INTO resumes 
      (user_id, full_name, email, phone, linkedin, summary, skills, education, experience, projects)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        full_name,
        email,
        phone,
        linkedin,
        summary,
        JSON.stringify(skills),
        JSON.stringify(education),
        JSON.stringify(experience),
        JSON.stringify(projects),
      ]
    );

    res.status(201).json({ message: "✅ Resume saved successfully!" });
  } catch (error) {
    console.error("❌ Error saving resume:", error);
    res.status(500).json({ message: "Failed to save resume", error: error.message });
  }
});
// ===============================
// 🧠 AI Resume Text Enhancer (FINAL VERSION)
// ===============================
app.post("/api/generate-resume", async (req, res) => {
  try {
    const { form } = req.body;

    if (!form) return res.status(400).json({ error: "Missing resume form data" });

    // Gemini Model Instance
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // ===============================
    //        AI PROMPT
    // ===============================
    const prompt = `
You are an expert ATS-friendly resume writer. Rewrite the user's resume content to be
professional, concise, and achievement-focused.

STRICT RULES:

1) Return ONLY valid JSON. NO markdown, NO backticks.
2) Headings remain UPPERCASE.
3) Skills as an array of keyword strings.
4) After EACH section (SUMMARY, SKILLS, EDUCATION, EXPERIENCE, PROJECTS, CERTIFICATIONS):
   add horizontal divider: "------------------------------".
5) Experience: "Role — Company: Description" per entry.
6) Education: "Course — College Name, City, Year" with **CGPA or percentage right-aligned at the end of the line**.
7) Projects: "<b>Project Title</b>: Short description."
8) Preserve links.github and links.linkedin if provided.
9) No trailing commas in JSON.

Output JSON EXACTLY as:

{
  "summary": "",
  "skills": [],
  "education": [],
  "experience": [],
  "projects": [],
  "certifications": [],
  "additional": [],
  "links": {
    "github": "",
    "linkedin": ""
  }
}

User Input:
${JSON.stringify(form, null, 2)}
`;
    // Request to Gemini
    const result = await model.generateContent(prompt);

    // Extract Model Text
    const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText.trim()) {
      return res.status(502).json({ error: "AI returned empty response" });
    }

    // Clean raw text
    let cleaned = rawText
      .replace(/```json|```/g, "")
      .replace(/^\s+|\s+$/g, "");

    let parsed = null;

    // Try normal parse
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Fix smart quotes / trailing commas
      const safe = cleaned
        .replace(/\u2018|\u2019|\u201C|\u201D/g, '"')
        .replace(/,(\s*[}\]])/g, "$1")
        .trim();

      try {
        parsed = JSON.parse(safe);
      } catch (err2) {
        console.error("❌ FAILED JSON PARSE:", cleaned);
        return res.status(502).json({
          error: "AI returned invalid JSON",
          rawOutput: cleaned,
        });
      }
    }

    // Guarantee all fields exist
    const enhanced = {
      summary: parsed.summary || "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      additional: Array.isArray(parsed.additional) ? parsed.additional : [],
      links: parsed.links || { github: "", linkedin: "" },
    };

    return res.json({ enhanced });
  } catch (err) {
    console.error("❌ generate-resume error:", err);
    return res.status(500).json({
      error: "Failed to enhance resume",
      details: err.message,
    });
  }
});

// ===============================
// 📄 Resume Analyzer
// ===============================
app.post("/api/analyze-resume-file", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const base64PDF = req.file.buffer.toString("base64");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an advanced ATS Resume Analyzer.

1️⃣ First, EXTRACT these from the resume:
- skills
- experience
- education
- domain (such as: electronics, computer science, mechanical, civil, business, finance, management, etc.)

2️⃣ Based on domain + skills, GENERATE meaningful results.

Return ONLY JSON in this EXACT format:

{
  "percent": number,
  "domain": "string",
  "jobs": ["role1", "role2", "role3", "role4", "role5"],
  "keywords": "comma separated unique missing keywords",
  "improvements": "2–3 line improvement text"
}
`;

    const aiResponse = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64PDF,
        },
      },
      prompt,
    ]);

    let raw = aiResponse.response.text().trim();
    raw = raw.replace(/```json|```/g, "").trim();
    let json = JSON.parse(raw);

    if (!json.jobs || json.jobs.length < 3) {
      json.jobs = ["Junior Engineer", "Assistant Engineer", "Technician"];
    }

    if (!json.keywords || json.keywords.length < 3) {
      json.keywords = "leadership, teamwork, project management";
    }

    res.json(json);
  } catch (error) {
    console.error("Analyzer Error:", error);
    res.status(500).json({
      error: "Failed to analyze resume",
      details: error.message,
    });
  }
});

// ===============================
// 📝 Interview Prep API (Gemini AI)
// ===============================
app.post("/api/interview-questions", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ message: "Topic is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an AI that generates detailed interview questions for a given topic.
Topic: ${topic}

Requirements:
1️⃣ Generate 5–10 most common and important interview questions.
2️⃣ Provide concise answers for each question in bullet points.
3️⃣ Include code example if relevant (max 6 lines).
4️⃣ Return ONLY JSON array in this format:

[
  {
    "question": "Full question text",
    "answer": ["Point 1", "Point 2", "Point 3"],
    "code_example": "// optional short code snippet if relevant, max 6 lines",
    "importance": "low/medium/high",
    "tricky_question": "optional tricky variant"
  }
]
`;

    const aiResponse = await model.generateContent([{ text: prompt }]);
    let raw = aiResponse.response.text().trim();
    raw = raw.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(raw);

    res.json(questions);
  } catch (error) {
    console.error("Error generating interview questions:", error);
    res.status(500).json({ message: "Failed to generate questions", details: error.message });
  }
});

// ===============================
// 💬 Ask Doubt API – returns point-wise answers with code if relevant
// ===============================
app.post("/api/ask-doubt", async (req, res) => {
  try {
    const { doubt } = req.body;
    if (!doubt) return res.status(400).json({ message: "Doubt is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert AI that answers technical interview-related doubts concisely.
Answer the following doubt in 3–5 bullet points.
Include short code examples if relevant (max 6 lines).
Return ONLY a JSON array of strings like:
["Point 1 explanation", "Point 2 explanation", "Point 3 explanation"]
No extra text, no markdown, no commentary.
Doubt: "${doubt}"
`;

    const aiResponse = await model.generateContent([{ text: prompt }]);
    let raw = aiResponse.response.text().trim();
    raw = raw.replace(/```json|```/g, "").trim();

    let points = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) points = parsed.slice(0, 5);
    } catch {
      // fallback if AI returns plain text
      points = raw
        .replace(/\*\*/g, "")
        .replace(/^[-*]\s*/gm, "")
        .replace(/^\d+\.\s*/gm, "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 2)
        .slice(0, 5);
    }

    // guaranteed fallback points
    if (points.length === 0) {
      points = [
        "Clarify your question in simple terms.",
        "Focus on the key concept you are confused about.",
        "Break the question into smaller parts.",
        "Check examples related to the topic.",
        "Review documentation or tutorials for clarity."
      ];
    }

    // send as array of strings (compatible with frontend)
    res.json(points);
  } catch (error) {
    console.error("Error resolving doubt:", error);
    res.status(500).json({
      message: "Failed to resolve doubt",
      details: error.message,
    });
  }
});


// ===============================
// 🧠 Quiz Questions
// ===============================
app.post("/api/quiz-questions", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ message: "Topic is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
Generate 20 multiple-choice questions for topic: ${topic}.
Return ONLY JSON array with:
[
  {
    "question": "string",
    "options": ["option1","option2","option3","option4"],
    "answer": "correct option",
    "explanation": "short explanation"
  }
]
`;

    const aiResponse = await model.generateContent([{ text: prompt }]);
    let raw = aiResponse.response.text().trim();
    raw = raw.replace(/```json|```/g, "").trim();
    const quizQuestions = JSON.parse(raw);

    res.json(quizQuestions);
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    res.status(500).json({ message: "Failed to generate quiz", details: error.message });
  }
});

// =============================== 
// 🎯 Career Guidance (Short & Precise Output)
// ===============================
app.post("/api/career-guidance", async (req, res) => {
  try {
    const { career } = req.body;

    if (!career) {
      return res.status(400).json({ error: "Career field is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const careerRoadmapPrompt = `
"Generate a concise career roadmap for the following career: ${career}.
Give short, precise steps only.
Include:

Skills to learn (very brief),

Tools/technologies required,

Step-by-step roadmap (max 6–8 steps),

Approx. time duration (short),

Final outcome in one sentence.
Keep the entire answer tight and to the point."
`;

    const aiResponse = await model.generateContent([
      { text: careerRoadmapPrompt }
    ]);

    const roadmap = aiResponse.response.text().trim();

    res.json({ roadmap });

  } catch (err) {
    console.error("Career Roadmap Error:", err);
    res.status(500).json({ error: "Failed to generate career roadmap" });
  }
});


// ===============================
// 🎤 MOCK INTERVIEW SYSTEM
// ===============================

// ------------------------------
// TEMPORARY IN-MEMORY STORE
// ------------------------------
const mockInterviewData = {};

// ------------------------------
// 1️⃣ MULTER FOR RESUME + VIDEO
// ------------------------------

// Resume → memory
const resumeUpload = multer({ storage: multer.memoryStorage() });

// Video → folder
const videoStorage = multer.diskStorage({
  destination: "interview_videos",
  filename: (req, file, cb) => {
    cb(null, `interview_${Date.now()}.webm`);
  },
});

export const videoUpload = multer({ storage: videoStorage });

// ------------------------------
// 2️⃣ GENERATE QUESTIONS
// ------------------------------
app.post(
  "/api/mock-interview/questions",
  resumeUpload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No resume uploaded" });

      const userId = Date.now().toString();
      const pdfText = await extractPdfText(req.file.buffer);

      if (!pdfText)
        return res
          .status(500)
          .json({ error: "Error extracting resume text." });

      mockInterviewData[userId] = { resumeText: pdfText };

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const prompt = `
You are an expert interview coach.

Read the following resume carefully. Generate EXACTLY 10 interview questions covering all sections.

Return ONLY a JSON array of strings.

Resume:
${pdfText}
`;

      const ai = await model.generateContent([{ text: prompt }]);

      let clean = ai.response.text().replace(/json/gi, "").trim();

      let questions = [];
      try {
        questions = JSON.parse(clean);
      } catch {
        questions = clean
          .split("\n")
          .map(q => q.trim())
          .filter(Boolean);
      }

      mockInterviewData[userId].questions = questions;

      res.json({ success: true, userId, questions });
    } catch (err) {
      console.error("Error generating questions:", err);
      res.status(500).json({ error: "Question generation failed" });
    }
  }
);

// ===============================
// 3️⃣ START INTERVIEW
// ===============================
app.post("/api/mock-interview/start", (req, res) => {
  const { userId } = req.body;

  if (!mockInterviewData[userId])
    return res.status(400).json({ error: "Upload resume first" });

  res.json({
    success: true,
    questions: mockInterviewData[userId].questions,
  });
});

// ===============================
// 4️⃣ UPLOAD INTERVIEW VIDEO
// ===============================
app.post(
  "/api/mock-interview/upload-video",
  videoUpload.single("video"),
  (req, res) => {
    const { userId } = req.body;

    if (!req.file)
      return res.status(400).json({ error: "No video uploaded" });

    if (!mockInterviewData[userId])
      return res.status(400).json({ error: "Invalid userId" });

    mockInterviewData[userId].videoPath = req.file.path;

    res.json({
      success: true,
      videoUrl: `/interview_videos/${req.file.filename}`,
    });
  }
);

// ===============================
// 5️⃣ GET FEEDBACK
// ===============================
app.get("/api/mock-interview/feedback/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mockInterviewData[userId])
      return res.status(400).json({ error: "No interview found" });

    const videoPath = mockInterviewData[userId].videoPath;

    if (!fs.existsSync(videoPath))
      return res.status(400).json({ error: "Video file not found" });

    const fileData = fs.readFileSync(videoPath);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const transcriptionResponse = await model.generateContent([
      {
        inlineData: {
          mimeType: "video/webm",
          data: Buffer.from(fileData).toString("base64"),
        },
      },
      { text: "Transcribe everything the candidate says clearly." },
    ]);

    const transcript =
      transcriptionResponse.response.candidates?.[0]?.content?.parts?.[0]
        ?.text || "";

    if (!transcript.trim())
      return res.status(400).json({ error: "Could not transcribe audio." });

    const feedbackPrompt = `
You are a senior interview coach.

"${transcript}"

Give feedback in 2–3 sentences.
Plain text only.
`;

    const feedbackResp = await model.generateContent([
      { text: feedbackPrompt },
    ]);

    const feedback =
      feedbackResp.response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No feedback generated.";

    res.json({ success: true, feedback });
  } catch (err) {
    console.error("Feedback Error:", err);
    res
      .status(500)
      .json({ error: "Feedback generation failed", details: err.message });
  }
});

// ===============================
// 6️⃣ USER FEEDBACK
// ===============================
app.post("/api/submit-feedback", (req, res) => {
  const { feedback } = req.body;

  if (!feedback)
    return res.status(400).json({ message: "Feedback required" });

  console.log("New Feedback:", feedback);
  res.json({ message: "Feedback saved successfully" });
});


// ===============================
// START SERVER
// ===============================
app.listen(5000, () => console.log("Mock Interview server running on port 5000"));
import { useState, useRef } from "react";
import ResumeBuilder from "./ResumeBuilder";
import axios from "axios";
import "./ResumeTools.css";

function ResumeTools() {
  const [activeTab, setActiveTab] = useState("builder");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const fileRef = useRef();

  const analyzeResume = async () => {
    const file = fileRef.current.files?.[0];
    if (!file) return alert("Please upload a resume!");

    const formData = new FormData();
    formData.append("resume", file);

    setLoading(true);
    setAnalysis(null);
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/analyze-resume-file",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("ANALYSIS RESULT (raw):", data);
      setAnalysis(data);
    } catch (err) {
      console.error("Analyze error:", err);
      alert("Error analyzing resume — check console for details");
    }
    setLoading(false);
  };

  // Helper to find field across multiple possible names
  const findField = (obj, keys) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return undefined;
  };

  // JOB ROLE HANDLER
  const getJobs = (a) => {
    const val = findField(a, ["jobs", "recommended_jobs", "roles"]);
    if (!val) return [];
    if (Array.isArray(val)) return val;

    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}

      if (val.includes(",")) return val.split(",").map((s) => s.trim());
      return [val.trim()];
    }
    return [];
  };

  // MISSING KEYWORDS HANDLER
  const getKeywords = (a) => {
    const raw = findField(a, ["keywords", "missing_keywords", "missing"]);
    if (!raw) return "No missing keywords found";

    if (Array.isArray(raw)) return raw.join(", ");
    return raw.toString();
  };

  // IMPROVEMENTS HANDLER
  const getImprovements = (a) => {
    const raw = findField(a, ["improvements", "suggestions", "advice"]);
    if (!raw) return ["No improvements provided"];

    if (Array.isArray(raw)) return raw.map((i) => `• ${i}`);
    return raw.toString().split("\n");
  };

  return (
    <div className="resume-tools-page">
      <div className="resume-tools-wrapper">
        <div className="tabs">
          <button
            className={activeTab === "builder" ? "tab active" : "tab"}
            onClick={() => setActiveTab("builder")}
          >
            Resume Builder
          </button>

          <button
            className={activeTab === "analyzer" ? "tab active" : "tab"}
            onClick={() => setActiveTab("analyzer")}
          >
            Resume Analyzer
          </button>
        </div>

        {activeTab === "builder" && (
          <div className="tab-content">
            <ResumeBuilder />
          </div>
        )}

        {activeTab === "analyzer" && (
          <div className="tab-content analyzer-box">
            <h2>Upload Resume for ATS Analysis</h2>

            <input type="file" ref={fileRef} accept="application/pdf" />

            <button
              onClick={analyzeResume}
              className="analyze-btn"
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>

            {analysis && (
              <div className="analysis-result">
                <h3>ATS Score: {analysis.percent || analysis.score || "N/A"}%</h3>

                <div className="job-roles-title">Recommended Job Roles</div>
                <div className="job-roles">
                  {getJobs(analysis).map((job, i) => (
                    <span key={i} className="role">
                      {job}
                    </span>
                  ))}
                </div>

                <div className="label-title">Missing Keywords:</div>
                <div className="keywords-box visible">{getKeywords(analysis)}</div>

                <div className="label-title">Improvements:</div>
                <div className="improvements-box visible">
                  {getImprovements(analysis).map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>

                {showDebug && (
                  <div className="debug-box">
                    <pre>{JSON.stringify(analysis, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeTools;

import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <h1 className="dashboard-title">Your Career Dashboard</h1>
        <p className="dashboard-subtitle">
          Choose a tool to enhance your career journey
        </p>

        <div className="dashboard-grid">

          {/* ============================== */}
          {/* ⭐ RESUME TOOLS (Builder + Analyzer) */}
          {/* ============================== */}
          <div className="db-card">
            <h3>Resume Tools</h3>
            <p>Build a resume or analyze your existing one with AI.</p>
            <button
              className="db-btn"
              onClick={() => navigate("/resume-tools")}
            >
              Open Resume Tools
            </button>
          </div>

          {/* ============================== */}
          {/* Other dashboard items */}
          {/* ============================== */}

          <div className="db-card">
            <h3>Mock Interview</h3>
            <p>Practice interviews with AI-based feedback.</p>
            <button className="db-btn" onClick={() => navigate("/mock-interview")}>
              Start Mock Interview
            </button>
          </div>

          <div className="db-card">
            <h3>Interview Preparation</h3>
            <p>Improve your skills with expert and AI-guided tips.</p>
            <button className="db-btn" onClick={() => navigate("/interview-prep")}>
              Prepare Now
            </button>
          </div>

          <div className="db-card">
            <h3>Career Guidance</h3>
            <p>Get personalized career suggestions.</p>
            <button className="db-btn" onClick={() => navigate("/career-guidance")}>
              Get Career Guidance
            </button>
          </div>

          <div className="db-card">
            <h3>Industry Insights</h3>
            <p>View trends, skill demands, and job insights.</p>
            <button className="db-btn" onClick={() => navigate("/insights")}>
              Explore Insights
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;

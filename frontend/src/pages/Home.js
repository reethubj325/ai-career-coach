import React, { useState } from "react";
import "./Home.css";
import aiImage from "../assets/AI-Career-Coach.jpeg";
import { useNavigate } from "react-router-dom";
import { submitFeedback } from "../api";   // ✅ Correct import

const Home = () => {
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const token = localStorage.getItem("token");

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // ⭐ CORRECT FEEDBACK FUNCTION USING API.JS
  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      alert("Please write your feedback!");
      return;
    }

    try {
      await submitFeedback(feedback, 1); // user_id = 1 (or dynamic user)

      setSubmitted(true);
      setError(false);
      setFeedback("");

      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("Feedback error:", err);
      setError(true);
    }
  };

  return (
    <div className="home-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <h2 className="logo">AI Career Coach</h2>

        <ul className="nav-links">
          <li onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</li>
          <li onClick={() => scrollToSection("features")}>Features</li>
          <li onClick={() => scrollToSection("about")}>About</li>
          <li onClick={() => scrollToSection("feedback")}>Feedback</li>

          {token ? (
            <li className="logout-btn" onClick={handleLogout}>Logout</li>
          ) : (
            <>
              <li onClick={() => navigate("/login")}>Login</li>
              <li onClick={() => navigate("/register")}>Register</li>
            </>
          )}
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>Empower Your Career with AI</h1>
          <p>
            Transform your professional journey with intelligent tools for resume building,
            interview preparation, and personalized career guidance.
          </p>

          {!token ? (
            <button className="get-started-btn" onClick={() => navigate("/register")}>
              Get Started
            </button>
          ) : (
            <button className="get-started-btn" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          )}
        </div>

        <div className="hero-image">
          <img src={aiImage} alt="AI Career Coach" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="info-section">
        <h2>Why Choose AI Career Coach?</h2>
        <p>We combine technology and expertise to guide you at every stage of your career journey.</p>

        <div className="info-boxes">
          <div className="info-box">
            <h3>Smart Resume Builder</h3>
            <p>Create optimized, modern resumes tailored to your dream job.</p>
          </div>

          <div className="info-box">
            <h3>Mock Interviews</h3>
            <p>Practice with realistic AI-powered interview simulations.</p>
          </div>

          <div className="info-box">
            <h3>Career Insights</h3>
            <p>Get expert advice and analytics-driven career recommendations.</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="about-section">
        <h2>About</h2>
        <p>
          AI Career Coach supports job seekers, students, and professionals with smart AI tools like
          resume builder, career guidance, and interview practice.
        </p>
      </section>

      {/* Feedback Section */}
      <section id="feedback" className="feedback-section">
        <h2>Feedback & Comments</h2>
        <p>We value your opinions! Share your thoughts below:</p>

        <textarea
          placeholder="Write your feedback here..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        ></textarea>

        <button onClick={handleFeedbackSubmit}>Submit Feedback</button>

        {submitted && (
          <p className="success-message">✅ Feedback submitted successfully!</p>
        )}

        {error && (
          <p className="error-message">❌ Something went wrong. Try again.</p>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 AI Career Coach | Created by Preethu BJ</p>
        <p>Share your feedback and help us improve!</p>
      </footer>
    </div>
  );
};

export default Home;

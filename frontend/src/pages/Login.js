import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid email or password");
        return;
      }

      localStorage.setItem("token", data.token);

      setMessage("✅ Login successful!");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
    } catch (error) {
      setMessage("❌ Server error. Try again.");
    }
  };

  // New forgot password handler
  const handleForgotPassword = () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }

    // Ideally, call API to send reset link here
    setMessage(`📧 Check your email (${email}) to reset your password.`);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Welcome Back</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="show-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="auth-btn">Login</button>

          {message && <p className="message">{message}</p>}

          <div className="auth-links">
            <button
              type="button"
              className="link-btn"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
            <p>
              Don’t have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => navigate("/register")}
              >
                Register now
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

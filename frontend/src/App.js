import React from "react"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import ResumeTools from "./pages/ResumeTools";
import InterviewPrep from "./pages/InterviewPrep";
import CareerRoadmap from "./pages/CareerRoadmap";
import MockInterview from "./pages/MockInterview";
import ResetPassword from "./pages/ResetPassword";
import TrendingJobs from "./pages/TrendingJobs";


import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect"; // ⭐ Redirect logged-in users

function App() {
  return (
    <Router>
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />

        {/* Register - Block access if already logged in */}
        <Route
          path="/register"
          element={
            <AuthRedirect>
              <Register />
            </AuthRedirect>
          }
        />

        {/* Login - Block access if already logged in */}
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <Login />
            </AuthRedirect>
          }
        />
           <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <TrendingJobs />
            </ProtectedRoute>
          }
        />

        {/* Protected Resume Builder */}
        <Route
          path="/resume-builder"
          element={
            <ProtectedRoute>
              <ResumeBuilder />
            </ProtectedRoute>
          }
        />

        {/* Resume Tools (optional protection) */}
        <Route
          path="/resume-tools"
          element={
            <ProtectedRoute>
              <ResumeTools />
            </ProtectedRoute>
          }
        />

        {/* Protected Interview Prep */}
        <Route
          path="/interview-prep"
          element={
            <ProtectedRoute>
              <InterviewPrep />
            </ProtectedRoute>
          }
        />
        {/* Protected Career Roadmap */}
<Route
  path="/career-guidance"
  element={
    <ProtectedRoute>
      <CareerRoadmap />
    </ProtectedRoute>
  }
/>
<Route
  path="/mock-interview"
  element={
    <ProtectedRoute>
      <MockInterview/>
    </ProtectedRoute>
  }
/>

      </Routes>
    </Router>
  );
}

export default App;

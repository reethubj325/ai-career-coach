import React from "react";
import { Navigate } from "react-router-dom";

const AuthRedirect = ({ children }) => {
  const token = localStorage.getItem("token");

  // If logged in → redirect to Home page
  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthRedirect;

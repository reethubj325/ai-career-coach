import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-logo">AI Career Coach</h1>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#feedback">Feedback</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

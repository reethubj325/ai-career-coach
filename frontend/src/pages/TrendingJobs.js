import React from "react";
import "./TrendingJobs.css";
import { motion } from "framer-motion";

const TrendingJobs = () => {
  const jobs = [
    { title: "AI Engineer", company: "Google", location: "Bangalore", salary: "₹28 LPA" },
    { title: "Data Scientist", company: "Microsoft", location: "Hyderabad", salary: "₹26 LPA" },
    { title: "Full Stack Developer", company: "Amazon", location: "Chennai", salary: "₹22 LPA" },
    { title: "DevOps Engineer", company: "Infosys", location: "Pune", salary: "₹18 LPA" },
    { title: "Cybersecurity Analyst", company: "TCS", location: "Mumbai", salary: "₹20 LPA" },
    { title: "ML Engineer", company: "NVIDIA", location: "Bangalore", salary: "₹30 LPA" },
    { title: "UI/UX Designer", company: "Adobe", location: "Remote", salary: "₹19 LPA" },
    { title: "Software Engineer", company: "Meta", location: "Gurugram", salary: "₹25 LPA" },
    { title: "Product Manager", company: "LinkedIn", location: "Hyderabad", salary: "₹27 LPA" },
    { title: "Cloud Architect", company: "IBM", location: "Bangalore", salary: "₹29 LPA" },
  ];

  return (
    <div className="trending-container">
      <motion.h1
        className="trending-title"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        🌟 Top 10 Trending Tech Jobs
      </motion.h1>

      <motion.div
        className="trending-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {jobs.map((job, index) => (
          <motion.div
            className="job-card"
            key={index}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <h2>{job.title}</h2>
            <p><strong>Company:</strong> {job.company}</p>
            <p><strong>Location:</strong> {job.location}</p>
            <p><strong>Package:</strong> {job.salary}</p>
            {/* Removed Apply Button */}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default TrendingJobs;

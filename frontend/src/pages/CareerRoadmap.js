import React, { useState } from "react";
import { getCareerRoadmap } from "../api";
import "./CareerRoadmap.css";

const CareerRoadmap = () => {
  const [career, setCareer] = useState("");
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Force short, precise steps
  const shortenLine = (line) => {
    const words = line.split(" ");
    return words.slice(0, 12).join(" "); // keep only first 12 words
  };

  const parseRoadmap = (text) => {
    if (!text) return [];

    return Array.from(
      new Set(
        text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map((l) => shortenLine(l))        // shorten long sentences
      )
    );
  };

  const handleGenerate = async () => {
    if (!career.trim()) {
      setError("Please enter a career.");
      return;
    }

    setLoading(true);
    setError("");
    setRoadmap([]);

    try {
      const result = await getCareerRoadmap(career);

      const text =
        typeof result === "string"
          ? result
          : result?.data?.roadmap || result?.roadmap || "";

      setRoadmap(parseRoadmap(text));
    } catch (err) {
      console.error(err);
      setError("Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="career-container">
      <div className="career-box">

        <h2>Career Roadmap Generator</h2>

        <div className="input-section">
          <input
            type="text"
            placeholder="Enter a career (e.g., Java Developer)"
            value={career}
            onChange={(e) => setCareer(e.target.value)}
          />
          <button onClick={handleGenerate}>
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="flowchart">
          {roadmap.map((step, idx) => (
            <div key={idx} className="step">
              {step}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CareerRoadmap;

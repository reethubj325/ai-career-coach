import React, { useState } from "react";
import "../index.css";
import "./InterviewPrep.css";

// ✅ USE API FUNCTION (VERY IMPORTANT)
import { getQuizQuestions } from "../api"; // adjust path if needed

const InterviewPrep = () => {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================
  // Fetch Quiz Questions
  // =========================
  const startQuiz = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }

    try {
      setLoading(true);

      // ✅ THIS calls backend → Gemini
      const data = await getQuizQuestions(topic);

      setQuestions(data);
      setAnswers({});
      setCurrentIndex(0);
      setSubmitted(false);
    } catch (err) {
      console.error("Failed to load quiz", err);
      alert("Failed to load quiz questions");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Handle Option Select
  // =========================
  const handleOptionChange = (option) => {
    setAnswers({
      ...answers,
      [currentIndex]: option,
    });
  };

  // =========================
  // Submit Quiz
  // =========================
  const handleSubmitQuiz = () => {
    console.log("Quiz Submitted");
    console.log("Answers:", answers);

    setSubmitted(true);
    setShowExitModal(false);

    alert("Quiz submitted successfully!");
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="quiz-container">
      {/* ========================= */}
      {/* Topic Input */}
      {/* ========================= */}
      {questions.length === 0 && (
        <div className="topic-box">
          <input
            type="text"
            placeholder="Enter topic (e.g., Java)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button onClick={startQuiz}>
            {loading ? "Loading..." : "Start Quiz"}
          </button>
        </div>
      )}

      {/* ========================= */}
      {/* Quiz Section */}
      {/* ========================= */}
      {questions.length > 0 && !submitted && (
        <>
          <div className="quiz-header">
            <h2>
              Question {currentIndex + 1} of {questions.length}
            </h2>

            <button
              className="exit-btn"
              onClick={() => setShowExitModal(true)}
            >
              Exit
            </button>
          </div>

          <div className="question-box">
            <h3>{questions[currentIndex].question}</h3>

            {questions[currentIndex].options.map((option, idx) => (
              <label key={idx} className="option">
                <input
                  type="radio"
                  name="option"
                  checked={answers[currentIndex] === option}
                  onChange={() => handleOptionChange(option)}
                />
                {option}
              </label>
            ))}
          </div>

          <div className="quiz-actions">
            {currentIndex > 0 && (
              <button onClick={() => setCurrentIndex(currentIndex - 1)}>
                Previous
              </button>
            )}

            {currentIndex < questions.length - 1 ? (
              <button onClick={() => setCurrentIndex(currentIndex + 1)}>
                Next
              </button>
            ) : (
              <button className="submit-btn" onClick={handleSubmitQuiz}>
                Submit Quiz
              </button>
            )}
          </div>
        </>
      )}

      {/* ========================= */}
      {/* Exit Confirmation Modal */}
      {/* ========================= */}
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Quiz Not Completed</h3>
            <p>
              You have not yet completed the quiz.
              <br />
              Do you want to submit the quiz?
            </p>

            <div className="modal-actions">
              <button className="yes-btn" onClick={handleSubmitQuiz}>
                Yes
              </button>

              <button
                className="no-btn"
                onClick={() => setShowExitModal(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;

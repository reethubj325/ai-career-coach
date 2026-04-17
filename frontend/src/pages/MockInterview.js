import React, { useState, useRef } from "react";
import axios from "axios";
import "./MockInterview.css";

const MockInterview = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [userId, setUserId] = useState(null);

  const [recordedVideo, setRecordedVideo] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef(null);
  const recordedRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/mock-interview/questions",
        formData
      );

      setQuestions(res.data.questions.slice(0, 10));
      setResumeUploaded(true);
      setUserId(res.data.userId);

      alert("Resume uploaded & questions generated!");
    } catch (err) {
      console.error(err);
      alert("Error extracting resume.");
    }
  };

  const speakQuestion = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";

    speech.onstart = () => setSpeaking(true);
    speech.onend = () => setSpeaking(false);

    window.speechSynthesis.speak(speech);
  };

  const startInterview = () => {
    if (!resumeUploaded || questions.length === 0) {
      alert("Upload resume first.");
      return;
    }
    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    speakQuestion(questions[0]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      alert("All questions completed!");
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    speakQuestion(questions[nextIndex]);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    videoRef.current.srcObject = stream;
    videoRef.current.play();

    mediaRecorderRef.current = new MediaRecorder(stream);
    chunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      setRecordedVideo(blob);

      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const uploadVideo = async (file) => {
    if (!userId) {
      alert("No userId available. Upload resume first!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("userId", userId);

      await axios.post(
        "http://localhost:5000/api/mock-interview/upload-video",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Video uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Error uploading video.");
    }
  };

  const getFeedback = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/mock-interview/feedback/${userId}`
      );

      setFeedback(JSON.stringify(res.data.feedback, null, 2));
    } catch (err) {
      console.error(err);
      alert("Error generating feedback.");
    }
  };

  return (
    <div className="mock-wrapper">
      <div className="mock-container">

        <h1 className="title">AI Mock Interview</h1>

        {/* Upload Resume */}
        <div className="section">
          <h3 className="section-title">1. Upload Resume</h3>
          <input type="file" accept="application/pdf" onChange={handleResumeUpload} />
        </div>

        {/* Questions */}
        {resumeUploaded && (
          <div className="section">
            <h3 className="section-title">Generated Questions</h3>

            <ul className="question-list">
              {questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>

            {!interviewStarted ? (
              <button className="primary-btn" onClick={startInterview}>
                Start Your Interview
              </button>
            ) : (
              <>
                <h3>Current Question:</h3>
                <h3 className="current-question-title">Current Question:</h3>
                <p className="current-question">{questions[currentQuestionIndex]}</p>
                <button className="primary-btn" disabled={speaking} onClick={nextQuestion}>
                  Next Question
                </button>
              </>
            )}
          </div>
        )}

        {/* Video Recording */}
        {resumeUploaded && (
          <div className="section">
            <h3 className="section-title">2. Record Your Interview</h3>

            <video ref={videoRef} autoPlay className="live-video"></video>

            {!isRecording ? (
              <button className="record-btn" onClick={startRecording}>
                Start Recording
              </button>
            ) : (
              <button className="stop-btn" onClick={stopRecording}>
                Stop Recording
              </button>
            )}

            {recordedVideo && (
              <>
                <h3 className="section-title">Playback</h3>

                <video
                  ref={recordedRef}
                  controls
                  src={URL.createObjectURL(recordedVideo)}
                  className="playback-video"
                ></video>

                <div className="btn-group">
                  <button className="upload-btn" onClick={() => uploadVideo(recordedVideo)}>
                    Upload Video
                  </button>
                  <button className="feedback-btn" onClick={getFeedback}>
                    Get AI Feedback
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="feedback-box">
            <h2 className="feedback-title">AI Feedback</h2>
            <pre>{feedback}</pre>
          </div>
        )}

      </div>
    </div>
  );
};

export default MockInterview;

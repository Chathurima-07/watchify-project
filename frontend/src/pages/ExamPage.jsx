import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(true);

  // Use refs for values needed in event listeners to avoid stale closures
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:5000/api/exams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const selected = res.data.find((e) => e._id === id);
        setExam(selected);
        setAnswers(new Array(selected.questions.length).fill(""));
        setTimeLeft(selected.duration * 60);
      } catch (error) {
        console.error("Error fetching exam:", error);
      }
    };

    fetchExam();
  }, [id]);

  const logViolation = useCallback(async (type) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/exams/violation",
        { examId: id, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Also store a monitoring record for mentor dashboard (real DB record).
      await axios.post(
        "http://localhost:5000/api/violations",
        {
          examId: id,
          type: String(type || "").toUpperCase().replace(/\s+/g, "_"),
          severity: type === "Tab Switch" ? "Medium" : type === "Exit Fullscreen" ? "Medium" : "High",
          description: `Violation detected: ${type}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to log violation:", error);
    }
  }, [id]);

  const handleSubmit = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/exams/submit",
        { examId: id, answers: answersRef.current },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Exit fullscreen when done
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      alert(`Score: ${res.data.score}/${res.data.total}`);
      navigate("/student");
    } catch (error) {
      alert(error.response?.data?.message || "Error submitting exam");
      navigate("/student");
    }
  }, [id, navigate]);

  // Anti-Cheat Listeners
  useEffect(() => {
    if (!isStarted) return;

    // 1. Tab Switch Detection -> Auto Submit
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        await logViolation("Tab Switch");
        alert("CRITICAL VIOLATION: Tab switched. Exam is being auto-submitted!");
        handleSubmit();
      }
    };

    // 2. Fullscreen Exit Detection -> Pause Exam
    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        setIsFullscreenActive(false);
        await logViolation("Exit Fullscreen");
      } else {
        setIsFullscreenActive(true);
      }
    };

    // 3. Block Copy/Paste/ContextMenu -> Auto Submit on attempt
    const handleCopyPaste = async (e) => {
      e.preventDefault();
      await logViolation("Copy/Paste Attempt");
      alert("CRITICAL VIOLATION: Copy/Paste detected. Exam is being auto-submitted!");
      handleSubmit();
    };
    
    const handleContextMenu = (e) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
    };
  }, [isStarted, logViolation, handleSubmit]);

  // Timer logic
  useEffect(() => {
    if (!isStarted || timeLeft === null) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, isStarted, handleSubmit]);

  const handleStartExam = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Start exam in backend
      await axios.post(
        "http://localhost:5000/api/exams/start",
        { examId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      setIsStarted(true);
    } catch (error) {
      alert(error.response?.data?.message || "Error starting exam");
      if (error.response?.data?.message === "Exam already submitted") {
        navigate("/student");
      }
    }
  };

  const handleResumeFullscreen = async () => {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  };

  const handleChange = (qIndex, option) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = option;
    setAnswers(newAnswers);
  };

  if (!exam) return <p>Loading...</p>;

  if (!isStarted) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <h2>{exam.title}</h2>
        <p>Duration: {exam.duration} minutes</p>
        <p style={{ color: "red", fontWeight: "bold" }}>
          Strict Rules:
          <br /> 1. Do NOT switch tabs or minimize the browser (Auto-Submits Exam).
          <br /> 2. Do NOT copy/paste text (Auto-Submits Exam).
          <br /> 3. Do not exit fullscreen (Pauses Exam & Logs Violation).
          <br /> All violations notify your mentor!
        </p>
        <button
          onClick={handleStartExam}
          style={{ padding: "15px 30px", background: "blue", color: "white", fontSize: "18px", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          I Understand, Start Exam
        </button>
      </div>
    );
  }

  // If student exited fullscreen, show overlay instead of questions
  if (!isFullscreenActive) {
    return (
      <div style={{ padding: "50px", textAlign: "center", background: "#f8d7da", color: "#721c24", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h2>⚠️ Warning: You Exited Fullscreen!</h2>
        <p>A violation has been recorded. You cannot view the exam questions unless you are in fullscreen mode.</p>
        <button
          onClick={handleResumeFullscreen}
          style={{ padding: "15px 30px", background: "red", color: "white", fontSize: "18px", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "20px" }}
        >
          Return to Fullscreen to Resume
        </button>
      </div>
    );
  }

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{ padding: "20px", userSelect: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{exam.title}</h2>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: "red" }}>
          Time Left: {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </div>
      </div>

      {exam.questions.map((q, index) => (
        <div key={index} style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold" }}>{index + 1}. {q.question}</p>

          {q.options.map((opt, i) => (
            <div key={i}>
              <input
                type="radio"
                name={`q-${index}`}
                value={opt}
                onChange={() => handleChange(index, opt)}
              />
              {opt}
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 20px",
          background: "blue",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Submit Exam
      </button>
    </div>
  );
}

export default ExamPage;
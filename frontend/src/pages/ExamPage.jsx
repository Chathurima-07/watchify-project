import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, Clock3, Shield } from "lucide-react";
import "../styles/dashboardTokens.css";
import "../styles/student.css";

const API_BASE = "http://localhost:5000";

function examDraftStorageKey(examId) {
  let uid = "";
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    uid = u?.id != null ? String(u.id) : "";
  } catch {
    uid = "";
  }
  return `watchify_exam_answers::${uid}::${examId}`;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const logViolation = useCallback(
    async ({ type, severity, description }) => {
      try {
        await axios.post(
          `${API_BASE}/api/student/violations`,
          { examId: id, type, severity, description },
          { headers: authHeaders() }
        );
      } catch (err) {
        console.error("Violation log failed:", err);
      }
    },
    [id]
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/student/exams/${id}/submit`,
        { answers: answersRef.current },
        { headers: authHeaders() }
      );

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      try {
        localStorage.removeItem(examDraftStorageKey(id));
      } catch {
        /* ignore */
      }
      navigate(`/student/result/${res.data.resultId}`);
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/");
        return;
      }
      if (err?.response?.status === 403) {
        alert(err?.response?.data?.message || "This exam is no longer available.");
        setSubmitting(false);
        return;
      }
      alert(err?.response?.data?.message || "Failed to submit exam.");
      setSubmitting(false);
    }
  }, [id, navigate, submitting]);

  useEffect(() => {
    const fetchExam = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/api/student/exams/${id}`, {
          headers: authHeaders(),
        });
        setExam(res.data);
        const qLen = Array.isArray(res.data?.questions) ? res.data.questions.length : 0;
        let initialAnswers = new Array(qLen).fill("");
        try {
          const raw = localStorage.getItem(examDraftStorageKey(id));
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.answers) && parsed.answers.length === qLen) {
              initialAnswers = parsed.answers.map((a) => (typeof a === "string" ? a : ""));
            }
          }
        } catch {
          /* ignore corrupt draft */
        }
        setAnswers(initialAnswers);
        setTimeLeft((res.data?.duration || 0) * 60);
      } catch (err) {
        if (err?.response?.status === 401) {
          navigate("/");
          return;
        }
        setError(err?.response?.data?.message || "Failed to load exam.");
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id, navigate]);

  useEffect(() => {
    if (!isStarted) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        await logViolation({
          type: "TAB_SWITCH",
          severity: "Medium",
          description: "Student switched browser tab during exam",
        });
      }
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        setIsFullscreenActive(false);
        await logViolation({
          type: "FULLSCREEN_EXIT",
          severity: "High",
          description: "Student exited fullscreen mode during exam",
        });
      } else {
        setIsFullscreenActive(true);
      }
    };

    const blockCopyPaste = (e) => e.preventDefault();
    const blockContextMenu = (e) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", blockCopyPaste);
    document.addEventListener("paste", blockCopyPaste);
    document.addEventListener("cut", blockCopyPaste);
    document.addEventListener("contextmenu", blockContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", blockCopyPaste);
      document.removeEventListener("paste", blockCopyPaste);
      document.removeEventListener("cut", blockCopyPaste);
      document.removeEventListener("contextmenu", blockContextMenu);
    };
  }, [isStarted, logViolation]);

  useEffect(() => {
    if (!isStarted || timeLeft === null || submitting) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, isStarted, handleSubmit, submitting]);

  useEffect(() => {
    if (!isStarted) return;
    const checkCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          await logViolation({
            type: "CAMERA_ISSUE",
            severity: "High",
            description: "Camera permission denied or unavailable",
          });
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        await logViolation({
          type: "CAMERA_ISSUE",
          severity: "High",
          description: "Camera permission denied or unavailable",
        });
      }
    };
    checkCamera();
  }, [isStarted, logViolation]);

  useEffect(() => {
    if (!isStarted || !exam || submitting) return;
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(
          examDraftStorageKey(id),
          JSON.stringify({ answers, updatedAt: Date.now() })
        );
      } catch {
        /* storage full / private mode */
      }
    }, 450);
    return () => window.clearTimeout(handle);
  }, [answers, exam, id, isStarted, submitting]);

  const handleStartExam = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsStarted(true);
    } catch {
      alert("Fullscreen is required to begin exam.");
    }
  };

  const handleResumeFullscreen = async () => {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  };

  const handleChange = (qIndex, option) => {
    const next = [...answers];
    next[qIndex] = option;
    setAnswers(next);
  };

  if (loading) {
    return <div className="exam-shell"><div className="student-pill gray">Loading exam…</div></div>;
  }
  if (error || !exam) {
    return <div className="exam-shell"><div className="student-pill red">{error || "Exam not found."}</div></div>;
  }

  if (!isStarted) {
    return (
      <div className="exam-shell">
        <div className="student-card" style={{ maxWidth: 760, margin: "30px auto 0" }}>
          <div className="student-card-inner" style={{ textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>{exam.title}</h2>
            <p style={{ color: "rgba(255,255,255,0.72)" }}>Duration: {exam.duration} minutes</p>
            <div className="student-pill yellow" style={{ justifyContent: "center", marginBottom: 14 }}>
              <AlertTriangle size={14} /> Monitoring is active during this exam
            </div>
            <p style={{ color: "rgba(255,255,255,0.72)" }}>
              Do not switch tabs, exit fullscreen, or use copy/paste. Violations are logged.
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 14, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
              Answers autosave while the exam is running. If you return before submitting, your latest selections can be prefilled.
            </p>
            <button className="student-btn primary" onClick={handleStartExam}>
              <Shield size={16} /> Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isFullscreenActive) {
    return (
      <div className="exam-shell" style={{ display: "grid", placeItems: "center" }}>
        <div className="student-card" style={{ maxWidth: 600 }}>
          <div className="student-card-inner" style={{ textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>Fullscreen Required</h2>
            <p style={{ color: "rgba(255,255,255,0.72)" }}>
              A fullscreen exit was detected and recorded as a violation.
            </p>
            <button className="student-btn primary" onClick={handleResumeFullscreen}>
              Return to Fullscreen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(Math.max(0, timeLeft || 0) / 60);
  const seconds = Math.max(0, timeLeft || 0) % 60;

  return (
    <div className="exam-shell">
      <div className="exam-header">
        <h2 style={{ margin: 0, fontSize: 18 }}>{exam.title}</h2>
        <span className="student-pill red">
          <Clock3 size={14} />
          {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </span>
      </div>

      <div className="exam-list">
        {exam.questions.map((q, idx) => (
          <div key={q._id || idx} className="exam-question">
            <p style={{ marginTop: 0, fontWeight: 700 }}>
              {idx + 1}. {q.question}
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {q.options.map((opt, i) => (
                <label key={i} style={{ display: "flex", gap: 8, alignItems: "center", color: "rgba(255,255,255,0.85)" }}>
                  <input
                    type="radio"
                    name={`q-${idx}`}
                    value={opt}
                    checked={answers[idx] === opt}
                    onChange={() => handleChange(idx, opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="exam-submit-wrap">
        <button className="student-btn primary" disabled={submitting} onClick={handleSubmit}>
          {submitting ? "Submitting…" : "Submit Exam"}
        </button>
      </div>
    </div>
  );
}

export default ExamPage;
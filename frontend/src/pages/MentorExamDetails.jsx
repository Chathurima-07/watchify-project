import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Shield,
} from "lucide-react";
import "../styles/dashboardTokens.css";
import "../styles/mentor.css";

const API_BASE = "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MentorExamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [examRes, resultsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/mentor/exams/${id}`, { headers: authHeaders() }),
          axios.get(`${API_BASE}/api/mentor/results`, { headers: authHeaders() }),
        ]);

        if (cancelled) return;
        const examPayload = examRes.data?.exam ?? examRes.data;
        setExam(examPayload && typeof examPayload === "object" ? examPayload : null);
        const resultsPayload = resultsRes.data?.results ?? resultsRes.data;
        setResults(Array.isArray(resultsPayload) ? resultsPayload : []);
      } catch (e) {
        const msg = e?.response?.status === 401 ? "Unauthorized" : e?.response?.data?.message || e.message;
        if (e?.response?.status === 401) navigate("/");
        setError(msg || "Failed to load exam details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const examResults = useMemo(() => {
    if (!exam?._id) return [];
    return results.filter((r) => String(r.exam?._id || r.exam) === String(exam._id));
  }, [results, exam]);

  if (loading) {
    return (
      <div className="mentor-shell">
        <div className="mentor-main">
          <div className="men-pill gray">Loading exam details…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mentor-shell">
        <div className="mentor-main">
          <button className="men-btn" onClick={() => navigate("/mentor")}>
            <ArrowLeft size={16} />
            Back
          </button>
          <div style={{ height: 12 }} />
          <div className="men-pill red">
            <Shield size={14} /> {error}
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="mentor-shell">
        <div className="mentor-main">
          <button className="men-btn" onClick={() => navigate("/mentor")}>
            <ArrowLeft size={16} />
            Back
          </button>
          <div style={{ height: 12 }} />
          <div className="men-pill gray">Exam not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-shell">
      <div className="mentor-main">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button className="men-btn" onClick={() => navigate("/mentor")}>
            <ArrowLeft size={16} />
            Back to Mentor
          </button>
          <span className="men-pill blue">
            <BookOpen size={14} /> Exam Details
          </span>
        </div>

        <div style={{ height: 14 }} />

        <div className="men-grid two">
          <div className="men-card">
            <div className="men-card-inner">
              <div className="men-card-title">
                <div>
                  <h3>{exam.title}</h3>
                  <p className="men-kicker">Full exam configuration and question list</p>
                </div>
                <span className="men-pill green">
                  <BadgeCheck size={14} /> Active
                </span>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="men-pill gray">
                  <Clock size={14} /> {exam.duration} min
                </span>
                <span className="men-pill gray">
                  <GraduationCap size={14} /> {Array.isArray(exam.questions) ? exam.questions.length : 0} questions
                </span>
                <span className="men-pill gray">
                  <Calendar size={14} /> {exam.createdAt ? new Date(exam.createdAt).toLocaleString() : "—"}
                </span>
              </div>

              <div style={{ height: 14 }} />

              <div className="men-table-wrap" style={{ minWidth: "unset" }}>
                <table className="men-table" style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 64 }}>#</th>
                      <th>Question</th>
                      <th>Correct Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(exam.questions) && exam.questions.length ? (
                      exam.questions.map((q, idx) => (
                        <tr key={idx}>
                          <td style={{ color: "rgba(255,255,255,0.72)" }}>{idx + 1}</td>
                          <td style={{ whiteSpace: "normal" }}>{q.question}</td>
                          <td style={{ color: "rgba(160,190,255,0.95)" }}>{q.correctAnswer}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                          No questions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="men-card">
            <div className="men-card-inner">
              <div className="men-card-title">
                <div>
                  <h3>Submissions</h3>
                  <p className="men-kicker">Results for this exam only</p>
                </div>
                <span className="men-pill blue">
                  <Shield size={14} /> {examResults.length}
                </span>
              </div>

              <div className="men-table-wrap">
                <table className="men-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Score</th>
                      <th>%</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examResults.length ? (
                      examResults.map((r) => (
                        <tr key={r._id}>
                          <td style={{ fontWeight: 750 }}>{r.student?.name || "—"}</td>
                          <td style={{ color: "rgba(255,255,255,0.72)" }}>{r.student?.email || "—"}</td>
                          <td>
                            {r.status === "Completed" ? `${r.score}/${r.total}` : "—"}
                          </td>
                          <td>{typeof r.percentage === "number" ? `${r.percentage}%` : "—"}</td>
                          <td style={{ color: "rgba(255,255,255,0.72)" }}>
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                          No student submissions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


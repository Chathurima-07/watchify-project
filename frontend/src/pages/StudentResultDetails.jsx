import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CircleAlert, Percent, Shield } from "lucide-react";
import "../styles/dashboardTokens.css";
import "../styles/student.css";

const API_BASE = "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StudentResultDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/api/student/results/${id}`, {
          headers: authHeaders(),
        });
        setResult(res.data);
      } catch (e) {
        if (e?.response?.status === 401) {
          navigate("/");
          return;
        }
        setError(e?.response?.data?.message || e.message || "Failed to load result.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <div className="student-shell"><div className="student-main"><span className="student-pill gray">Loading result…</span></div></div>;
  if (error || !result) return <div className="student-shell"><div className="student-main"><span className="student-pill red">{error || "Result not found."}</span></div></div>;

  const percentage = typeof result.percentage === "number" ? result.percentage : 0;
  const passed = percentage >= 50;

  return (
    <div className="student-shell">
      <div className="student-main">
        <button className="student-btn" onClick={() => navigate("/student")}>
          <ArrowLeft size={16} />
          Back to Student Dashboard
        </button>

        <div style={{ height: 14 }} />

        <div className="student-card">
          <div className="student-card-inner">
            <h2 style={{ marginTop: 0 }}>{result.exam?.title || "Exam Result"}</h2>
            <p style={{ color: "rgba(255,255,255,0.72)" }}>
              Submitted: {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "—"}
            </p>

            <div className="student-grid stats" style={{ marginTop: 14 }}>
              <div className="student-card"><div className="student-card-inner"><div>Score</div><div style={{ fontSize: 24, fontWeight: 800 }}>{result.score}</div></div></div>
              <div className="student-card"><div className="student-card-inner"><div>Total</div><div style={{ fontSize: 24, fontWeight: 800 }}>{result.total}</div></div></div>
              <div className="student-card"><div className="student-card-inner"><div>Percentage</div><div style={{ fontSize: 24, fontWeight: 800 }}>{percentage}%</div></div></div>
              <div className="student-card"><div className="student-card-inner"><div>Status</div><div style={{ fontSize: 16, fontWeight: 800 }}>{passed ? "Pass" : "Needs Improvement"}</div></div></div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className={`student-pill ${passed ? "green" : "yellow"}`}>
                {passed ? <BadgeCheck size={14} /> : <CircleAlert size={14} />}
                {passed ? "Pass" : "Needs Improvement"}
              </span>
              <span className="student-pill blue">
                <Percent size={14} /> Accuracy: {percentage}%
              </span>
              <span className="student-pill gray">
                <Shield size={14} /> Attempted questions: {result.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


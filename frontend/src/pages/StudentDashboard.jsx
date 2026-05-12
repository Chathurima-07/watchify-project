import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  MonitorDot,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import "../styles/dashboardTokens.css";
import "../styles/student.css";

const API_BASE = "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const ShieldLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2.5c-.28 0-.55.08-.78.22L5.8 5.82c-.48.26-.78.76-.78 1.31v5.12c0 5.02 3.25 8.92 6.66 9.98.2.06.4.06.6 0 3.41-1.06 6.66-4.96 6.66-9.98V7.13c0-.55-.3-1.05-.78-1.31l-5.42-3.1A1.6 1.6 0 0 0 12 2.5Z"
      stroke="white"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M9.25 12.2l1.9 1.9 3.7-4.1"
      stroke="white"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function StudentDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [violations, setViolations] = useState([]);
  const [flagProfile, setFlagProfile] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const loadAll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [statsRes, examsRes, resultsRes, violationsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/student/stats`, { headers: authHeaders() }),
        axios.get(`${API_BASE}/api/student/exams`, { headers: authHeaders() }),
        axios.get(`${API_BASE}/api/student/results`, { headers: authHeaders() }),
        axios.get(`${API_BASE}/api/student/violations`, { headers: authHeaders() }),
      ]);
      setStats(statsRes.data || null);
      setExams(Array.isArray(examsRes.data) ? examsRes.data : []);
      setResults(Array.isArray(resultsRes.data) ? resultsRes.data : []);
      setViolations(Array.isArray(violationsRes.data) ? violationsRes.data : []);

      try {
        const profileRes = await axios.get(`${API_BASE}/api/student/profile`, { headers: authHeaders() });
        const prof = profileRes.data;
        setFlagProfile(prof && typeof prof === "object" ? prof : null);
        if (prof && typeof prof === "object") {
          try {
            const raw = localStorage.getItem("user");
            if (raw) {
              const u = JSON.parse(raw);
              if (u && typeof u === "object") {
                const next = {
                  ...u,
                  flagged: !!prof.flagged,
                  flagReason: prof.flagReason || "",
                  flagSeverity: prof.flagSeverity || "Low",
                  flaggedAt: prof.flaggedAt || null,
                };
                localStorage.setItem("user", JSON.stringify(next));
              }
            }
          } catch {
            /* ignore localStorage */
          }
        }
      } catch {
        setFlagProfile(null);
      }
    } catch (e) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }
      setError(e?.response?.data?.message || e.message || "Failed to load student data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentExams = exams.slice(0, 6);
  const recentResults = results.slice(0, 8);
  const recentViolations = violations.slice(0, 8);

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const sectionTitle =
    active === "dashboard"
      ? "Student Dashboard"
      : active === "exams"
      ? "Available Exams"
      : active === "results"
      ? "My Results"
      : active === "monitoring"
      ? "Monitoring Logs"
      : "Settings";

  return (
    <div className="student-shell">
      <div className="student-layout">
        <aside className="student-sidebar">
          <div className="student-brand">
            <div className="student-logo" aria-hidden="true">
              <ShieldLogo />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16 }}>Watchify</h2>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.62)", fontSize: 12 }}>
                AI Proctoring Platform
              </p>
            </div>
            <span className="student-role-pill">Student</span>
          </div>

          <nav className="student-nav">
            <button className={`student-nav-btn ${active === "dashboard" ? "active" : ""}`} onClick={() => setActive("dashboard")}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button className={`student-nav-btn ${active === "exams" ? "active" : ""}`} onClick={() => setActive("exams")}>
              <BookOpen size={18} /> Available Exams
            </button>
            <button className={`student-nav-btn ${active === "results" ? "active" : ""}`} onClick={() => setActive("results")}>
              <FileText size={18} /> My Results
            </button>
            <button className={`student-nav-btn ${active === "monitoring" ? "active" : ""}`} onClick={() => setActive("monitoring")}>
              <MonitorDot size={18} /> Monitoring Logs
            </button>
            <button className={`student-nav-btn ${active === "settings" ? "active" : ""}`} onClick={() => setActive("settings")}>
              <Settings size={18} /> Settings
            </button>
          </nav>

          <div style={{ flex: 1 }} />
          <button className="student-btn" onClick={onLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </aside>

        <main className="student-main">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26 }}>{sectionTitle}</h1>
              <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.62)" }}>
                Real-time learning analytics and monitored exam workflow
              </p>
            </div>
            <button className="student-btn" onClick={loadAll}>
              <Activity size={16} /> Refresh
            </button>
          </div>

          {error ? (
            <div className="student-card" style={{ marginBottom: 14 }}>
              <div className="student-card-inner">
                <span className="student-pill red">
                  <Shield size={14} /> {error}
                </span>
              </div>
            </div>
          ) : null}

          {flagProfile?.flagged ? (
            <div className="student-flag-banner" role="alert">
              <div className="student-flag-banner-icon" aria-hidden="true">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="student-flag-banner-title">
                  Your account has been flagged for suspicious exam behavior.
                </div>
                <div className="student-flag-banner-meta">
                  <span className="student-pill red">
                    Severity: {flagProfile.flagSeverity || "Low"}
                  </span>
                  {flagProfile.flaggedAt ? (
                    <span className="student-pill gray">
                      Flagged: {new Date(flagProfile.flaggedAt).toLocaleString()}
                    </span>
                  ) : null}
                </div>
                {flagProfile.flagReason ? (
                  <p className="student-flag-banner-reason">{flagProfile.flagReason}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {active === "dashboard" ? (
            <>
              <div className="student-grid stats">
                <div className="student-card"><div className="student-card-inner"><div>Available Exams</div><div style={{ fontSize: 24, fontWeight: 800 }}>{loading ? "…" : stats?.totalExamsAvailable ?? 0}</div></div></div>
                <div className="student-card"><div className="student-card-inner"><div>Exams Attempted</div><div style={{ fontSize: 24, fontWeight: 800 }}>{loading ? "…" : stats?.totalExamsAttempted ?? 0}</div></div></div>
                <div className="student-card"><div className="student-card-inner"><div>Average Score</div><div style={{ fontSize: 24, fontWeight: 800 }}>{loading ? "…" : typeof stats?.averageScore === "number" ? `${stats.averageScore}%` : "—"}</div></div></div>
                <div className="student-card"><div className="student-card-inner"><div>Monitoring Alerts</div><div style={{ fontSize: 24, fontWeight: 800 }}>{loading ? "…" : stats?.totalViolations ?? 0}</div></div></div>
              </div>

              <div style={{ height: 14 }} />
              <div className="student-grid two">
                <div className="student-card">
                  <div className="student-card-inner">
                    <h3 style={{ marginTop: 0 }}>Available Exams</h3>
                    <div className="student-table-wrap">
                      <table className="student-table">
                        <thead><tr><th>Exam</th><th>Duration</th><th>Questions</th><th>Created</th><th /></tr></thead>
                        <tbody>
                          {!loading && !recentExams.length ? <tr><td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>No exams available yet.</td></tr> : null}
                          {recentExams.map((e) => (
                            <tr key={e._id}>
                              <td style={{ fontWeight: 750 }}>{e.title}</td>
                              <td>{e.duration} min</td>
                              <td>{e.questions?.length || 0}</td>
                              <td style={{ color: "rgba(255,255,255,0.72)" }}>{e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}</td>
                              <td style={{ textAlign: "right" }}>
                                <button className="student-btn primary" onClick={() => navigate(`/exam/${e._id}`)}>
                                  <BookOpen size={16} /> Start
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="student-card">
                  <div className="student-card-inner">
                    <h3 style={{ marginTop: 0 }}>Recent Results</h3>
                    <div className="student-table-wrap">
                      <table className="student-table">
                        <thead><tr><th>Exam</th><th>Score</th><th>%</th><th>Submitted</th><th /></tr></thead>
                        <tbody>
                          {!loading && !recentResults.length ? <tr><td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>No exam attempts yet.</td></tr> : null}
                          {recentResults.map((r) => (
                            <tr key={r._id}>
                              <td style={{ fontWeight: 750 }}>{r.exam?.title || "—"}</td>
                              <td>{`${r.score}/${r.total}`}</td>
                              <td>{typeof r.percentage === "number" ? `${r.percentage}%` : "—"}</td>
                              <td style={{ color: "rgba(255,255,255,0.72)" }}>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</td>
                              <td style={{ textAlign: "right" }}>
                                <button className="student-btn" onClick={() => navigate(`/student/result/${r._id}`)}>
                                  <Eye size={16} /> View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {active === "exams" ? (
            <div className="student-card">
              <div className="student-card-inner">
                <h3 style={{ marginTop: 0 }}>All Available Exams</h3>
                <div className="student-grid two">
                  {!loading && !exams.length ? (
                    <div className="student-pill gray">No exams available yet.</div>
                  ) : (
                    exams.map((e) => (
                      <div key={e._id} className="student-card" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="student-card-inner">
                          <h4 style={{ margin: "0 0 8px" }}>{e.title}</h4>
                          <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.68)" }}>Duration: {e.duration} min</p>
                          <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.68)" }}>Questions: {e.questions?.length || 0}</p>
                          <button className="student-btn primary" onClick={() => navigate(`/exam/${e._id}`)}>
                            <BookOpen size={16} /> Start Exam
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {active === "results" ? (
            <div className="student-card">
              <div className="student-card-inner">
                <h3 style={{ marginTop: 0 }}>My Results</h3>
                <div className="student-table-wrap">
                  <table className="student-table">
                    <thead><tr><th>Exam</th><th>Score</th><th>Total</th><th>%</th><th>Submitted</th><th /></tr></thead>
                    <tbody>
                      {!loading && !results.length ? <tr><td colSpan={6} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>No exam attempts yet.</td></tr> : null}
                      {results.map((r) => (
                        <tr key={r._id}>
                          <td style={{ fontWeight: 750 }}>{r.exam?.title || "—"}</td>
                          <td>{r.score}</td>
                          <td>{r.total}</td>
                          <td>{typeof r.percentage === "number" ? `${r.percentage}%` : "—"}</td>
                          <td style={{ color: "rgba(255,255,255,0.72)" }}>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</td>
                          <td style={{ textAlign: "right" }}>
                            <button className="student-btn" onClick={() => navigate(`/student/result/${r._id}`)}>
                              <Eye size={16} /> View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {active === "monitoring" ? (
            <div className="student-card">
              <div className="student-card-inner">
                <h3 style={{ marginTop: 0 }}>Monitoring Logs</h3>
                <div className="student-table-wrap">
                  <table className="student-table">
                    <thead><tr><th>Exam</th><th>Type</th><th>Severity</th><th>Description</th><th>Timestamp</th></tr></thead>
                    <tbody>
                      {!loading && !recentViolations.length ? <tr><td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>No monitoring alerts yet.</td></tr> : null}
                      {recentViolations.map((v) => (
                        <tr key={v._id}>
                          <td style={{ fontWeight: 750 }}>{v.exam?.title || "—"}</td>
                          <td>{v.type || "—"}</td>
                          <td>
                            <span className={`student-pill ${v.severity === "High" ? "red" : v.severity === "Low" ? "green" : "yellow"}`}>
                              <MonitorDot size={14} /> {v.severity || "Medium"}
                            </span>
                          </td>
                          <td style={{ color: "rgba(255,255,255,0.72)", whiteSpace: "normal" }}>{v.description || "—"}</td>
                          <td style={{ color: "rgba(255,255,255,0.72)" }}>{v.timestamp ? new Date(v.timestamp).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {active === "settings" ? (
            <div className="student-card">
              <div className="student-card-inner">
                <h3 style={{ marginTop: 0 }}>Settings</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  <span className="student-pill gray"><Users size={14} /> Name: {user?.name || "—"}</span>
                  <span className="student-pill gray"><Shield size={14} /> Email: {user?.email || "—"}</span>
                  <span className="student-pill blue"><BadgeCheck size={14} /> Role: {user?.role || "student"}</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="student-btn primary" onClick={loadAll}><Activity size={16} /> Refresh Data</button>
                    <button className="student-btn" onClick={onLogout}><LogOut size={16} /> Logout</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;
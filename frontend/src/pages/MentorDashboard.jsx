import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  ClipboardList,
  Eye,
  FilePlus2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorDot,
  Settings,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "../styles/dashboardTokens.css";
import "../styles/mentor.css";

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

const NavButton = ({ icon: Icon, active, label, onClick }) => (
  <button className={`mentor-nav-btn ${active ? "active" : ""}`} onClick={onClick}>
    <Icon size={18} />
    <span className="mentor-nav-label">{label}</span>
  </button>
);

const Card = ({ title, kicker, right, children }) => (
  <div className="men-card">
    <div className="men-card-inner">
      <div className="men-card-title">
        <div>
          <h3>{title}</h3>
          {kicker ? <p className="men-kicker">{kicker}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  </div>
);

const SectionShell = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    transition={{ duration: 0.22, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

function percent(score, total) {
  if (typeof score !== "number" || typeof total !== "number" || total <= 0) return null;
  return Math.round((score / total) * 100);
}

export default function MentorDashboard() {
  const navigate = useNavigate();

  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [violations, setViolations] = useState([]);

  // Create exam form
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);
  const [creating, setCreating] = useState(false);

  // Results filters
  const [qSearch, setQSearch] = useState("");
  const [qExam, setQExam] = useState("all");
  const [qSort, setQSort] = useState("newest");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const loadAll = async ({ signal } = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [statsRes, examsRes, resultsRes, violationsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/mentor/stats`, { headers: authHeaders(), signal }),
        axios.get(`${API_BASE}/api/mentor/exams`, { headers: authHeaders(), signal }),
        axios.get(`${API_BASE}/api/mentor/results`, { headers: authHeaders(), signal }),
        axios.get(`${API_BASE}/api/mentor/violations`, { headers: authHeaders(), signal }),
      ]);

      setStats(statsRes.data || null);
      setExams(Array.isArray(examsRes.data) ? examsRes.data : []);
      setResults(Array.isArray(resultsRes.data) ? resultsRes.data : []);
      setViolations(Array.isArray(violationsRes.data) ? violationsRes.data : []);
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate("/");
        return;
      }
      setError(e?.response?.data?.message || e.message || "Failed to load mentor data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadAll({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh monitoring + results like “mentor updating” behavior
  useEffect(() => {
    if (active !== "monitoring" && active !== "results" && active !== "dashboard") return;
    const interval = setInterval(() => {
      loadAll();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const closeSidebar = () => setSidebarOpen(false);
  const onNav = (key) => {
    setActive(key);
    closeSidebar();
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { question: "", options: ["", "", "", ""], correctAnswer: "" }]);
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const next = [...q.options];
        next[optIdx] = value;
        return { ...q, options: next };
      })
    );
  };

  const validateExam = () => {
    if (!title.trim()) return "Exam title is required.";
    if (!duration || Number(duration) <= 0) return "Duration must be greater than 0.";
    if (!questions.length) return "At least one question is required.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return `Question ${i + 1} text is required.`;
      if (!Array.isArray(q.options) || q.options.length !== 4) return `Question ${i + 1} must have 4 options.`;
      if (q.options.some((o) => !String(o).trim())) return `All options are required for question ${i + 1}.`;
      if (!q.correctAnswer) return `Select correct answer for question ${i + 1}.`;
      if (!q.options.includes(q.correctAnswer)) return `Correct answer must match an option for question ${i + 1}.`;
    }
    return "";
  };

  const createExam = async (e) => {
    e.preventDefault();
    const msg = validateExam();
    if (msg) {
      alert(msg);
      return;
    }
    setCreating(true);
    try {
      await axios.post(
        `${API_BASE}/api/mentor/exams`,
        { title: title.trim(), duration: Number(duration), questions },
        { headers: authHeaders() }
      );
      alert("Exam created successfully.");
      setTitle("");
      setDuration(60);
      setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: "" }]);
      await loadAll();
      setActive("myExams");
    } catch (e2) {
      if (e2?.response?.status === 401) navigate("/");
      alert(e2?.response?.data?.message || e2.message || "Failed to create exam.");
    } finally {
      setCreating(false);
    }
  };

  const deleteExam = async (examId) => {
    const ok = confirm("Delete this exam? This cannot be undone.");
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE}/api/mentor/exams/${examId}`, { headers: authHeaders() });
      await loadAll();
    } catch (e) {
      if (e?.response?.status === 401) navigate("/");
      alert(e?.response?.data?.message || e.message || "Failed to delete exam.");
    }
  };

  const sectionTitle =
    active === "dashboard"
      ? "Mentor Dashboard"
      : active === "create"
      ? "Create Exam"
      : active === "myExams"
      ? "My Exams"
      : active === "results"
      ? "Student Results"
      : active === "monitoring"
      ? "Monitoring"
      : "Settings";

  const sectionSubtitle =
    active === "dashboard"
      ? "Real-time exam creation, submissions, and integrity monitoring"
      : active === "create"
      ? "Build structured exams with a guided question builder"
      : active === "myExams"
      ? "Manage your created exams and review performance"
      : active === "results"
      ? "Filter and review student submissions for your exams"
      : active === "monitoring"
      ? "Live integrity alerts captured during exam sessions"
      : "Mentor account and dashboard controls";

  const recentExams = useMemo(() => exams.slice(0, 5), [exams]);
  const recentResults = useMemo(() => results.slice(0, 8), [results]);

  const chartData = useMemo(() => {
    const sorted = [...results]
      .filter((r) => r?.submittedAt)
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .slice(-14);
    return sorted.map((r) => ({
      label: new Date(r.submittedAt).toLocaleDateString(),
      value: typeof r.percentage === "number" ? r.percentage : percent(r.score, r.total) || 0,
    }));
  }, [results]);

  const filteredResults = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    let arr = [...results];
    if (qExam !== "all") {
      arr = arr.filter((r) => String(r.exam?.title || "") === qExam);
    }
    if (q) {
      arr = arr.filter((r) => {
        const n = String(r.student?.name || "").toLowerCase();
        const e = String(r.student?.email || "").toLowerCase();
        return n.includes(q) || e.includes(q);
      });
    }
    arr.sort((a, b) => {
      const ta = new Date(a.submittedAt || 0).getTime();
      const tb = new Date(b.submittedAt || 0).getTime();
      return qSort === "oldest" ? ta - tb : tb - ta;
    });
    return arr;
  }, [results, qSearch, qExam, qSort]);

  return (
    <div className="mentor-shell">
      <div className="mentor-layout">
        <div className="mentor-topbar">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="mentor-logo" aria-hidden="true">
              <ShieldLogo />
            </div>
            <div>
              <div className="mentor-brand-title">Watchify</div>
              <div className="mentor-brand-sub">Mentor Console</div>
            </div>
          </div>
          <button
            className="mentor-topbar-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <aside className={`mentor-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="mentor-brand">
            <div className="mentor-logo" aria-hidden="true">
              <ShieldLogo />
            </div>
            <div>
              <h2 className="mentor-brand-title">Watchify</h2>
              <p className="mentor-brand-sub">AI Proctoring Platform</p>
            </div>
            <span className="mentor-role-pill">Mentor</span>
          </div>

          <nav className="mentor-nav" aria-label="Mentor navigation">
            <NavButton
              icon={LayoutDashboard}
              label="Dashboard"
              active={active === "dashboard"}
              onClick={() => onNav("dashboard")}
            />
            <NavButton
              icon={FilePlus2}
              label="Create Exam"
              active={active === "create"}
              onClick={() => onNav("create")}
            />
            <NavButton
              icon={BookOpen}
              label="My Exams"
              active={active === "myExams"}
              onClick={() => onNav("myExams")}
            />
            <NavButton
              icon={GraduationCap}
              label="Student Results"
              active={active === "results"}
              onClick={() => onNav("results")}
            />
            <NavButton
              icon={MonitorDot}
              label="Monitoring"
              active={active === "monitoring"}
              onClick={() => onNav("monitoring")}
            />
            <NavButton
              icon={Settings}
              label="Settings"
              active={active === "settings"}
              onClick={() => onNav("settings")}
            />
          </nav>

          <div className="mentor-nav-spacer" />
          <button className="mentor-logout" onClick={onLogout}>
            <LogOut size={18} />
            <span className="mentor-nav-label">Logout</span>
          </button>
        </aside>

        <main className="mentor-main">
          <div className="mentor-header">
            <div>
              <h1 className="mentor-h1">{sectionTitle}</h1>
              <p className="mentor-subtitle">{sectionSubtitle}</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="men-pill blue">
                <Shield size={14} /> Proctoring Active
              </span>
              <button className="men-btn" onClick={() => loadAll()}>
                <Activity size={16} />
                Refresh
              </button>
            </div>
          </div>

          {error ? (
            <div className="men-card" style={{ marginBottom: 14 }}>
              <div className="men-card-inner">
                <span className="men-pill red">
                  <Shield size={14} /> {error}
                </span>
              </div>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {active === "dashboard" ? (
              <SectionShell key="dash">
                <div className="men-grid stats">
                  <Card
                    title="Exams Created"
                    kicker="Total created by you"
                    right={
                      <span className="men-pill blue">
                        <BookOpen size={14} />
                      </span>
                    }
                  >
                    <div className="men-stat">{loading ? "…" : stats?.totalExamsCreated ?? 0}</div>
                  </Card>

                  <Card
                    title="Students Attempted"
                    kicker="Unique students"
                    right={
                      <span className="men-pill green">
                        <Users size={14} />
                      </span>
                    }
                  >
                    <div className="men-stat">{loading ? "…" : stats?.totalStudentsAttempted ?? 0}</div>
                  </Card>

                  <Card
                    title="Total Submissions"
                    kicker="Completed attempts"
                    right={
                      <span className="men-pill yellow">
                        <ClipboardList size={14} />
                      </span>
                    }
                  >
                    <div className="men-stat">{loading ? "…" : stats?.totalSubmissions ?? 0}</div>
                  </Card>

                  <Card
                    title="Average Score"
                    kicker="Across your exams"
                    right={
                      <span className="men-pill gray">
                        <BadgeCheck size={14} />
                      </span>
                    }
                  >
                    <div className="men-stat">
                      {loading ? "…" : typeof stats?.averageScore === "number" ? `${stats.averageScore}%` : "—"}
                    </div>
                  </Card>
                </div>

                <div style={{ height: 14 }} />

                <div className="men-grid two">
                  <Card title="Score Trend" kicker="Recent submissions performance">
                    <div style={{ width: "100%", height: 260 }}>
                      {loading ? (
                        <span className="men-pill gray">Loading chart…</span>
                      ) : chartData.length ? (
                        <ResponsiveContainer>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="menArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2f6dff" stopOpacity={0.55} />
                                <stop offset="100%" stopColor="#2f6dff" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="label" stroke="rgba(255,255,255,0.55)" />
                            <YAxis stroke="rgba(255,255,255,0.55)" domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{
                                background: "rgba(5,11,24,0.9)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                borderRadius: 12,
                              }}
                              labelStyle={{ color: "rgba(255,255,255,0.75)" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#1f87ff"
                              strokeWidth={2.6}
                              fill="url(#menArea)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="men-pill gray">No student submissions yet.</span>
                      )}
                    </div>
                  </Card>

                  <Card title="Recent Exams" kicker="Your latest created exams">
                    <div className="men-table-wrap">
                      <table className="men-table">
                        <thead>
                          <tr>
                            <th>Exam</th>
                            <th>Duration</th>
                            <th>Questions</th>
                            <th>Created</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {!loading && !recentExams.length ? (
                            <tr>
                              <td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                                No exams created yet.
                              </td>
                            </tr>
                          ) : null}
                          {recentExams.map((e) => (
                            <tr key={e._id}>
                              <td style={{ fontWeight: 750 }}>{e.title}</td>
                              <td>{e.duration} min</td>
                              <td>{e.questionsCount}</td>
                              <td style={{ color: "rgba(255,255,255,0.72)" }}>
                                {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button className="men-btn primary" onClick={() => navigate(`/mentor/exam/${e._id}`)}>
                                  <Eye size={16} />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <div style={{ height: 14 }} />

                <Card title="Recent Results" kicker="Latest student submissions across your exams">
                  <div className="men-table-wrap">
                    <table className="men-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Exam</th>
                          <th>Score</th>
                          <th>%</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && !recentResults.length ? (
                          <tr>
                            <td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              No student submissions yet.
                            </td>
                          </tr>
                        ) : null}
                        {recentResults.map((r) => (
                          <tr key={r._id}>
                            <td style={{ fontWeight: 750 }}>{r.student?.name || "—"}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>{r.exam?.title || "—"}</td>
                            <td>{r.status === "Completed" ? `${r.score}/${r.total}` : "—"}</td>
                            <td>{typeof r.percentage === "number" ? `${r.percentage}%` : "—"}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>
                              {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </SectionShell>
            ) : null}

            {active === "create" ? (
              <SectionShell key="create">
                <Card title="Create New Exam" kicker="Build a secure, proctored exam">
                  <form className="men-form" onSubmit={createExam}>
                    <div className="men-field">
                      <label>Exam title</label>
                      <input className="men-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter exam title" />
                    </div>
                    <div className="men-field">
                      <label>Duration (minutes)</label>
                      <input className="men-input" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>

                    <div className="men-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="men-card-inner">
                        <div className="men-card-title">
                          <div>
                            <h3>Questions</h3>
                            <p className="men-kicker">Add at least one question with 4 options</p>
                          </div>
                          <button type="button" className="men-btn" onClick={addQuestion}>
                            <FilePlus2 size={16} />
                            Add question
                          </button>
                        </div>

                        {questions.map((q, qIdx) => (
                          <div key={qIdx} className="men-card" style={{ marginBottom: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div className="men-card-inner">
                              <div className="men-card-title">
                                <div>
                                  <h3>Question {qIdx + 1}</h3>
                                  <p className="men-kicker">Define question and correct answer</p>
                                </div>
                                <button
                                  type="button"
                                  className="men-btn"
                                  onClick={() => removeQuestion(qIdx)}
                                  disabled={questions.length <= 1}
                                >
                                  <Trash2 size={16} />
                                  Remove
                                </button>
                              </div>

                              <div className="men-field">
                                <label>Question text</label>
                                <input
                                  className="men-input"
                                  value={q.question}
                                  onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                                  placeholder="Enter question"
                                />
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="men-field">
                                    <label>Option {oIdx + 1}</label>
                                    <input
                                      className="men-input"
                                      value={opt}
                                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                      placeholder={`Option ${oIdx + 1}`}
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="men-field" style={{ marginTop: 10 }}>
                                <label>Correct answer</label>
                                <select
                                  className="men-select"
                                  value={q.correctAnswer}
                                  onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                                >
                                  <option value="">Select correct option</option>
                                  {q.options.map((o, i) => (
                                    <option key={i} value={o}>
                                      Option {i + 1}: {o || "—"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}

                        <button className="men-btn primary" type="submit" disabled={creating}>
                          <ClipboardList size={16} />
                          {creating ? "Creating…" : "Create exam"}
                        </button>
                      </div>
                    </div>
                  </form>
                </Card>
              </SectionShell>
            ) : null}

            {active === "myExams" ? (
              <SectionShell key="myexams">
                <Card title="My Exams" kicker="View, open, and delete your created exams">
                  <div className="men-table-wrap">
                    <table className="men-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Duration</th>
                          <th>Questions</th>
                          <th>Created</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && !exams.length ? (
                          <tr>
                            <td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              No exams created yet.
                            </td>
                          </tr>
                        ) : null}
                        {exams.map((e) => (
                          <tr key={e._id}>
                            <td style={{ fontWeight: 750 }}>{e.title}</td>
                            <td>{e.duration} min</td>
                            <td>{e.questionsCount}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>
                              {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                            </td>
                            <td style={{ textAlign: "right", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                              <button className="men-btn primary" onClick={() => navigate(`/mentor/exam/${e._id}`)}>
                                <Eye size={16} />
                                View Details
                              </button>
                              <button className="men-btn" onClick={() => deleteExam(e._id)}>
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </SectionShell>
            ) : null}

            {active === "results" ? (
              <SectionShell key="results">
                <Card
                  title="Student Results"
                  kicker="Search, filter, and sort submissions"
                  right={<span className="men-pill blue"><GraduationCap size={14} /> {filteredResults.length}</span>}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <input
                      className="men-input"
                      value={qSearch}
                      onChange={(e) => setQSearch(e.target.value)}
                      placeholder="Search by student name or email"
                    />
                    <select className="men-select" value={qExam} onChange={(e) => setQExam(e.target.value)}>
                      <option value="all">All exams</option>
                      {exams.map((e) => (
                        <option key={e._id} value={e.title}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                    <select className="men-select" value={qSort} onChange={(e) => setQSort(e.target.value)}>
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
                  </div>

                  <div className="men-table-wrap">
                    <table className="men-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Exam</th>
                          <th>Score</th>
                          <th>%</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && !filteredResults.length ? (
                          <tr>
                            <td colSpan={6} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              No student submissions yet.
                            </td>
                          </tr>
                        ) : null}
                        {filteredResults.map((r) => (
                          <tr key={r._id}>
                            <td style={{ fontWeight: 750 }}>{r.student?.name || "—"}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>{r.student?.email || "—"}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>{r.exam?.title || "—"}</td>
                            <td>{r.status === "Completed" ? `${r.score}/${r.total}` : "—"}</td>
                            <td>{typeof r.percentage === "number" ? `${r.percentage}%` : "—"}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>
                              {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </SectionShell>
            ) : null}

            {active === "monitoring" ? (
              <SectionShell key="monitoring">
                <Card title="Monitoring Alerts" kicker="Real violations captured during exams">
                  <div className="men-table-wrap">
                    <table className="men-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Exam</th>
                          <th>Type</th>
                          <th>Severity</th>
                          <th>Timestamp</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && !violations.length ? (
                          <tr>
                            <td colSpan={7} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              No monitoring alerts yet.
                            </td>
                          </tr>
                        ) : null}
                        {violations.map((v) => (
                          <tr key={v._id}>
                            <td style={{ fontWeight: 750 }}>{v.student?.name || "—"}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>{v.student?.email || "—"}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>{v.exam?.title || "—"}</td>
                            <td>{v.type || "—"}</td>
                            <td>
                              <span className={`men-pill ${v.severity === "High" ? "red" : v.severity === "Low" ? "green" : "yellow"}`}>
                                <MonitorDot size={14} /> {v.severity || "Medium"}
                              </span>
                            </td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>
                              {v.timestamp ? new Date(v.timestamp).toLocaleString() : "—"}
                            </td>
                            <td style={{ color: "rgba(255,255,255,0.72)", whiteSpace: "normal" }}>
                              {v.description || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </SectionShell>
            ) : null}

            {active === "settings" ? (
              <SectionShell key="settings">
                <Card title="Mentor Settings" kicker="Profile and dashboard controls">
                  <div style={{ display: "grid", gap: 10 }}>
                    <span className="men-pill gray">
                      <Users size={14} /> Name: {user?.name || "—"}
                    </span>
                    <span className="men-pill gray">
                      <Shield size={14} /> Email: {user?.email || "—"}
                    </span>
                    <span className="men-pill blue">
                      <BadgeCheck size={14} /> Role: {user?.role || "mentor"}
                    </span>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                      <button className="men-btn primary" onClick={() => loadAll()}>
                        <Activity size={16} />
                        Refresh Data
                      </button>
                      <button className="men-btn" onClick={onLogout}>
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                </Card>
              </SectionShell>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
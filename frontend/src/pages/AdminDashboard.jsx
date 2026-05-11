import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Download,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  Shield,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "../styles/dashboardTokens.css";
import "../styles/admin.css";

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

const StatusBadge = ({ variant = "gray", children, icon: Icon }) => {
  return (
    <span className={`pill ${variant}`}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </span>
  );
};

const StatCard = ({ icon: Icon, title, value, delta, deltaType = "pos" }) => {
  return (
    <div className="admin-card">
      <div className="admin-card-inner">
        <div className="admin-card-title">
          <h3>{title}</h3>
          <span className="pill blue" title={title}>
            <Icon size={14} />
          </span>
        </div>
        <div className="stat-value">{value}</div>
        {delta ? (
          <div className="stat-delta">
            <span className={deltaType === "neg" ? "delta-neg" : "delta-pos"}>
              {delta}
            </span>
            <span>vs previous period</span>
          </div>
        ) : (
          <div className="stat-delta">
            <span style={{ color: "rgba(255,255,255,0.55)" }}>
              Real-time snapshot
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const Card = ({ title, kicker, right, children }) => (
  <div className="admin-card">
    <div className="admin-card-inner">
      <div className="admin-card-title">
        <div>
          <h3>{title}</h3>
          {kicker ? <p className="admin-card-kicker">{kicker}</p> : null}
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

const NavButton = ({ icon: Icon, active, label, onClick }) => (
  <button className={`admin-nav-btn ${active ? "active" : ""}`} onClick={onClick}>
    <Icon size={18} />
    <span className="admin-nav-label">{label}</span>
  </button>
);

const API_BASE = "http://localhost:5000";

async function apiGet(path, signal) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

function emptyArray(v) {
  return Array.isArray(v) ? v : [];
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Real data (wired for your future endpoints)
  const [statsData, setStatsData] = useState(null);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentorToStudent, setMentorToStudent] = useState([]);
  const [studentToMentor, setStudentToMentor] = useState([]);
  const [integrityTrend, setIntegrityTrend] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [suspiciousActivityTrend, setSuspiciousActivityTrend] = useState([]);
  const [recentExports, setRecentExports] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [stats, stu, men, feedback, reports] = await Promise.all([
          apiGet("/api/admin/stats", signal).catch(() => null),
          apiGet("/api/admin/students", signal).catch(() => []),
          apiGet("/api/admin/mentors", signal).catch(() => []),
          apiGet("/api/admin/feedback", signal).catch(() => null),
          apiGet("/api/admin/reports", signal).catch(() => null),
        ]);

        setStatsData(stats);
        setStudents(emptyArray(stu?.students ?? stu));
        setMentors(emptyArray(men?.mentors ?? men));

        setMentorToStudent(emptyArray(feedback?.mentorToStudent));
        setStudentToMentor(emptyArray(feedback?.studentToMentor));

        setIntegrityTrend(emptyArray(stats?.integrityTrend));
        setRiskDistribution(
          emptyArray(stats?.riskDistribution).map((d) => ({
            ...d,
            color:
              d?.color ||
              (d?.name?.toLowerCase?.().includes("low")
                ? "#2dd4bf"
                : d?.name?.toLowerCase?.().includes("medium")
                ? "#fbbf24"
                : "#fb7185"),
          }))
        );
        setSuspiciousActivityTrend(emptyArray(stats?.suspiciousActivityTrend));

        setRecentExports(emptyArray(reports?.recentExports));
      } catch (e) {
        setError(e?.message || "Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const stats = useMemo(() => {
    const v = statsData || {};
    const fmt = (x) => (x === 0 ? "0" : x ? String(x) : "—");
    return [
      {
        icon: Users,
        title: "Total Students",
        value: fmt(v.totalStudents),
        delta: v.studentsDelta || "",
        deltaType: v.studentsDeltaType || "pos",
      },
      {
        icon: UserSquare2,
        title: "Total Mentors",
        value: fmt(v.totalMentors),
        delta: v.mentorsDelta || "",
        deltaType: v.mentorsDeltaType || "pos",
      },
      { icon: BookOpen, title: "Total Exams", value: fmt(v.totalExams) },
      {
        icon: Flag,
        title: "Flagged Cases",
        value: fmt(v.flaggedCases),
        delta: v.flaggedDelta || "",
        deltaType: v.flaggedDeltaType || "neg",
      },
      {
        icon: Shield,
        title: "System Integrity",
        value:
          v.systemIntegrity === 0
            ? "0%"
            : v.systemIntegrity
            ? `${v.systemIntegrity}%`
            : "—",
        delta: v.integrityDelta || "",
        deltaType: v.integrityDeltaType || "pos",
      },
    ];
  }, [statsData]);

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

  const sectionTitle =
    active === "dashboard"
      ? "Admin Dashboard"
      : active === "students"
      ? "Students"
      : active === "mentors"
      ? "Mentors"
      : active === "feedback"
      ? "Feedback"
      : active === "reports"
      ? "Reports"
      : "Settings";

  const sectionSubtitle =
    active === "dashboard"
      ? "System-wide monitoring and analytics"
      : active === "students"
      ? "Risk monitoring, performance insights, and account status"
      : active === "mentors"
      ? "Mentor performance, monitoring activity, and administration"
      : active === "feedback"
      ? "Platform feedback from mentors and students"
      : active === "reports"
      ? "Export platform analytics for audit and compliance"
      : "Configuration for alerts, security, and platform controls";

  return (
    <div className="admin-shell">
      <div className="admin-layout">
        <div className="admin-topbar">
          <div className="brand">
            <div className="admin-logo" aria-hidden="true">
              <ShieldLogo />
            </div>
            <div>
              <div className="admin-brand-title">Watchify</div>
              <div className="admin-brand-sub">Admin Console</div>
            </div>
          </div>
          <button
            className="admin-topbar-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="brand">
            <div className="admin-logo" aria-hidden="true">
              <ShieldLogo />
            </div>
            <div>
              <h2 className="admin-brand-title">Watchify</h2>
              <p className="admin-brand-sub">AI Proctoring Platform</p>
            </div>
            <span className="admin-role-pill">Admin</span>
          </div>

          <nav className="admin-nav" aria-label="Admin navigation">
            <NavButton
              icon={LayoutDashboard}
              label="Dashboard"
              active={active === "dashboard"}
              onClick={() => onNav("dashboard")}
            />
            <NavButton
              icon={Users}
              label="Students"
              active={active === "students"}
              onClick={() => onNav("students")}
            />
            <NavButton
              icon={UserSquare2}
              label="Mentors"
              active={active === "mentors"}
              onClick={() => onNav("mentors")}
            />
            <NavButton
              icon={MessageSquareText}
              label="Feedback"
              active={active === "feedback"}
              onClick={() => onNav("feedback")}
            />
            <NavButton
              icon={FileText}
              label="Reports"
              active={active === "reports"}
              onClick={() => onNav("reports")}
            />
            <NavButton
              icon={Settings}
              label="Settings"
              active={active === "settings"}
              onClick={() => onNav("settings")}
            />
          </nav>

          <div className="admin-nav-spacer" />

          <button className="admin-logout" onClick={onLogout}>
            <LogOut size={18} />
            <span className="admin-nav-label">Logout</span>
          </button>
        </aside>

        <main className="admin-main">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-h1">{sectionTitle}</h1>
              <p className="admin-subtitle">{sectionSubtitle}</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {active === "dashboard" ? (
                <span className="pill blue">
                  <Activity size={14} /> Live Monitoring
                </span>
              ) : null}
              <span className="pill gray">
                <BarChart3 size={14} /> AI Insights Enabled
              </span>
            </div>
          </div>

          {error ? (
            <div className="admin-card" style={{ marginBottom: 14 }}>
              <div className="admin-card-inner">
                <div className="pill red">
                  <Flag size={14} /> {error}
                </div>
              </div>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {active === "dashboard" ? (
              <SectionShell key="dash">
                <div className="admin-grid stats">
                  {stats.map((s) => (
                    <StatCard key={s.title} {...s} />
                  ))}
                </div>

                <div style={{ height: 14 }} />

                <div className="admin-grid two">
                  <Card
                    title="Monthly Integrity Trend"
                    kicker="AI confidence score over last 6 months"
                    right={
                      <StatusBadge variant="green" icon={BadgeCheck}>
                        Stable
                      </StatusBadge>
                    }
                  >
                    <div style={{ width: "100%", height: 260 }}>
                      {loading ? (
                        <div className="pill gray">Loading chart…</div>
                      ) : integrityTrend?.length ? (
                        <ResponsiveContainer>
                          <LineChart data={integrityTrend}>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.55)" />
                            <YAxis stroke="rgba(255,255,255,0.55)" domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{
                                background: "rgba(5,11,24,0.9)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                borderRadius: 12,
                              }}
                              labelStyle={{ color: "rgba(255,255,255,0.75)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#2f6dff"
                              strokeWidth={3}
                              dot={{ r: 3, stroke: "#1f87ff", strokeWidth: 2 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="pill gray">No integrity trend data yet.</div>
                      )}
                    </div>
                  </Card>

                  <Card title="Risk Distribution" kicker="Student risk segmentation (last 30 days)">
                    <div style={{ width: "100%", height: 260 }}>
                      {loading ? (
                        <div className="pill gray">Loading chart…</div>
                      ) : riskDistribution?.length ? (
                        <ResponsiveContainer>
                          <PieChart>
                            <Tooltip
                              contentStyle={{
                                background: "rgba(5,11,24,0.9)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                borderRadius: 12,
                              }}
                              labelStyle={{ color: "rgba(255,255,255,0.75)" }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              iconType="circle"
                              wrapperStyle={{ color: "rgba(255,255,255,0.72)" }}
                            />
                            <Pie
                              data={riskDistribution}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={60}
                              outerRadius={92}
                              paddingAngle={2}
                            >
                              {riskDistribution.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="pill gray">No risk distribution data yet.</div>
                      )}
                    </div>
                  </Card>
                </div>

                <div style={{ height: 14 }} />

                <Card
                  title="Suspicious Activity Trend"
                  kicker="Flag triggers and violations detected by day"
                  right={
                    <StatusBadge variant="yellow" icon={Flag}>
                      Watchlist
                    </StatusBadge>
                  }
                >
                  <div style={{ width: "100%", height: 260 }}>
                    {loading ? (
                      <div className="pill gray">Loading chart…</div>
                    ) : suspiciousActivityTrend?.length ? (
                      <ResponsiveContainer>
                        <AreaChart data={suspiciousActivityTrend}>
                          <defs>
                            <linearGradient id="admArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2f6dff" stopOpacity={0.55} />
                              <stop offset="100%" stopColor="#2f6dff" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="day" stroke="rgba(255,255,255,0.55)" />
                          <YAxis stroke="rgba(255,255,255,0.55)" />
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
                            fill="url(#admArea)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="pill gray">No suspicious activity trend data yet.</div>
                    )}
                  </div>
                </Card>
              </SectionShell>
            ) : null}

            {active === "students" ? (
              <SectionShell key="students">
                <Card title="Student Management" kicker="Monitor performance, integrity, and risk">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Exams Attempted</th>
                          <th>Latest Score</th>
                          <th>Risk Level</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && !students.length ? (
                          <tr>
                            <td colSpan={7} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              No students available yet.
                            </td>
                          </tr>
                        ) : null}
                        {students.map((s) => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 750 }}>{s.name}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>{s.email}</td>
                            <td>{s.examsAttempted ?? "—"}</td>
                            <td>{typeof s.latestScore === "number" ? `${s.latestScore}%` : "—"}</td>
                            <td>
                              <StatusBadge
                                variant={
                                  String(s.risk || "").startsWith("Low")
                                    ? "green"
                                    : String(s.risk || "").startsWith("Medium")
                                    ? "yellow"
                                    : "red"
                                }
                                icon={Flag}
                              >
                                {s.risk || "—"}
                              </StatusBadge>
                            </td>
                            <td>
                              <StatusBadge
                                variant={s.status === "Active" ? "green" : s.status ? "red" : "gray"}
                                icon={s.status === "Active" ? BadgeCheck : Flag}
                              >
                                {s.status || "—"}
                              </StatusBadge>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="btn primary"
                                onClick={() => navigate(`/admin/student/${s.id}`)}
                                disabled={!s.id}
                              >
                                <LayoutDashboard size={16} />
                                View Details
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

            {active === "mentors" ? (
              <SectionShell key="mentors">
                <Card title="Mentor Management" kicker="Track mentor activity and performance metrics">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mentor</th>
                          <th>Email</th>
                          <th>Exams Created</th>
                          <th>Students Monitored</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && !mentors.length ? (
                          <tr>
                            <td colSpan={6} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              No mentors available yet.
                            </td>
                          </tr>
                        ) : null}
                        {mentors.map((m) => (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 750 }}>{m.name}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>{m.email}</td>
                            <td>{m.examsCreated ?? "—"}</td>
                            <td>{m.studentsMonitored ?? "—"}</td>
                            <td>
                              <StatusBadge
                                variant={m.status === "Active" ? "green" : m.status ? "gray" : "gray"}
                                icon={m.status === "Active" ? BadgeCheck : Settings}
                              >
                                {m.status || "—"}
                              </StatusBadge>
                            </td>
                            <td style={{ textAlign: "right", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                              <button
                                className="btn primary"
                                onClick={() => navigate(`/admin/mentor/${m.id}`)}
                                disabled={!m.id}
                              >
                                <LayoutDashboard size={16} />
                                View Details
                              </button>
                              <button
                                className="btn danger"
                                onClick={() => alert("Disable mentor action (mock).")}
                              >
                                <Settings size={16} />
                                Disable
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

            {active === "feedback" ? (
              <SectionShell key="feedback">
                <div className="admin-grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
                  <Card
                    title="Mentor → Student Feedback"
                    kicker="Quality and integrity observations from mentors"
                    right={
                      <span className="pill blue">
                        <MessageSquareText size={14} /> Verified
                      </span>
                    }
                  >
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Mentor</th>
                            <th>Student</th>
                            <th>Rating</th>
                            <th>Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!loading && !mentorToStudent.length ? (
                            <tr>
                              <td colSpan={4} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                                No mentor → student feedback available yet.
                              </td>
                            </tr>
                          ) : null}
                          {mentorToStudent.map((f, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 750 }}>{f.mentor}</td>
                              <td>{f.student}</td>
                              <td>
                                <StatusBadge variant="blue" icon={Activity}>
                                  {typeof f.rating === "number" ? `${f.rating.toFixed(1)} / 5` : "—"}
                                </StatusBadge>
                              </td>
                              <td style={{ color: "rgba(255,255,255,0.72)" }}>{f.comment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card
                    title="Student → Mentor Feedback"
                    kicker="Experience reports from students for mentors"
                    right={
                      <span className="pill green">
                        <BadgeCheck size={14} /> Quality
                      </span>
                    }
                  >
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Mentor</th>
                            <th>Rating</th>
                            <th>Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!loading && !studentToMentor.length ? (
                            <tr>
                              <td colSpan={4} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                                No student → mentor feedback available yet.
                              </td>
                            </tr>
                          ) : null}
                          {studentToMentor.map((f, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 750 }}>{f.student}</td>
                              <td>{f.mentor}</td>
                              <td>
                                <StatusBadge variant="green" icon={BadgeCheck}>
                                  {typeof f.rating === "number" ? `${f.rating.toFixed(1)} / 5` : "—"}
                                </StatusBadge>
                              </td>
                              <td style={{ color: "rgba(255,255,255,0.72)" }}>{f.comment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </SectionShell>
            ) : null}

            {active === "reports" ? (
              <SectionShell key="reports">
                <div className="admin-grid" style={{ gap: 14 }}>
                  <Card
                    title="Report Filters"
                    kicker="Set scope for exports and compliance reporting"
                    right={
                      <span className="pill gray">
                        <FileText size={14} /> Export Ready
                      </span>
                    }
                  >
                    <div className="filters">
                      <select className="select" defaultValue="last30">
                        <option value="last7">Last 7 days</option>
                        <option value="last30">Last 30 days</option>
                        <option value="jan2026">Jan 2026</option>
                        <option value="feb2026">Feb 2026</option>
                      </select>
                      <select className="select" defaultValue="all">
                        <option value="all">All roles</option>
                        <option value="student">Students</option>
                        <option value="mentor">Mentors</option>
                        <option value="admin">Admins</option>
                      </select>
                      <select className="select" defaultValue="any">
                        <option value="any">Any risk level</option>
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                    </div>
                  </Card>

                  <div className="admin-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
                    <Card
                      title="Student Reports"
                      kicker="Export detailed performance and behavior reports for all students"
                      right={<Users size={18} color="rgba(160,190,255,0.95)" />}
                    >
                      <button className="btn primary" onClick={() => alert("Downloading Student Reports (mock).")}>
                        <Download size={16} />
                        Download Report
                      </button>
                    </Card>
                    <Card
                      title="Mentor Reports"
                      kicker="Export monitoring statistics and performance metrics for mentors"
                      right={<UserSquare2 size={18} color="rgba(160,190,255,0.95)" />}
                    >
                      <button className="btn primary" onClick={() => alert("Downloading Mentor Reports (mock).")}>
                        <Download size={16} />
                        Download Report
                      </button>
                    </Card>
                    <Card
                      title="System Reports"
                      kicker="Export comprehensive system-wide analytics and statistics"
                      right={<BarChart3 size={18} color="rgba(160,190,255,0.95)" />}
                    >
                      <button className="btn primary" onClick={() => alert("Downloading System Reports (mock).")}>
                        <Download size={16} />
                        Download Report
                      </button>
                    </Card>
                  </div>

                  <Card title="Recent Exports" kicker="Audit trail of recent generated reports">
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Report</th>
                            <th>Date</th>
                            <th>Range</th>
                            <th>Size</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {!loading && !recentExports.length ? (
                            <tr>
                              <td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                                No exports recorded yet.
                              </td>
                            </tr>
                          ) : null}
                          {recentExports.map((r) => (
                            <tr key={r.report}>
                              <td style={{ fontWeight: 750 }}>{r.report}</td>
                              <td>{r.date}</td>
                              <td style={{ color: "rgba(255,255,255,0.72)" }}>{r.range}</td>
                              <td>{r.size}</td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  className="btn"
                                  onClick={() => alert(`Downloading ${r.report} (mock).`)}
                                >
                                  <Download size={16} />
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </SectionShell>
            ) : null}

            {active === "settings" ? (
              <SectionShell key="settings">
                <div className="admin-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <Card title="Profile Settings" kicker="Admin identity, profile preferences">
                    <div style={{ display: "grid", gap: 10 }}>
                      <span className="pill gray">
                        <Users size={14} /> Role: Admin
                      </span>
                      <span className="pill blue">
                        <Shield size={14} /> Privileged Access Enabled
                      </span>
                    </div>
                  </Card>
                  <Card title="Security Settings" kicker="Policies and authentication preferences">
                    <div style={{ display: "grid", gap: 10 }}>
                      <span className="pill green">
                        <BadgeCheck size={14} /> MFA Recommended
                      </span>
                      <span className="pill yellow">
                        <Flag size={14} /> Auto-flagging Enabled
                      </span>
                    </div>
                  </Card>
                  <Card title="Notification Settings" kicker="Alerts for critical incidents and platform health">
                    <div style={{ display: "grid", gap: 10 }}>
                      <label className="pill gray" style={{ justifyContent: "space-between" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Bell size={14} /> Email alerts
                        </span>
                        <input type="checkbox" defaultChecked />
                      </label>
                      <label className="pill gray" style={{ justifyContent: "space-between" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Flag size={14} /> Suspicious activity alerts
                        </span>
                        <input type="checkbox" defaultChecked />
                      </label>
                    </div>
                  </Card>
                  <Card title="Platform Settings" kicker="Controls for recordings and integrity enforcement">
                    <div style={{ display: "grid", gap: 10 }}>
                      <label className="pill gray" style={{ justifyContent: "space-between" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Shield size={14} /> Auto flagging
                        </span>
                        <input type="checkbox" defaultChecked />
                      </label>
                      <label className="pill gray" style={{ justifyContent: "space-between" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Activity size={14} /> Exam recording enabled
                        </span>
                        <input type="checkbox" defaultChecked />
                      </label>
                    </div>
                  </Card>
                </div>
              </SectionShell>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
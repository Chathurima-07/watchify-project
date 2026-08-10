import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
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
  MonitorDot,
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
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    throw new Error("Session expired.");
  }
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

async function apiPost(path, body) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    throw new Error("Session expired.");
  }
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

async function apiPatch(path, body) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    throw new Error("Session expired.");
  }
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

async function apiPut(path, body) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    throw new Error("Session expired.");
  }
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

async function downloadReportFile(exportId) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/admin/reports/download/${encodeURIComponent(exportId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    return;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data?.message || "Download failed.");
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `watchify-export-${exportId}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
  const [reportDateRange, setReportDateRange] = useState("last30");
  const [reportRole, setReportRole] = useState("all");
  const [reportRisk, setReportRisk] = useState("any");
  const [exportBusy, setExportBusy] = useState(false);
  const [flaggedStudents, setFlaggedStudents] = useState([]);
  const [adminViolations, setAdminViolations] = useState([]);
  const [adminVioLoading, setAdminVioLoading] = useState(false);
  const [flagModal, setFlagModal] = useState(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagSeverity, setFlagSeverity] = useState("High");
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [stats, stu, men, feedback, reports, flags] = await Promise.all([
          apiGet("/api/admin/stats", signal).catch(() => null),
          apiGet("/api/admin/students", signal).catch(() => []),
          apiGet("/api/admin/mentors", signal).catch(() => []),
          apiGet("/api/admin/feedback", signal).catch(() => null),
          apiGet("/api/admin/reports", signal).catch(() => null),
          apiGet("/api/flags", signal).catch(() => null),
        ]);

        setStatsData(stats);
        setStudents(emptyArray(stu?.students ?? stu));
        setMentors(emptyArray(men?.mentors ?? men));
        setFlaggedStudents(emptyArray(flags?.students));

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

  useEffect(() => {
    if (active !== "monitoring") return;
    const controller = new AbortController();
    const signal = controller.signal;
    (async () => {
      setAdminVioLoading(true);
      try {
        const data = await apiGet("/api/admin/violations", signal);
        setAdminViolations(emptyArray(data?.violations));
      } catch {
        setAdminViolations([]);
      } finally {
        setAdminVioLoading(false);
      }
    })();
    return () => controller.abort();
  }, [active]);

  const violationCountByStudent = useMemo(() => {
    const m = new Map();
    for (const v of adminViolations) {
      const sid = v?.student?._id ? String(v.student._id) : "";
      if (!sid) continue;
      m.set(sid, (m.get(sid) || 0) + 1);
    }
    return m;
  }, [adminViolations]);

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

  const runReportExport = async (type) => {
    setExportBusy(true);
    try {
      await apiPost("/api/admin/reports/export", {
        type,
        dateRange: reportDateRange,
        reportRole,
        reportRisk,
      });
      const reports = await apiGet("/api/admin/reports");
      setRecentExports(emptyArray(reports?.recentExports));
    } catch (e) {
      alert(e?.message || "Export failed.");
    } finally {
      setExportBusy(false);
    }
  };

  const setMentorAccountStatus = async (row) => {
    const next = row.status === "Disabled" ? "active" : "disabled";
    const verb = next === "disabled" ? "disable" : "re-enable";
    if (!window.confirm(`Are you sure you want to ${verb} ${row.name || "this mentor"}?`)) return;
    try {
      await apiPatch(`/api/admin/mentors/${encodeURIComponent(row.id)}/status`, { mentorStatus: next });
      const men = await apiGet("/api/admin/mentors");
      setMentors(emptyArray(men?.mentors ?? men));
    } catch (e) {
      alert(e?.message || "Could not update mentor status.");
    }
  };

  const reloadFlagsAndStudents = async () => {
    try {
      const [flags, stu] = await Promise.all([apiGet("/api/flags"), apiGet("/api/admin/students")]);
      setFlaggedStudents(emptyArray(flags?.students));
      setStudents(emptyArray(stu?.students ?? stu));
    } catch (e) {
      alert(e?.message || "Failed to refresh flags.");
    }
  };

  const openFlagStudentModal = ({ studentId, studentName, violationType }) => {
    setFlagSubmitting(false);
    setFlagModal({ studentId, studentName, violationType: violationType || "—" });
    setFlagReason("");
    setFlagSeverity("High");
  };

  const closeFlagStudentModal = () => {
    setFlagModal(null);
    setFlagReason("");
    setFlagSubmitting(false);
  };

  const submitFlagStudent = async () => {
    if (!flagModal?.studentId) return;
    const reason = flagReason.trim();
    if (!reason) {
      alert("Please enter a reason.");
      return;
    }
    setFlagSubmitting(true);
    try {
      await apiPost(`/api/flags/${encodeURIComponent(flagModal.studentId)}`, {
        reason,
        severity: flagSeverity,
      });
      closeFlagStudentModal();
      await reloadFlagsAndStudents();
      if (active === "monitoring") {
        const data = await apiGet("/api/admin/violations");
        setAdminViolations(emptyArray(data?.violations));
      }
    } catch (e) {
      alert(e?.message || "Failed to flag student.");
    } finally {
      setFlagSubmitting(false);
    }
  };

  const removeStudentFlag = async (studentId) => {
    if (!window.confirm("Remove flag from this student?")) return;
    try {
      await apiPut(`/api/flags/${encodeURIComponent(studentId)}/remove`, {});
      await reloadFlagsAndStudents();
      if (active === "monitoring") {
        const data = await apiGet("/api/admin/violations");
        setAdminViolations(emptyArray(data?.violations));
      }
    } catch (e) {
      alert(e?.message || "Failed to remove flag.");
    }
  };

  const filteredExports = useMemo(() => {
    let rows = [...recentExports];
    if (reportRole === "student") rows = rows.filter((r) => r.exportType === "student");
    else if (reportRole === "mentor") rows = rows.filter((r) => r.exportType === "mentor");
    else if (reportRole === "admin") rows = rows.filter((r) => r.exportType === "system");
    if (reportDateRange !== "last30") {
      rows = rows.filter((r) => String(r.range || "").toLowerCase().includes(String(reportDateRange).toLowerCase()));
    }
    if (reportRisk !== "any") {
      rows = rows.filter((r) => String(r.range || "").toLowerCase().includes(String(reportRisk).toLowerCase()));
    }
    return rows;
  }, [recentExports, reportDateRange, reportRole, reportRisk]);

  const sectionTitle =
    active === "dashboard"
      ? "Admin Dashboard"
      : active === "students"
      ? "Students"
      : active === "mentors"
      ? "Mentors"
      : active === "monitoring"
      ? "Monitoring Logs"
      : active === "flagged"
      ? "Flagged Students"
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
      : active === "monitoring"
      ? "Review violations and flag students for follow-up"
      : active === "flagged"
      ? "Students marked for suspicious exam behavior"
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
              icon={MonitorDot}
              label="Monitoring"
              active={active === "monitoring"}
              onClick={() => onNav("monitoring")}
            />
            <NavButton
              icon={Flag}
              label="Flagged Students"
              active={active === "flagged"}
              onClick={() => onNav("flagged")}
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
                          <tr key={s.id} className={s.accountFlagged ? "admin-row-flagged" : undefined}>
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
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                                {s.accountFlagged ? (
                                  <span
                                    className="pill red"
                                    title={[s.flagSeverity, s.flagReason, s.flaggedAt ? new Date(s.flaggedAt).toLocaleString() : ""]
                                      .filter(Boolean)
                                      .join(" · ")}
                                    style={{ cursor: "help" }}
                                  >
                                    <AlertTriangle size={14} /> FLAGGED
                                  </span>
                                ) : null}
                                <StatusBadge
                                  variant={s.status === "Active" ? "green" : s.status ? "red" : "gray"}
                                  icon={s.status === "Active" ? BadgeCheck : Flag}
                                >
                                  {s.status || "—"}
                                </StatusBadge>
                              </div>
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
                                type="button"
                                onClick={() => setMentorAccountStatus(m)}
                              >
                                <Settings size={16} />
                                {m.status === "Disabled" ? "Enable" : "Disable"}
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

            {active === "monitoring" ? (
              <SectionShell key="monitoring">
                <Card title="Platform Violation Logs" kicker="Review incidents across all exams and flag students">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Student</th>
                          <th>Exam</th>
                          <th>Mentor</th>
                          <th>Type</th>
                          <th>Severity</th>
                          <th>Description</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminVioLoading ? (
                          <tr>
                            <td colSpan={8} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              Loading violations…
                            </td>
                          </tr>
                        ) : null}
                        {!adminVioLoading && !adminViolations.length ? (
                          <tr>
                            <td colSpan={8} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              No violation logs yet.
                            </td>
                          </tr>
                        ) : null}
                        {!adminVioLoading
                          ? adminViolations.map((v) => {
                              const sid = v?.student?._id ? String(v.student._id) : "";
                              const vCount = sid ? violationCountByStudent.get(sid) || 0 : 0;
                              const canFlag = Boolean(sid);
                              const already = Boolean(v?.student?.flagged);
                              return (
                                <tr key={v._id} className={already ? "admin-row-flagged" : undefined}>
                                  <td style={{ color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap" }}>
                                    {v.timestamp ? new Date(v.timestamp).toLocaleString() : "—"}
                                  </td>
                                  <td style={{ fontWeight: 750 }}>
                                    <div>{v.student?.name || "—"}</div>
                                    {vCount > 5 ? (
                                      <div className="pill yellow" style={{ marginTop: 6, fontSize: 11, width: "fit-content" }}>
                                        Recommended for flagging
                                      </div>
                                    ) : null}
                                  </td>
                                  <td style={{ color: "rgba(255,255,255,0.72)" }}>{v.exam?.title || "—"}</td>
                                  <td style={{ color: "rgba(255,255,255,0.72)" }}>{v.mentor?.name || "—"}</td>
                                  <td>{v.type || "—"}</td>
                                  <td>
                                    <StatusBadge
                                      variant={
                                        v.severity === "High" ? "red" : v.severity === "Low" ? "green" : "yellow"
                                      }
                                      icon={MonitorDot}
                                    >
                                      {v.severity || "Medium"}
                                    </StatusBadge>
                                  </td>
                                  <td style={{ color: "rgba(255,255,255,0.72)", whiteSpace: "normal", maxWidth: 280 }}>
                                    {v.description || "—"}
                                  </td>
                                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                    <button
                                      type="button"
                                      className="btn danger"
                                      disabled={!canFlag || already}
                                      title={already ? "Student is already flagged" : "Flag this student"}
                                      onClick={() =>
                                        openFlagStudentModal({
                                          studentId: sid,
                                          studentName: v.student?.name || "Student",
                                          violationType: v.type || v.description || "Violation",
                                        })
                                      }
                                    >
                                      <Flag size={16} /> Flag Student
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          : null}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </SectionShell>
            ) : null}

            {active === "flagged" ? (
              <SectionShell key="flagged">
                <Card title="Flagged Students" kicker="Accounts marked for suspicious exam behavior">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Severity</th>
                          <th>Reason</th>
                          <th>Flagged At</th>
                          <th>Flagged By</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && !flaggedStudents.length ? (
                          <tr>
                            <td colSpan={7} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                              No flagged students.
                            </td>
                          </tr>
                        ) : null}
                        {flaggedStudents.map((fs) => (
                          <tr key={fs.id} className="admin-row-flagged">
                            <td style={{ fontWeight: 750 }}>{fs.name}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>{fs.email}</td>
                            <td>
                              <StatusBadge
                                variant={
                                  fs.flagSeverity === "High" ? "red" : fs.flagSeverity === "Low" ? "green" : "yellow"
                                }
                                icon={AlertTriangle}
                              >
                                {fs.flagSeverity || "Low"}
                              </StatusBadge>
                            </td>
                            <td style={{ color: "rgba(255,255,255,0.72)", maxWidth: 320 }}>{fs.flagReason || "—"}</td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>
                              {fs.flaggedAt ? new Date(fs.flaggedAt).toLocaleString() : "—"}
                            </td>
                            <td style={{ color: "rgba(255,255,255,0.72)" }}>
                              {fs.flaggedBy?.name || "—"}
                              {fs.flaggedBy?.role ? ` (${fs.flaggedBy.role})` : ""}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button type="button" className="btn danger" onClick={() => removeStudentFlag(fs.id)}>
                                Remove Flag
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
                      <select className="select" value={reportDateRange} onChange={(e) => setReportDateRange(e.target.value)}>
                        <option value="last7">Last 7 days</option>
                        <option value="last30">Last 30 days</option>
                        <option value="jan">Jan</option>
                        <option value="feb">Feb</option>
                      </select>
                      <select className="select" value={reportRole} onChange={(e) => setReportRole(e.target.value)}>
                        <option value="all">All roles</option>
                        <option value="student">Students</option>
                        <option value="mentor">Mentors</option>
                        <option value="admin">Admins</option>
                      </select>
                      <select className="select" value={reportRisk} onChange={(e) => setReportRisk(e.target.value)}>
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
                      <button
                        className="btn primary"
                        type="button"
                        disabled={exportBusy}
                        onClick={() => runReportExport("student")}
                      >
                        <Download size={16} />
                        {exportBusy ? "Working…" : "Generate export"}
                      </button>
                    </Card>
                    <Card
                      title="Mentor Reports"
                      kicker="Export monitoring statistics and performance metrics for mentors"
                      right={<UserSquare2 size={18} color="rgba(160,190,255,0.95)" />}
                    >
                      <button
                        className="btn primary"
                        type="button"
                        disabled={exportBusy}
                        onClick={() => runReportExport("mentor")}
                      >
                        <Download size={16} />
                        {exportBusy ? "Working…" : "Generate export"}
                      </button>
                    </Card>
                    <Card
                      title="System Reports"
                      kicker="Export comprehensive system-wide analytics and statistics"
                      right={<BarChart3 size={18} color="rgba(160,190,255,0.95)" />}
                    >
                      <button
                        className="btn primary"
                        type="button"
                        disabled={exportBusy}
                        onClick={() => runReportExport("system")}
                      >
                        <Download size={16} />
                        {exportBusy ? "Working…" : "Generate export"}
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
                          {!loading && !filteredExports.length ? (
                            <tr>
                              <td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                                No exports recorded yet.
                              </td>
                            </tr>
                          ) : null}
                          {filteredExports.map((r) => (
                            <tr key={r.id || r.report}>
                              <td style={{ fontWeight: 750 }}>{r.report}</td>
                              <td>{r.date}</td>
                              <td style={{ color: "rgba(255,255,255,0.72)" }}>{r.range}</td>
                              <td>{r.size}</td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  className="btn"
                                  type="button"
                                  disabled={!r.id}
                                  onClick={() => downloadReportFile(r.id)}
                                >
                                  <Download size={16} />
                                  Download JSON
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

          {flagModal ? (
            <div
              className="modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-flag-modal-title"
              onClick={() => {
                if (!flagSubmitting) closeFlagStudentModal();
              }}
            >
              <div className="modal modal-flag" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="pill red">
                      <AlertTriangle size={14} />
                    </span>
                    <h2 className="modal-title" id="admin-flag-modal-title">
                      Flag student
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    disabled={flagSubmitting}
                    onClick={closeFlagStudentModal}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                    <strong style={{ color: "var(--adm-text)" }}>{flagModal.studentName}</strong>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}> · Violation: </span>
                    {flagModal.violationType}
                  </p>
                  <label className="admin-flag-field">
                    <span>Severity</span>
                    <select
                      className="select"
                      value={flagSeverity}
                      onChange={(e) => setFlagSeverity(e.target.value)}
                      disabled={flagSubmitting}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </label>
                  <label className="admin-flag-field">
                    <span>Reason</span>
                    <textarea
                      className="admin-flag-textarea"
                      rows={4}
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder="Describe why this student is being flagged…"
                      disabled={flagSubmitting}
                    />
                  </label>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
                    <button type="button" className="btn" disabled={flagSubmitting} onClick={closeFlagStudentModal}>
                      Cancel
                    </button>
                    <button type="button" className="btn danger" disabled={flagSubmitting} onClick={submitFlagStudent}>
                      {flagSubmitting ? "Saving…" : "Confirm Flag"}
                    </button>
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

export default AdminDashboard;
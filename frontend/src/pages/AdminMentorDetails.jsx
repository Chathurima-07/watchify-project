import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  ClipboardList,
  Flag,
  Shield,
  Star,
  TrendingUp,
  UserSquare2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import "../styles/dashboardTokens.css";
import "../styles/admin.css";

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

const StatusBadge = ({ variant = "gray", children, icon: Icon }) => (
  <span className={`pill ${variant}`}>
    {Icon ? <Icon size={14} /> : null}
    {children}
  </span>
);

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

const KpiCard = ({ title, value, icon: Icon, variant = "blue" }) => (
  <div className="admin-card">
    <div className="admin-card-inner">
      <div className="admin-card-title">
        <h3>{title}</h3>
        <span className={`pill ${variant}`}>
          <Icon size={14} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-delta">
        <span style={{ color: "rgba(255,255,255,0.55)" }}>Platform metric</span>
      </div>
    </div>
  </div>
);

function variantForRisk(risk) {
  if (risk?.startsWith("Low")) return "green";
  if (risk?.startsWith("Medium")) return "yellow";
  return "red";
}

export default function AdminMentorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentor, setMentor] = useState(null);
  const [studentPerformanceTrend, setStudentPerformanceTrend] = useState([]);
  const [monitoringActivity, setMonitoringActivity] = useState([]);
  const [integrityDistribution, setIntegrityDistribution] = useState([]);
  const [examEngagement, setExamEngagement] = useState([]);
  const [managedExams, setManagedExams] = useState([]);
  const [monitoringFeed, setMonitoringFeed] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet(`/api/admin/mentor/${encodeURIComponent(id)}`, signal);
        setMentor(data?.mentor ?? data ?? null);
        setStudentPerformanceTrend(emptyArray(data?.charts?.studentPerformanceTrend));
        setMonitoringActivity(emptyArray(data?.charts?.monitoringActivity));
        setIntegrityDistribution(
          emptyArray(data?.charts?.integrityDistribution).map((d) => ({
            ...d,
            color:
              d?.color ||
              (String(d?.name || "").toLowerCase().includes("high")
                ? "#2dd4bf"
                : String(d?.name || "").toLowerCase().includes("moderate")
                ? "#fbbf24"
                : "#fb7185"),
          }))
        );
        setExamEngagement(emptyArray(data?.charts?.examEngagement));
        setManagedExams(emptyArray(data?.managedExams));
        setMonitoringFeed(emptyArray(data?.monitoringFeed));
      } catch (e) {
        setError(e?.message || "Failed to load mentor details.");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  const safeMentor =
    mentor ||
    ({
      id,
      name: "Mentor",
      email: "—",
      department: "—",
      status: "",
      experience: "—",
      examsCreated: null,
      studentsMonitored: null,
      avgIntegrity: null,
      violationsHandled: null,
      responseRate: null,
      avgRating: null,
      performanceScore: null,
    });

  const statusVariant = safeMentor.status === "Active" ? "green" : safeMentor.status === "Disabled" ? "gray" : "yellow";

  return (
    <div className="admin-shell">
      <header className="admin-detail-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn" onClick={() => navigate("/admin")}>
            <ArrowLeft size={16} />
            Back to Admin
          </button>
          <div>
            <h1 className="detail-title">Mentor Report Details</h1>
            <p className="detail-sub">Performance metrics, managed exams, and monitoring activity</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatusBadge variant={statusVariant} icon={safeMentor.status === "Active" ? BadgeCheck : Shield}>
            {safeMentor.status}
          </StatusBadge>
          <StatusBadge variant="blue" icon={TrendingUp}>
            Performance {safeMentor.performanceScore}%
          </StatusBadge>
        </div>
      </header>

      <div className="detail-body">
        {error ? (
          <div className="admin-card" style={{ marginBottom: 14 }}>
            <div className="admin-card-inner">
              <div className="pill red">
                <Flag size={14} /> {error}
              </div>
            </div>
          </div>
        ) : null}

        <div className="profile-row">
          <Card
            title="Mentor Profile"
            kicker="Identity, department, and role capabilities"
            right={
              <span className="pill blue">
                <UserSquare2 size={14} /> {safeMentor.experience}
              </span>
            }
          >
            <div className="profile-card">
              <div className="avatar" aria-hidden="true">
                {safeMentor.name
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="profile-meta">
                <h2>{safeMentor.name}</h2>
                <p>{safeMentor.email}</p>
                <p>{safeMentor.department}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <StatusBadge variant={statusVariant} icon={BadgeCheck}>
                Status: {safeMentor.status || "—"}
              </StatusBadge>
              <StatusBadge variant="green" icon={Star}>
                Avg rating: {safeMentor.avgRating ?? "—"}/5
              </StatusBadge>
              <StatusBadge variant="blue" icon={Shield}>
                Avg student integrity: {safeMentor.avgIntegrity ?? "—"}%
              </StatusBadge>
              <StatusBadge variant="gray" icon={BarChart3}>
                Response rate: {safeMentor.responseRate ?? "—"}%
              </StatusBadge>
            </div>
          </Card>

          <Card title="Feedback Analytics" kicker="Student reviews and mentor scoring">
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <StatusBadge variant="green" icon={Star}>
                  Student ratings: {safeMentor.avgRating}/5
                </StatusBadge>
                <StatusBadge variant="blue" icon={TrendingUp}>
                  Performance score: {safeMentor.performanceScore}%
                </StatusBadge>
              </div>
              <div className="timeline-item" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="timeline-icon">
                  <Star size={18} />
                </div>
                <div className="timeline-main">
                  <div className="timeline-top">
                    <p className="timeline-title">Review comments</p>
                    <StatusBadge variant="green" icon={BadgeCheck}>
                      Positive
                    </StatusBadge>
                  </div>
                  <p className="timeline-desc">
                    “Mentor responded quickly”, “Clear exam instructions”, “Fair monitoring.”
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="kpi-row">
          <KpiCard title="Exams Created" value={safeMentor.examsCreated ?? "—"} icon={ClipboardList} variant="blue" />
          <KpiCard title="Students Monitored" value={safeMentor.studentsMonitored ?? "—"} icon={UserSquare2} variant="green" />
          <KpiCard title="Violations Handled" value={safeMentor.violationsHandled ?? "—"} icon={Flag} variant="yellow" />
          <KpiCard title="Response Rate" value={safeMentor.responseRate ? `${safeMentor.responseRate}%` : "—"} icon={BarChart3} variant="blue" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="admin-grid two" style={{ marginBottom: 14 }}>
            <Card title="Student Performance Trend" kicker="Average student outcome trend across months">
              <div style={{ width: "100%", height: 240 }}>
                {loading ? (
                  <div className="pill gray">Loading chart…</div>
                ) : studentPerformanceTrend.length ? (
                  <ResponsiveContainer>
                    <LineChart data={studentPerformanceTrend}>
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
                      <Line type="monotone" dataKey="value" stroke="#2f6dff" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="pill gray">No performance trend data yet.</div>
                )}
              </div>
            </Card>

            <Card title="Monitoring Activity Graph" kicker="Proctoring operations logged per day">
              <div style={{ width: "100%", height: 240 }}>
                {loading ? (
                  <div className="pill gray">Loading chart…</div>
                ) : monitoringActivity.length ? (
                  <ResponsiveContainer>
                    <AreaChart data={monitoringActivity}>
                      <defs>
                        <linearGradient id="monArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1f87ff" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#1f87ff" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.55)" />
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
                        fill="url(#monArea)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="pill gray">No monitoring activity data yet.</div>
                )}
              </div>
            </Card>
          </div>

          <div className="admin-grid two" style={{ marginBottom: 14 }}>
            <Card title="Integrity Distribution" kicker="Integrity levels of sessions monitored">
              <div style={{ width: "100%", height: 240 }}>
                {loading ? (
                  <div className="pill gray">Loading chart…</div>
                ) : integrityDistribution.length ? (
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
                      <Pie
                        data={integrityDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={92}
                        paddingAngle={2}
                      >
                        {integrityDistribution.map((e) => (
                          <Cell key={e.name} fill={e.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="pill gray">No integrity distribution data yet.</div>
                )}
              </div>
            </Card>

            <Card title="Exam Engagement Chart" kicker="Weekly engagement and participation score">
              <div style={{ width: "100%", height: 240 }}>
                {loading ? (
                  <div className="pill gray">Loading chart…</div>
                ) : examEngagement.length ? (
                  <ResponsiveContainer>
                    <LineChart data={examEngagement}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.55)" />
                      <YAxis stroke="rgba(255,255,255,0.55)" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(5,11,24,0.9)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderRadius: 12,
                        }}
                        labelStyle={{ color: "rgba(255,255,255,0.75)" }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="pill gray">No engagement data yet.</div>
                )}
              </div>
            </Card>
          </div>

          <div className="admin-grid two" style={{ marginBottom: 14 }}>
            <Card title="Managed Exams" kicker="Exam-level performance and risk monitoring">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Students Attended</th>
                      <th>Avg Score</th>
                      <th>Risk</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && !managedExams.length ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 18, color: "rgba(255,255,255,0.62)" }}>
                          No managed exams available yet.
                        </td>
                      </tr>
                    ) : null}
                    {managedExams.map((e) => (
                      <tr key={e.name}>
                        <td style={{ fontWeight: 750 }}>{e.name}</td>
                        <td>{e.students}</td>
                        <td>{e.avgScore}%</td>
                        <td>
                          <StatusBadge variant={variantForRisk(e.risk)} icon={Flag}>
                            {e.risk}
                          </StatusBadge>
                        </td>
                        <td>
                          <StatusBadge variant={e.status === "Completed" ? "green" : "yellow"} icon={Shield}>
                            {e.status}
                          </StatusBadge>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn" onClick={() => alert("Exam action (mock).")}>
                            <Shield size={16} />
                            Action
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Student Monitoring Feed" kicker="Recent actions and review events">
              <div className="timeline">
                {!loading && !monitoringFeed.length ? (
                  <div className="pill gray">No monitoring feed entries yet.</div>
                ) : null}
                {monitoringFeed.map((f, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-icon">
                      <Shield size={18} />
                    </div>
                    <div className="timeline-main">
                      <div className="timeline-top">
                        <p className="timeline-title">{f.action}</p>
                        <span className="timeline-time">{f.time}</span>
                      </div>
                      <p className="timeline-desc">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


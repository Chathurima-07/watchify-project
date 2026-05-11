import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CameraOff,
  CircleAlert,
  Download,
  Flag,
  Headphones,
  Minimize2,
  PanelsTopLeft,
  Play,
  Shield,
  SquareArrowOutUpRight,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
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
        <span style={{ color: "rgba(255,255,255,0.55)" }}>AI computed</span>
      </div>
    </div>
  </div>
);

const VideoModal = ({ open, onClose, title }) => {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="modal-head">
              <h3 className="modal-title">{title}</h3>
              <button className="btn" onClick={onClose} aria-label="Close">
                <X size={16} />
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="video-placeholder">
                <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
                  <Play size={34} />
                  <div>Recording preview (placeholder)</div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                    Connect real video URLs later from the backend.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button className="btn primary" onClick={() => alert("Play (mock).")}>
                  <Play size={16} />
                  Play
                </button>
                <button className="btn" onClick={() => alert("Download (mock).")}>
                  <Download size={16} />
                  Download
                </button>
                <button className="btn" onClick={() => alert("Open in player (mock).")}>
                  <SquareArrowOutUpRight size={16} />
                  Open
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

function variantForRisk(risk) {
  if (risk?.startsWith("Low")) return "green";
  if (risk?.startsWith("Medium")) return "yellow";
  return "red";
}

function variantForStatus(status) {
  return status === "Active" ? "green" : status === "Flagged" ? "red" : status ? "gray" : "gray";
}

export default function AdminStudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRecording, setActiveRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [student, setStudent] = useState(null);
  const [marksTrend, setMarksTrend] = useState([]);
  const [suspicionTrend, setSuspicionTrend] = useState([]);
  const [focusTrend, setFocusTrend] = useState([]);
  const [riskPie, setRiskPie] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet(`/api/admin/student/${encodeURIComponent(id)}`, signal);
        setStudent(data?.student ?? data ?? null);
        setMarksTrend(emptyArray(data?.charts?.marksTrend));
        setSuspicionTrend(emptyArray(data?.charts?.suspicionTrend));
        setFocusTrend(emptyArray(data?.charts?.focusTrend));
        setRiskPie(
          emptyArray(data?.charts?.riskDistribution).map((d) => ({
            ...d,
            color:
              d?.color ||
              (String(d?.name || "").toLowerCase().includes("low")
                ? "#2dd4bf"
                : String(d?.name || "").toLowerCase().includes("medium")
                ? "#fbbf24"
                : "#fb7185"),
          }))
        );
        setTimeline(emptyArray(data?.timeline));
        setRecordings(emptyArray(data?.recordings));
      } catch (e) {
        setError(e?.message || "Failed to load student details.");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  const safeStudent =
    student ||
    ({
      id,
      name: "Student",
      email: "—",
      department: "—",
      course: "—",
      status: "",
      risk: "",
      integrity: null,
      latestScore: null,
      totalExams: null,
    });

  const openRecording = (rec) => {
    setActiveRecording(rec);
    setModalOpen(true);
  };

  const riskVariant = variantForRisk(safeStudent.risk);
  const statusVariant = variantForStatus(safeStudent.status);

  return (
    <div className="admin-shell">
      <header className="admin-detail-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn" onClick={() => navigate("/admin")}>
            <ArrowLeft size={16} />
            Back to Admin
          </button>
          <div>
            <h1 className="detail-title">Student Report Details</h1>
            <p className="detail-sub">Deep analytics, behavior timeline, and exam recordings</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatusBadge variant={statusVariant} icon={safeStudent.status === "Active" ? BadgeCheck : Flag}>
            {safeStudent.status || "—"}
          </StatusBadge>
          <StatusBadge variant={riskVariant} icon={Shield}>
            {safeStudent.risk || "—"}
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
            title="Student Profile"
            kicker="Identity and high-level performance summary"
            right={
              <span className="pill blue">
                <Shield size={14} /> Integrity{" "}
                {typeof safeStudent.integrity === "number" ? `${safeStudent.integrity}%` : "—"}
              </span>
            }
          >
            <div className="profile-card">
              <div className="avatar" aria-hidden="true">
                {safeStudent.name
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="profile-meta">
                <h2>{safeStudent.name}</h2>
                <p>{safeStudent.email}</p>
                <p>
                  {safeStudent.department} • {safeStudent.course}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <StatusBadge variant={statusVariant} icon={BadgeCheck}>
                Status: {safeStudent.status || "—"}
              </StatusBadge>
              <StatusBadge variant="blue" icon={Shield}>
                Overall integrity:{" "}
                {typeof safeStudent.integrity === "number" ? `${safeStudent.integrity}%` : "—"}
              </StatusBadge>
              <StatusBadge variant="green" icon={BadgeCheck}>
                Latest exam score:{" "}
                {typeof safeStudent.latestScore === "number" ? `${safeStudent.latestScore}%` : "—"}
              </StatusBadge>
              <StatusBadge variant="gray" icon={PanelsTopLeft}>
                Total exams attended: {safeStudent.totalExams ?? "—"}
              </StatusBadge>
            </div>
          </Card>

          <Card title="AI Detection" kicker="Key computed metrics for this student">
            <div style={{ display: "grid", gap: 10 }}>
              <div className="timeline-item" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="timeline-icon">
                  <Shield size={18} />
                </div>
                <div className="timeline-main">
                  <div className="timeline-top">
                    <p className="timeline-title">Risk prediction</p>
                    <StatusBadge variant={riskVariant} icon={Flag}>
                      {safeStudent.risk}
                    </StatusBadge>
                  </div>
                  <p className="timeline-desc">
                    AI model combines face visibility, attention, audio, and session behavior signals.
                  </p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <StatusBadge variant="blue" icon={PanelsTopLeft}>
                  Eye movement tracking: Enabled
                </StatusBadge>
                <StatusBadge variant="green" icon={BadgeCheck}>
                  Face visibility: 93%
                </StatusBadge>
                <StatusBadge variant="green" icon={BadgeCheck}>
                  Focus retention: 88%
                </StatusBadge>
                <StatusBadge variant="yellow" icon={Headphones}>
                  Background noise: Medium
                </StatusBadge>
              </div>
            </div>
          </Card>
        </div>

        <div className="kpi-row">
          <KpiCard title="Focus Score" value={safeStudent.focusScore ?? "—"} icon={BadgeCheck} variant="green" />
          <KpiCard title="Suspicion Score" value={safeStudent.suspicionScore ?? "—"} icon={Flag} variant="yellow" />
          <KpiCard title="Average Marks" value={safeStudent.averageMarks ? `${safeStudent.averageMarks}%` : "—"} icon={Shield} variant="blue" />
          <KpiCard title="Violations Count" value={safeStudent.violationsCount ?? "—"} icon={CircleAlert} variant="red" />
        </div>

        <div className="admin-grid two" style={{ marginBottom: 14 }}>
          <Card title="Marks Trend Graph" kicker="Marks progression across attempts">
            <div style={{ width: "100%", height: 240 }}>
              {loading ? (
                <div className="pill gray">Loading chart…</div>
              ) : marksTrend.length ? (
                <ResponsiveContainer>
                  <LineChart data={marksTrend}>
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
                    <Line type="monotone" dataKey="value" stroke="#2f6dff" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="pill gray">No marks trend data yet.</div>
              )}
            </div>
          </Card>

          <Card title="Risk Distribution Pie Chart" kicker="Session risk breakdown for the period">
            <div style={{ width: "100%", height: 240 }}>
              {loading ? (
                <div className="pill gray">Loading chart…</div>
              ) : riskPie.length ? (
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
                      data={riskPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {riskPie.map((e) => (
                        <Cell key={e.name} fill={e.color} />
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

        <div className="admin-grid two" style={{ marginBottom: 14 }}>
          <Card title="Suspicion Trend Graph" kicker="AI suspicion signals over time">
            <div style={{ width: "100%", height: 240 }}>
              {loading ? (
                <div className="pill gray">Loading chart…</div>
              ) : suspicionTrend.length ? (
                <ResponsiveContainer>
                  <AreaChart data={suspicionTrend}>
                    <defs>
                      <linearGradient id="susArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#fb7185" stopOpacity={0.02} />
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
                      stroke="#fb7185"
                      strokeWidth={2.6}
                      fill="url(#susArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="pill gray">No suspicion trend data yet.</div>
              )}
            </div>
          </Card>

          <Card title="Focus Index Graph" kicker="Attention and engagement index">
            <div style={{ width: "100%", height: 240 }}>
              {loading ? (
                <div className="pill gray">Loading chart…</div>
              ) : focusTrend.length ? (
                <ResponsiveContainer>
                  <LineChart data={focusTrend}>
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
                    <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="pill gray">No focus index data yet.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="admin-grid two" style={{ marginBottom: 14 }}>
          <Card
            title="Behavior Monitoring Timeline"
            kicker="Session events flagged by AI and policy enforcement"
            right={<StatusBadge variant="yellow" icon={Flag}>Auto Flagging</StatusBadge>}
          >
            <div className="timeline">
              {!loading && !timeline.length ? (
                <div className="pill gray">No timeline events available yet.</div>
              ) : null}
              {timeline.map((t, idx) => {
                const sevVariant =
                  t.severity === "Low" ? "green" : t.severity === "Medium" ? "yellow" : "red";
                const Icon = t.icon || CircleAlert;
                return (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-icon">
                      <Icon size={18} />
                    </div>
                    <div className="timeline-main">
                      <div className="timeline-top">
                        <p className="timeline-title">{t.title}</p>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className="timeline-time">{t.time}</span>
                          <StatusBadge variant={sevVariant} icon={CircleAlert}>
                            {t.severity}
                          </StatusBadge>
                        </div>
                      </div>
                      <p className="timeline-desc">{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Exam Recordings" kicker="Playback proctored recordings for investigation">
            <div className="recording-grid">
              {!loading && !recordings.length ? (
                <div className="pill gray">No recordings available yet.</div>
              ) : null}
              {recordings.map((r) => (
                <div key={r.name} className="admin-card recording-card">
                  <div className="admin-card-inner">
                    <div className="admin-card-title">
                      <h3>{r.name}</h3>
                      <StatusBadge variant="blue" icon={Shield}>
                        {r.status || "—"}
                      </StatusBadge>
                    </div>
                    <p>
                      Duration:{" "}
                      <strong style={{ color: "rgba(255,255,255,0.9)" }}>{r.duration || "—"}</strong>
                    </p>
                    <p>Date: {r.date || "—"}</p>
                    <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button className="btn primary" onClick={() => openRecording(r)}>
                        <Play size={16} />
                        Play Recording
                      </button>
                      <button className="btn" onClick={() => alert("Download recording (mock).")}>
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <VideoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeRecording ? `${activeRecording.name} • ${activeRecording.date}` : "Recording"}
      />
    </div>
  );
}


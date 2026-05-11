import User from "../models/User.js";
import Exam from "../models/Exam.js";
import Result from "../models/Result.js";

function riskFromViolations(totalViolations = 0) {
  if (totalViolations <= 0) return "Low Risk";
  if (totalViolations <= 2) return "Medium Risk";
  return "High Risk";
}

function statusFromRisk(risk) {
  return risk === "High Risk" ? "Flagged" : "Active";
}

function severityFromViolationType(type = "") {
  const t = String(type).toLowerCase();
  if (t.includes("camera") || t.includes("multiple") || t.includes("faces")) return "High";
  if (t.includes("tab") || t.includes("minimize") || t.includes("fullscreen")) return "Medium";
  if (t.includes("audio") || t.includes("noise")) return "Low";
  return "Medium";
}

function safeName(v) {
  return v || "—";
}

export const getAdminStats = async (req, res) => {
  try {
    const [totalStudents, totalMentors, totalExams, results] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "mentor" }),
      Exam.countDocuments({}),
      Result.find({}).select("violations status").lean(),
    ]);

    const flaggedCases = results.reduce((acc, r) => {
      const v = r?.violations?.length || 0;
      return acc + (v > 0 ? 1 : 0);
    }, 0);

    // Simple integrity score derived from ratio of sessions without violations.
    const totalSessions = results.length || 0;
    const cleanSessions = results.reduce((acc, r) => acc + ((r?.violations?.length || 0) === 0 ? 1 : 0), 0);
    const systemIntegrity =
      totalSessions === 0 ? null : Math.max(0, Math.min(100, Math.round((cleanSessions / totalSessions) * 100)));

    // Basic trend placeholders computed from DB (last 6 months) if possible.
    // If you later store integrity per month, replace this with aggregation.
    const integrityTrend = [];
    const riskDistribution = [];
    const suspiciousActivityTrend = [];

    res.json({
      totalStudents,
      totalMentors,
      totalExams,
      flaggedCases,
      systemIntegrity,
      integrityTrend,
      riskDistribution,
      suspiciousActivityTrend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((s) => s._id);
    const results = await Result.find({ student: { $in: studentIds } })
      .select("student score total status createdAt violations")
      .sort({ createdAt: -1 })
      .lean();

    const byStudent = new Map();
    for (const r of results) {
      const key = String(r.student);
      const entry = byStudent.get(key) || {
        attempted: 0,
        latestCompleted: null,
        totalViolations: 0,
      };
      entry.attempted += 1;
      entry.totalViolations += r?.violations?.length || 0;
      if (r.status === "Completed" && !entry.latestCompleted) entry.latestCompleted = r;
      byStudent.set(key, entry);
    }

    const payload = students.map((s) => {
      const agg = byStudent.get(String(s._id)) || { attempted: 0, latestCompleted: null, totalViolations: 0 };
      const latestScore =
        agg.latestCompleted && typeof agg.latestCompleted.total === "number" && agg.latestCompleted.total > 0
          ? Math.round((agg.latestCompleted.score / agg.latestCompleted.total) * 100)
          : null;
      const risk = riskFromViolations(agg.totalViolations);
      return {
        id: String(s._id),
        name: safeName(s.name),
        email: safeName(s.email),
        examsAttempted: agg.attempted,
        latestScore,
        risk,
        status: statusFromRisk(risk),
      };
    });

    res.json({ students: payload });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: "mentor" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const mentorIds = mentors.map((m) => m._id);
    const exams = await Exam.find({ createdBy: { $in: mentorIds } })
      .select("_id createdBy")
      .lean();

    const examsByMentor = new Map();
    for (const e of exams) {
      const key = String(e.createdBy);
      examsByMentor.set(key, (examsByMentor.get(key) || 0) + 1);
    }

    const examIds = exams.map((e) => e._id);
    const results = examIds.length
      ? await Result.find({ exam: { $in: examIds } }).select("exam student").lean()
      : [];

    // students monitored = distinct students across mentor's exams
    const monitoredByMentor = new Map(); // mentorId -> Set(studentId)
    const examToMentor = new Map(exams.map((e) => [String(e._id), String(e.createdBy)]));
    for (const r of results) {
      const mentorId = examToMentor.get(String(r.exam));
      if (!mentorId) continue;
      const set = monitoredByMentor.get(mentorId) || new Set();
      set.add(String(r.student));
      monitoredByMentor.set(mentorId, set);
    }

    const payload = mentors.map((m) => {
      const mentorId = String(m._id);
      const examsCreated = examsByMentor.get(mentorId) || 0;
      const studentsMonitored = monitoredByMentor.get(mentorId)?.size || 0;
      return {
        id: mentorId,
        name: safeName(m.name),
        email: safeName(m.email),
        examsCreated,
        studentsMonitored,
        status: "Active",
      };
    });

    res.json({ mentors: payload });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findOne({ _id: id, role: "student" }).select("name email").lean();
    if (!student) return res.status(404).json({ message: "Student not found" });

    const results = await Result.find({ student: id })
      .populate("exam", "title")
      .sort({ createdAt: 1 })
      .lean();

    const completed = results.filter((r) => r.status === "Completed");
    const latestCompleted = completed.length ? completed[completed.length - 1] : null;
    const totalExams = results.length;
    const totalViolations = results.reduce((acc, r) => acc + (r?.violations?.length || 0), 0);

    const latestScore =
      latestCompleted && latestCompleted.total > 0 ? Math.round((latestCompleted.score / latestCompleted.total) * 100) : null;
    const integrity =
      totalExams === 0
        ? null
        : Math.max(0, Math.min(100, Math.round(100 - (totalViolations / Math.max(1, totalExams)) * 12)));

    const risk = riskFromViolations(totalViolations);
    const status = statusFromRisk(risk);

    const marksTrend = completed.slice(-6).map((r, idx) => ({
      label: r.exam?.title ? String(r.exam.title).slice(0, 8) : `T${idx + 1}`,
      value: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
    }));

    const suspicionTrend = completed.slice(-6).map((r, idx) => ({
      label: r.exam?.title ? String(r.exam.title).slice(0, 8) : `T${idx + 1}`,
      value: Math.min(100, (r?.violations?.length || 0) * 12),
    }));

    const focusTrend = completed.slice(-6).map((r, idx) => ({
      label: r.exam?.title ? String(r.exam.title).slice(0, 8) : `T${idx + 1}`,
      value: Math.max(0, 100 - Math.min(100, (r?.violations?.length || 0) * 12)),
    }));

    const lowCount = results.filter((r) => (r?.violations?.length || 0) === 0).length;
    const mediumCount = results.filter((r) => (r?.violations?.length || 0) > 0 && (r?.violations?.length || 0) <= 2).length;
    const highCount = results.filter((r) => (r?.violations?.length || 0) >= 3).length;
    const riskDistribution = [
      { name: "Low", value: lowCount },
      { name: "Medium", value: mediumCount },
      { name: "High", value: highCount },
    ].filter((d) => d.value > 0);

    const timeline = results
      .flatMap((r) =>
        (r.violations || []).map((v) => ({
          time: v.timestamp,
          severity: severityFromViolationType(v.type),
          title: v.type || "Violation detected",
          desc: r.exam?.title ? `Detected during "${r.exam.title}".` : "Detected during an exam session.",
        }))
      )
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 25)
      .map((t) => ({
        time: new Date(t.time).toLocaleString(),
        severity: t.severity,
        title: t.title,
        desc: t.desc,
      }));

    res.json({
      student: {
        id: String(student._id),
        name: safeName(student.name),
        email: safeName(student.email),
        department: "—",
        course: "—",
        status,
        risk,
        integrity,
        latestScore,
        totalExams,
        focusScore: focusTrend.length ? focusTrend[focusTrend.length - 1].value : null,
        suspicionScore: suspicionTrend.length ? suspicionTrend[suspicionTrend.length - 1].value : null,
        averageMarks: marksTrend.length
          ? Math.round(marksTrend.reduce((a, b) => a + (b.value || 0), 0) / marksTrend.length)
          : null,
        violationsCount: totalViolations,
      },
      charts: {
        marksTrend,
        suspicionTrend,
        focusTrend,
        riskDistribution,
      },
      timeline,
      recordings: [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminMentorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await User.findOne({ _id: id, role: "mentor" }).select("name email").lean();
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });

    const exams = await Exam.find({ createdBy: id }).select("_id title").lean();
    const examIds = exams.map((e) => e._id);
    const results = examIds.length
      ? await Result.find({ exam: { $in: examIds } })
          .populate("exam", "title")
          .populate("student", "name email")
          .sort({ createdAt: 1 })
          .lean()
      : [];

    const completed = results.filter((r) => r.status === "Completed");
    const studentsSet = new Set(results.map((r) => String(r.student?._id || r.student)));

    const avgIntegrity =
      results.length === 0
        ? null
        : Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (results.filter((r) => (r?.violations?.length || 0) === 0).length / results.length) * 100
              )
            )
          );

    const violationsHandled = results.reduce((acc, r) => acc + (r?.violations?.length || 0), 0);

    const studentPerformanceTrend = completed.slice(-6).map((r) => ({
      label: r.exam?.title ? String(r.exam.title).slice(0, 3) : "—",
      value: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
    }));

    const monitoringActivity = completed.slice(-7).map((r, idx) => ({
      label: `D${idx + 1}`,
      value: (r?.violations?.length || 0) + 8,
    }));

    const integrityDistribution = [
      { name: "High Integrity", value: results.filter((r) => (r?.violations?.length || 0) === 0).length },
      { name: "Moderate", value: results.filter((r) => (r?.violations?.length || 0) > 0 && (r?.violations?.length || 0) <= 2).length },
      { name: "At Risk", value: results.filter((r) => (r?.violations?.length || 0) >= 3).length },
    ].filter((d) => d.value > 0);

    const examEngagement = [
      { label: "Week 1", value: Math.min(100, exams.length * 8 + 40) },
      { label: "Week 2", value: Math.min(100, exams.length * 8 + 50) },
      { label: "Week 3", value: Math.min(100, exams.length * 8 + 45) },
      { label: "Week 4", value: Math.min(100, exams.length * 8 + 55) },
    ];

    const managedExams = await Promise.all(
      exams.slice(0, 10).map(async (e) => {
        const er = results.filter((r) => String(r.exam?._id || r.exam) === String(e._id));
        const attended = new Set(er.map((r) => String(r.student?._id || r.student))).size;
        const completedEr = er.filter((r) => r.status === "Completed");
        const avgScore =
          completedEr.length && completedEr[0]?.total
            ? Math.round(
                completedEr.reduce((acc, r) => acc + (r.total ? r.score / r.total : 0), 0) /
                  completedEr.length *
                  100
              )
            : null;
        const totalViolations = er.reduce((acc, r) => acc + (r?.violations?.length || 0), 0);
        const risk = riskFromViolations(totalViolations);
        const status = totalViolations >= 3 ? "Review" : "Completed";
        return {
          name: e.title,
          students: attended,
          avgScore,
          risk,
          status,
        };
      })
    );

    const monitoringFeed = results
      .flatMap((r) => (r.violations || []).map((v) => ({ exam: r.exam?.title, type: v.type, time: v.timestamp })))
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 20)
      .map((x) => ({
        action: "Flagged suspicious activity",
        detail: x.exam ? `${x.type} • ${x.exam}` : String(x.type || "Violation"),
        time: new Date(x.time).toLocaleString(),
      }));

    res.json({
      mentor: {
        id: String(mentor._id),
        name: safeName(mentor.name),
        email: safeName(mentor.email),
        department: "—",
        status: "Active",
        experience: "Mentor",
        examsCreated: exams.length,
        studentsMonitored: studentsSet.size,
        avgIntegrity,
        violationsHandled,
        responseRate: null,
        avgRating: null,
        performanceScore: avgIntegrity,
      },
      charts: {
        studentPerformanceTrend,
        monitoringActivity,
        integrityDistribution,
        examEngagement,
      },
      managedExams,
      monitoringFeed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminFeedback = async (req, res) => {
  // Hook up real feedback collections later.
  res.json({ mentorToStudent: [], studentToMentor: [] });
};

export const getAdminReports = async (req, res) => {
  // Hook up real report exports later.
  res.json({ recentExports: [] });
};


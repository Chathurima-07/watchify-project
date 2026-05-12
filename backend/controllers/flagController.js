import User from "../models/User.js";
import Exam from "../models/Exam.js";
import Result from "../models/Result.js";
import Violation from "../models/Violation.js";

const SEVERITIES = ["Low", "Medium", "High"];

async function mentorStudentScopeIds(mentorId) {
  const examIds = await Exam.find({ createdBy: mentorId }).distinct("_id");
  const fromViolations = await Violation.distinct("student", { mentor: mentorId });
  const fromResults =
    examIds.length > 0 ? await Result.distinct("student", { exam: { $in: examIds } }) : [];
  return new Set([...fromViolations.map(String), ...fromResults.map(String)]);
}

async function mentorCanFlagStudent(mentorId, studentId) {
  const scope = await mentorStudentScopeIds(mentorId);
  return scope.has(String(studentId));
}

export const flagStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason, severity } = req.body || {};

    if (!reason || String(reason).trim() === "") {
      return res.status(400).json({ message: "reason is required" });
    }
    const sev = SEVERITIES.includes(severity) ? severity : "Medium";

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (req.user.role === "mentor") {
      const ok = await mentorCanFlagStudent(req.user._id, studentId);
      if (!ok) {
        return res.status(403).json({ message: "You can only flag students linked to your exams or monitoring." });
      }
    }

    student.flagged = true;
    student.flagReason = String(reason).trim();
    student.flagSeverity = sev;
    student.flaggedBy = req.user._id;
    student.flaggedAt = new Date();
    await student.save();

    const updated = await User.findById(student._id)
      .select("-password")
      .populate("flaggedBy", "name email role")
      .lean();

    res.json({ ok: true, student: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeStudentFlag = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.flagged = false;
    student.flagReason = "";
    student.flagSeverity = "Low";
    student.flaggedBy = null;
    student.flaggedAt = null;
    await student.save();

    const updated = await User.findById(student._id).select("-password").lean();
    res.json({ ok: true, student: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listFlaggedStudents = async (req, res) => {
  try {
    const rows = await User.find({ role: "student", flagged: true })
      .select("name email flagReason flagSeverity flaggedAt flaggedBy createdAt")
      .populate("flaggedBy", "name email role")
      .sort({ flaggedAt: -1 })
      .lean();

    let filtered = rows;
    if (req.user.role === "mentor") {
      const allowed = await mentorStudentScopeIds(req.user._id);
      filtered = rows.filter((s) => allowed.has(String(s._id)));
    }

    const students = filtered.map((s) => ({
      id: String(s._id),
      name: s.name || "—",
      email: s.email || "—",
      flagReason: s.flagReason || "",
      flagSeverity: s.flagSeverity || "Low",
      flaggedAt: s.flaggedAt,
      flaggedBy: s.flaggedBy
        ? {
            id: String(s.flaggedBy._id),
            name: s.flaggedBy.name || "—",
            email: s.flaggedBy.email || "—",
            role: s.flaggedBy.role || "—",
          }
        : null,
    }));

    res.json({ ok: true, students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

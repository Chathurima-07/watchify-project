import Exam from "../models/Exam.js";
import Result from "../models/Result.js";
import Violation from "../models/Violation.js";
import User from "../models/User.js";

async function activeMentorObjectIds() {
  const mentors = await User.find({ role: "mentor", mentorStatus: { $ne: "disabled" } }).select("_id").lean();
  return mentors.map((m) => m._id);
}

async function assertExamMentorActive(exam) {
  if (!exam?.createdBy) return { ok: true };
  const mentor = await User.findById(exam.createdBy).select("role mentorStatus").lean();
  if (mentor?.role === "mentor" && mentor.mentorStatus === "disabled") {
    return { ok: false, message: "This exam is no longer available." };
  }
  return { ok: true };
}

function sanitizeExam(examDoc) {
  const exam = examDoc?.toObject ? examDoc.toObject() : examDoc;
  if (!exam) return null;
  return {
    _id: exam._id,
    title: exam.title,
    duration: exam.duration,
    createdBy: exam.createdBy,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
    questions: Array.isArray(exam.questions)
      ? exam.questions.map((q) => ({
          _id: q._id,
          question: q.question,
          options: q.options,
        }))
      : [],
  };
}

function calculatePercentage(score, total) {
  if (typeof score !== "number" || typeof total !== "number" || total <= 0) return null;
  return Math.round((score / total) * 100);
}

export const getStudentProfile = async (req, res) => {
  try {
    const u = await User.findById(req.user._id)
      .select("name email role flagged flagReason flagSeverity flaggedAt")
      .lean();
    if (!u) return res.status(404).json({ message: "User not found" });
    res.json({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      flagged: !!u.flagged,
      flagReason: u.flagReason || "",
      flagSeverity: u.flagSeverity || "Low",
      flaggedAt: u.flaggedAt || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const mentorIds = await activeMentorObjectIds();
    const [availableExams, attemptedResults, violations] = await Promise.all([
      mentorIds.length ? Exam.countDocuments({ createdBy: { $in: mentorIds } }) : 0,
      Result.find({ student: req.user._id }).select("score total status").lean(),
      Violation.countDocuments({ student: req.user._id }),
    ]);

    const completed = attemptedResults.filter((r) => r.status === "Completed" && r.total > 0);
    const averageScore =
      completed.length === 0
        ? null
        : Math.round(
            (completed.reduce((acc, r) => acc + r.score / r.total, 0) / completed.length) * 100
          );

    res.json({
      totalExamsAvailable: availableExams,
      totalExamsAttempted: attemptedResults.length,
      averageScore,
      totalViolations: violations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentExams = async (req, res) => {
  try {
    const mentorIds = await activeMentorObjectIds();
    if (!mentorIds.length) {
      return res.json([]);
    }
    const exams = await Exam.find({ createdBy: { $in: mentorIds } })
      .select("title duration questions createdBy createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(exams.map((e) => sanitizeExam(e)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .select("title duration questions createdBy createdAt updatedAt")
      .lean();

    if (!exam) return res.status(404).json({ message: "Exam not found" });
    const gate = await assertExamMentorActive(exam);
    if (!gate.ok) return res.status(403).json({ message: gate.message });
    res.json(sanitizeExam(exam));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitStudentExam = async (req, res) => {
  try {
    const { answers } = req.body;
    const { id: examId } = req.params;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "answers must be an array" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const gate = await assertExamMentorActive(exam);
    if (!gate.ok) return res.status(403).json({ message: gate.message });

    const existing = await Result.findOne({ student: req.user._id, exam: examId });
    if (existing && existing.status === "Completed") {
      return res.status(400).json({ message: "Exam already submitted" });
    }

    let score = 0;
    exam.questions.forEach((q, idx) => {
      if (q.correctAnswer === answers[idx]) score += 1;
    });

    const total = exam.questions.length;
    const percentage = calculatePercentage(score, total);

    const result = await Result.findOneAndUpdate(
      { student: req.user._id, exam: examId },
      {
        score,
        total,
        status: "Completed",
      },
      { new: true, upsert: true }
    );

    res.json({
      score,
      total,
      percentage,
      resultId: result._id,
      submittedAt: result.updatedAt || result.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate("exam", "title duration")
      .sort({ createdAt: -1 })
      .lean();

    const payload = results.map((r) => ({
      _id: r._id,
      exam: r.exam
        ? {
            _id: r.exam._id,
            title: r.exam.title,
            duration: r.exam.duration,
          }
        : null,
      score: r.score,
      total: r.total,
      percentage: calculatePercentage(r.score, r.total),
      status: r.status,
      submittedAt: r.updatedAt || r.createdAt,
      createdAt: r.createdAt,
    }));

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentResultById = async (req, res) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, student: req.user._id })
      .populate("exam", "title duration createdAt")
      .lean();

    if (!result) return res.status(404).json({ message: "Result not found" });

    res.json({
      _id: result._id,
      exam: result.exam
        ? {
            _id: result.exam._id,
            title: result.exam.title,
            duration: result.exam.duration,
            createdAt: result.exam.createdAt,
          }
        : null,
      score: result.score,
      total: result.total,
      percentage: calculatePercentage(result.score, result.total),
      status: result.status,
      submittedAt: result.updatedAt || result.createdAt,
      createdAt: result.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentViolations = async (req, res) => {
  try {
    const logs = await Violation.find({ student: req.user._id })
      .populate("exam", "title")
      .sort({ timestamp: -1 })
      .lean();

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStudentViolation = async (req, res) => {
  try {
    const { examId, type, severity, description } = req.body || {};
    if (!examId || !type) {
      return res.status(400).json({ message: "examId and type are required" });
    }

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const gate = await assertExamMentorActive(exam);
    if (!gate.ok) return res.status(403).json({ message: gate.message });

    const violation = await Violation.create({
      student: req.user._id,
      exam: exam._id,
      mentor: exam.createdBy,
      type,
      severity: severity || "Medium",
      description: description || "",
      timestamp: new Date(),
    });

    res.status(201).json({ message: "Violation logged", violationId: violation._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


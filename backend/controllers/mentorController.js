import Exam from "../models/Exam.js";
import Result from "../models/Result.js";
import Violation from "../models/Violation.js";

function toPercent(score, total) {
  if (typeof score !== "number" || typeof total !== "number" || total <= 0) return null;
  return Math.round((score / total) * 100);
}

export const getMentorStats = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id }).select("_id").lean();
    const examIds = exams.map((e) => e._id);

    const totalExams = examIds.length;
    if (!totalExams) {
      return res.json({
        ok: true,
        totalExamsCreated: 0,
        totalStudentsAttempted: 0,
        totalSubmissions: 0,
        averageScore: null,
      });
    }

    const results = await Result.find({ exam: { $in: examIds } })
      .select("student score total status")
      .lean();

    const totalSubmissions = results.filter((r) => r.status === "Completed").length;
    const studentsAttempted = new Set(results.map((r) => String(r.student))).size;

    const completed = results.filter((r) => r.status === "Completed" && r.total > 0);
    const averageScore =
      completed.length === 0
        ? null
        : Math.round(
            (completed.reduce((acc, r) => acc + r.score / r.total, 0) / completed.length) * 100
          );

    res.json({
      ok: true,
      totalExamsCreated: totalExams,
      totalStudentsAttempted: studentsAttempted,
      totalSubmissions,
      averageScore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorExams = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      exams: exams.map((e) => ({
        _id: e._id,
        title: e.title,
        duration: e.duration,
        questionsCount: Array.isArray(e.questions) ? e.questions.length : 0,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMentorExam = async (req, res) => {
  try {
    const { title, duration, questions } = req.body;
    if (!title || !duration || !Array.isArray(questions) || questions.length < 1) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    for (const q of questions) {
      if (!q?.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer) {
        return res.status(400).json({ message: "Each question must have text, 4 options, and correctAnswer" });
      }
      if (!q.options.includes(q.correctAnswer)) {
        return res.status(400).json({ message: "correctAnswer must match one of the options" });
      }
    }

    const exam = await Exam.create({
      title,
      duration,
      questions,
      createdBy: req.user._id,
    });

    res.status(201).json({ ok: true, message: "Exam created", examId: exam._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorExamById = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id }).lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ ok: true, exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMentorExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    await exam.deleteOne();
    res.json({ ok: true, message: "Exam deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMentorExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const { title, duration, questions } = req.body || {};
    if (title !== undefined) exam.title = title;
    if (duration !== undefined) exam.duration = duration;
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length < 1) {
        return res.status(400).json({ message: "At least one question is required" });
      }
      for (const q of questions) {
        if (!q?.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer) {
          return res.status(400).json({ message: "Each question must have text, 4 options, and correctAnswer" });
        }
        if (!q.options.includes(q.correctAnswer)) {
          return res.status(400).json({ message: "correctAnswer must match one of the options" });
        }
      }
      exam.questions = questions;
    }

    await exam.save();
    res.json({ ok: true, message: "Exam updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorResults = async (req, res) => {
  try {
    const { examId = "", query = "", sort = "newest", from = "", to = "" } = req.query || {};
    const exams = await Exam.find({ createdBy: req.user._id }).select("_id").lean();
    const examIds = exams.map((e) => e._id);
    if (!examIds.length) return res.json({ ok: true, results: [] });

    const results = await Result.find({ exam: { $in: examIds } })
      .populate("student", "name email flagged flagReason flagSeverity")
      .populate("exam", "title")
      .sort({ createdAt: -1 })
      .lean();

    let mapped = results.map((r) => ({
        _id: r._id,
        status: r.status,
        student: r.student,
        exam: r.exam,
        score: r.score,
        total: r.total,
        percentage: toPercent(r.score, r.total),
        submittedAt: r.createdAt,
        violationsCount: r.violations?.length || 0,
      }));

    if (examId) mapped = mapped.filter((r) => String(r.exam?._id || "") === String(examId));
    if (query) {
      const q = String(query).trim().toLowerCase();
      mapped = mapped.filter((r) => {
        const name = String(r.student?.name || "").toLowerCase();
        const email = String(r.student?.email || "").toLowerCase();
        const examTitle = String(r.exam?.title || "").toLowerCase();
        return name.includes(q) || email.includes(q) || examTitle.includes(q);
      });
    }
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        mapped = mapped.filter((r) => new Date(r.submittedAt).getTime() >= fromDate.getTime());
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        mapped = mapped.filter((r) => new Date(r.submittedAt).getTime() <= toDate.getTime());
      }
    }

    mapped.sort((a, b) => {
      const ta = new Date(a.submittedAt || 0).getTime();
      const tb = new Date(b.submittedAt || 0).getTime();
      return sort === "oldest" ? ta - tb : tb - ta;
    });

    res.json({ ok: true, results: mapped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorViolations = async (req, res) => {
  try {
    const { examId = "", severity = "all", from = "", to = "" } = req.query || {};
    const items = await Violation.find({ mentor: req.user._id })
      .populate("student", "name email flagged flagReason flagSeverity")
      .populate("exam", "title")
      .sort({ timestamp: -1 })
      .limit(500)
      .lean();

    let filtered = items;
    if (examId) filtered = filtered.filter((v) => String(v.exam?._id || "") === String(examId));
    if (severity && severity !== "all") filtered = filtered.filter((v) => String(v.severity || "") === severity);
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) filtered = filtered.filter((v) => new Date(v.timestamp).getTime() >= fromDate.getTime());
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) filtered = filtered.filter((v) => new Date(v.timestamp).getTime() <= toDate.getTime());
    }

    res.json({ ok: true, violations: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


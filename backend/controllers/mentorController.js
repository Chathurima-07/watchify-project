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

    res.json(
      exams.map((e) => ({
        _id: e._id,
        title: e.title,
        duration: e.duration,
        questionsCount: Array.isArray(e.questions) ? e.questions.length : 0,
        createdAt: e.createdAt,
      }))
    );
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

    res.status(201).json({ message: "Exam created", examId: exam._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorExamById = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id }).lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMentorExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    await exam.deleteOne();
    res.json({ message: "Exam deleted" });
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
    if (questions !== undefined) exam.questions = questions;

    await exam.save();
    res.json({ message: "Exam updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorResults = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id }).select("_id").lean();
    const examIds = exams.map((e) => e._id);
    if (!examIds.length) return res.json([]);

    const results = await Result.find({ exam: { $in: examIds } })
      .populate("student", "name email")
      .populate("exam", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      results.map((r) => ({
        _id: r._id,
        status: r.status,
        student: r.student,
        exam: r.exam,
        score: r.score,
        total: r.total,
        percentage: toPercent(r.score, r.total),
        submittedAt: r.createdAt,
        violationsCount: r.violations?.length || 0,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorViolations = async (req, res) => {
  try {
    const items = await Violation.find({ mentor: req.user._id })
      .populate("student", "name email")
      .populate("exam", "title")
      .sort({ timestamp: -1 })
      .limit(500)
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


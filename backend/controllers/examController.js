import Exam from "../models/Exam.js";
import Result from "../models/Result.js";

// CREATE EXAM (MENTOR ONLY)
export const createExam = async (req, res) => {
  try {
    const { title, duration, questions } = req.body;

    const exam = await Exam.create({
      title,
      duration,
      questions,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Exam created successfully",
      exam,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().select("-questions.correctAnswer");

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body;

    const exam = await Exam.findById(examId);

    let score = 0;

    exam.questions.forEach((q, index) => {
      if (q.correctAnswer === answers[index]) {
        score++;
      }
    });

    // ✅ SAVE RESULT
    const result = await Result.create({
      student: req.user._id,
      exam: examId,
      score,
      total: exam.questions.length,
    });

    res.json({
      message: "Exam submitted",
      score,
      total: exam.questions.length,
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate("exam", "title");

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
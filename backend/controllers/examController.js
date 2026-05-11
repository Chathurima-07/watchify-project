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
export const startExam = async (req, res) => {
  try {
    const { examId } = req.body;
    let result = await Result.findOne({ student: req.user._id, exam: examId });
    
    if (result) {
      if (result.status === "Completed") {
        return res.status(400).json({ message: "Exam already submitted" });
      }
      return res.json({ message: "Exam resumed", result });
    }

    result = await Result.create({
      student: req.user._id,
      exam: examId,
      status: "Ongoing",
    });

    res.status(201).json({ message: "Exam started", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body;

    // Check if the student already submitted this exam
    const existingResult = await Result.findOne({ student: req.user._id, exam: examId });
    if (existingResult && existingResult.status === "Completed") {
      return res.status(400).json({ message: "Exam already submitted" });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    let score = 0;

    exam.questions.forEach((q, index) => {
      if (q.correctAnswer === answers[index]) {
        score++;
      }
    });

    // ✅ UPDATE RESULT (Created by startExam)
    const result = await Result.findOneAndUpdate(
      { student: req.user._id, exam: examId },
      {
        score,
        total: exam.questions.length,
        status: "Completed",
      },
      { new: true, upsert: true } // upsert just in case startExam wasn't called properly
    );

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

export const logViolation = async (req, res) => {
  try {
    const { examId, type } = req.body;
    const result = await Result.findOneAndUpdate(
      { student: req.user._id, exam: examId, status: "Ongoing" },
      { $push: { violations: { type } } },
      { new: true }
    );
    res.json({ message: "Violation logged", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorResults = async (req, res) => {
  try {
    // Find all exams created by this mentor
    const exams = await Exam.find({ createdBy: req.user._id });
    const examIds = exams.map((e) => e._id);

    // Find all results for these exams
    const results = await Result.find({ exam: { $in: examIds } })
      .populate("student", "name email")
      .populate("exam", "title");

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
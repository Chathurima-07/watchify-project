import Exam from "../models/Exam.js";
import Violation from "../models/Violation.js";

export const createViolation = async (req, res) => {
  try {
    const { examId, type, severity, description } = req.body || {};
    if (!examId || !type) {
      return res.status(400).json({ message: "examId and type are required" });
    }

    const exam = await Exam.findById(examId).select("createdBy").lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const doc = await Violation.create({
      student: req.user._id,
      exam: examId,
      mentor: exam.createdBy,
      type,
      severity: severity || "Medium",
      description: description || "",
      timestamp: new Date(),
    });

    res.status(201).json({ message: "Violation recorded", id: doc._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


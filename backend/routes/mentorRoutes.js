import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createMentorExam,
  deleteMentorExam,
  getMentorExamById,
  getMentorExams,
  getMentorResults,
  getMentorStats,
  getMentorViolations,
  updateMentorExam,
} from "../controllers/mentorController.js";

const router = express.Router();

router.get("/stats", protect, authorizeRoles("mentor"), getMentorStats);
router.get("/exams", protect, authorizeRoles("mentor"), getMentorExams);
router.post("/exams", protect, authorizeRoles("mentor"), createMentorExam);
router.get("/exams/:id", protect, authorizeRoles("mentor"), getMentorExamById);
router.delete("/exams/:id", protect, authorizeRoles("mentor"), deleteMentorExam);
router.put("/exams/:id", protect, authorizeRoles("mentor"), updateMentorExam);
router.get("/results", protect, authorizeRoles("mentor"), getMentorResults);
router.get("/violations", protect, authorizeRoles("mentor"), getMentorViolations);

export default router;


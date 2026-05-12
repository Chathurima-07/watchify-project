import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createStudentViolation,
  getStudentExamById,
  getStudentExams,
  getStudentProfile,
  getStudentResultById,
  getStudentResults,
  getStudentStats,
  getStudentViolations,
  submitStudentExam,
} from "../controllers/studentController.js";

const router = express.Router();

router.get("/profile", protect, authorizeRoles("student"), getStudentProfile);
router.get("/stats", protect, authorizeRoles("student"), getStudentStats);
router.get("/exams", protect, authorizeRoles("student"), getStudentExams);
router.get("/exams/:id", protect, authorizeRoles("student"), getStudentExamById);
router.post("/exams/:id/submit", protect, authorizeRoles("student"), submitStudentExam);
router.get("/results", protect, authorizeRoles("student"), getStudentResults);
router.get("/results/:id", protect, authorizeRoles("student"), getStudentResultById);
router.get("/violations", protect, authorizeRoles("student"), getStudentViolations);
router.post("/violations", protect, authorizeRoles("student"), createStudentViolation);

export default router;


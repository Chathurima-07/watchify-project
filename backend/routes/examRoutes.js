import express from "express";
import { createExam, getAllExams, submitExam, getMyResults, startExam, logViolation, getMentorResults } from "../controllers/examController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Mentor creates exam
router.post("/create", protect, authorizeRoles("mentor"), createExam);
router.get("/", protect, authorizeRoles("student"), getAllExams);
router.post(
  "/start",
  protect,
  authorizeRoles("student"),
  startExam
);
router.post(
  "/submit",
  protect,
  authorizeRoles("student"),
  submitExam
);
router.post(
  "/violation",
  protect,
  authorizeRoles("student"),
  logViolation
);
router.get(
  "/my-results",
  protect,
  authorizeRoles("student"),
  getMyResults
);
router.get(
  "/mentor/results",
  protect,
  authorizeRoles("mentor"),
  getMentorResults
);

export default router;
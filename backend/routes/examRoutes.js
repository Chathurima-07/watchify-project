import express from "express";
import { createExam,getAllExams,submitExam,getMyResults } from "../controllers/examController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Mentor creates exam
router.post("/create", protect, authorizeRoles("mentor"), createExam);
router.get("/", protect, authorizeRoles("student"), getAllExams);
router.post(
  "/submit",
  protect,
  authorizeRoles("student"),
  submitExam
);
router.get(
  "/my-results",
  protect,
  authorizeRoles("student"),
  getMyResults
);

export default router;
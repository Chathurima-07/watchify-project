import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getAdminFeedback,
  getAdminMentorDetails,
  getAdminMentors,
  getAdminReports,
  getAdminStats,
  getAdminStudentDetails,
  getAdminStudents,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", protect, authorizeRoles("admin"), getAdminStats);
router.get("/students", protect, authorizeRoles("admin"), getAdminStudents);
router.get("/mentors", protect, authorizeRoles("admin"), getAdminMentors);
router.get("/student/:id", protect, authorizeRoles("admin"), getAdminStudentDetails);
router.get("/mentor/:id", protect, authorizeRoles("admin"), getAdminMentorDetails);
router.get("/feedback", protect, authorizeRoles("admin"), getAdminFeedback);
router.get("/reports", protect, authorizeRoles("admin"), getAdminReports);

export default router;


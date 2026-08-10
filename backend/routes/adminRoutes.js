import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createAdminReportExport,
  downloadAdminReport,
  getAdminFeedback,
  getAdminMentorDetails,
  getAdminMentors,
  getAdminReports,
  getAdminStats,
  getAdminStudentDetails,
  getAdminStudents,
  getAdminViolations,
  patchAdminMentorStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/violations", protect, authorizeRoles("admin"), getAdminViolations);
router.get("/stats", protect, authorizeRoles("admin"), getAdminStats);
router.get("/students", protect, authorizeRoles("admin"), getAdminStudents);
router.get("/mentors", protect, authorizeRoles("admin"), getAdminMentors);
router.patch("/mentors/:id/status", protect, authorizeRoles("admin"), patchAdminMentorStatus);
router.get("/student/:id", protect, authorizeRoles("admin"), getAdminStudentDetails);
router.get("/mentor/:id", protect, authorizeRoles("admin"), getAdminMentorDetails);
router.get("/feedback", protect, authorizeRoles("admin"), getAdminFeedback);
router.get("/reports/download/:id", protect, authorizeRoles("admin"), downloadAdminReport);
router.post("/reports/export", protect, authorizeRoles("admin"), createAdminReportExport);
router.get("/reports", protect, authorizeRoles("admin"), getAdminReports);

export default router;


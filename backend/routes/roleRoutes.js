import express from "express";
import {
  adminDashboard,
  mentorDashboard,
  studentDashboard,
} from "../controllers/roleController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ADMIN
router.get("/admin", protect, authorizeRoles("admin"), adminDashboard);

// MENTOR
router.get("/mentor", protect, authorizeRoles("mentor"), mentorDashboard);

// STUDENT
router.get("/student", protect, authorizeRoles("student"), studentDashboard);

export default router;
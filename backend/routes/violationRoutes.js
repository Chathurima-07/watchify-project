import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { createViolation } from "../controllers/violationController.js";

const router = express.Router();

// Students post violations during exam sessions.
router.post("/", protect, authorizeRoles("student"), createViolation);

export default router;


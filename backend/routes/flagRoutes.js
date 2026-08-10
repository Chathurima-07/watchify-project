import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { flagStudent, listFlaggedStudents, removeStudentFlag } from "../controllers/flagController.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin", "mentor"), listFlaggedStudents);
router.post("/:studentId", protect, authorizeRoles("admin", "mentor"), flagStudent);
router.put("/:studentId/remove", protect, authorizeRoles("admin"), removeStudentFlag);

export default router;

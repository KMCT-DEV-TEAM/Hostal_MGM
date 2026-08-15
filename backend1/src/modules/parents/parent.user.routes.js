import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { getParentStudents } from "./parent.controller.js";

const router = express.Router();

/**
 * @desc    Get all active students linked to the authenticated parent
 * @route   GET /api/parent/students
 * @access  Private (Parent only)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("parent"),
  getParentStudents
);

export default router;

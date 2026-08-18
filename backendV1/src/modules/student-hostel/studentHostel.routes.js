/**
 * studentHostel.routes.js
 * Registers HTTP routes for the Student Hostel Allocation module.
 */

import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { validateAllocateStudentHostel, validateVacateHostel } from "./studentHostel.validation.js";
import { updateStudentHostel, vacateHostel, getHostelHistory, getStudentHostelTimeline } from "./studentHostel.controller.js";

const router = express.Router();


/**
 * Allocate or Transfer Student to Hostel
 */
router.patch(
  "/:studentId",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateAllocateStudentHostel,
  updateStudentHostel,
);

/**
 * Vacate Student from Hostel
 */
router.patch(
  "/:studentId/vacate",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateVacateHostel,
  vacateHostel,
);

/**
 * Get Hostel Allocation History
 */
router.get(
  "/history",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  getHostelHistory
);

/**
 * Get Student Allocation Timeline
 */
router.get(
  "/student/:studentId",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "student", "parent", "warden", "assistant_warden", "mentor"),
  getStudentHostelTimeline
);

export default router;

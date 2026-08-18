/**
 * studentHostel.routes.js
 *
 * PURPOSE:
 *   Registers all HTTP routes for the Student Hostel Allocation module.
 *   Applies middleware in this exact order for every route:
 *     1. authMiddleware      — verifies JWT, populates req.user
 *     2. roleMiddleware      — checks role whitelist
 *     3. validation          — validates request shape (returns 400 on failure)
 *     4. controller          — executes business logic via service
 *
 * CURRENTLY REGISTERED:
 *   PATCH /:studentId  →  Allocate student to hostel (first-time only)
 *
 * FUTURE (not yet implemented):
 *   PATCH /:studentId/transfer  →  Transfer to new hostel
 *   PATCH /:studentId/vacate    →  Vacate current hostel
 *   GET   /history              →  Paginated allocation history
 *   GET   /student/:studentId   →  Student allocation timeline
 */

import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { validateAllocateStudentHostel } from "./studentHostel.validation.js";
import { updateStudentHostel } from "./studentHostel.controller.js";

const router = express.Router();

/**
 * PATCH /:studentId
 *
 * Allocates a student to a hostel for the first time.
 *
 * Access:  admin, super_admin
 * Request body:
 *   { hostelId: UUID, roomNumber: string, reason?: string, remarks?: string, joinedAt?: ISODate }
 * Response:
 *   201 { success: true, message: "Student allocated successfully", allocation, student, hostel }
 */
router.patch(
  "/:studentId",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateAllocateStudentHostel,
  updateStudentHostel,
);

export default router;

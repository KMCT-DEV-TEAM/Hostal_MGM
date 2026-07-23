import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  updateStudentHostel,
  vacateHostel,
  getHostelHistory,
  getStudentHostelTimeline,
} from "./studentHostel.controller.js";

import {
  validateUpdateStudentHostel,
  validateVacateHostel,
} from "./studentHostel.validation.js";

const router = express.Router();

router.patch(
  "/:studentId",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateUpdateStudentHostel,
  updateStudentHostel
);

router.patch(
  "/:studentId/vacate",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateVacateHostel,
  vacateHostel
);

router.get(
  "/history",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  getHostelHistory
);

router.get(
  "/student/:studentId",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "student", "parent", "warden", "assistant_warden"),
  getStudentHostelTimeline
);

export default router;

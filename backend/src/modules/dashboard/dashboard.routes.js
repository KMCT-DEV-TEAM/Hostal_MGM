import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import verifyStudentAccess from "../../middlewares/verifyStudentAccess.middleware.js";

import {
  getSuperAdminStats,
  getStudentCountByOrganization,
  getAdminStats,
  getStudentDashboardStats,
  getParentDashboardStats,
  getAttendanceOverview,
  getMentorDashboardStats
} from "./dashboard.controller.js";
import { getDashboardStats } from "./dashboard.services.js";

const router = express.Router();
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  getDashboardStats
);

router.get(
  "/student-count-by-organization",
  authMiddleware,
  roleMiddleware("super_admin"),
  getStudentCountByOrganization
);

router.get(
  "/attendance-overview",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAttendanceOverview
);

router.get(
  "/student/stats",
  authMiddleware,
  roleMiddleware("student"),
  getStudentDashboardStats
);

router.get(
  "/students/:studentId/stats",
  authMiddleware,
  roleMiddleware("parent"),
  verifyStudentAccess,
  getParentDashboardStats
);

router.get(
  "/mentor/stats",
  authMiddleware,
  roleMiddleware("mentor"),
  getMentorDashboardStats
);

export default router;

import express from "express";
import {
  createAttendanceWindow,
  getAttendanceWindows,
  getAttendanceWindowDetails,
  getDashboardStats,
  getAttendanceRecords,
  scanStudent,
  completeAttendanceWindow,
  correctAttendance
} from "./attendance.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { validateWindowIdParam, validateScanQR } from "./attendance.validation.js";

const router = express.Router();

router.post(
  "/window",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN),
  createAttendanceWindow
);

router.get(
  "/windows",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  getAttendanceWindows
);

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  getDashboardStats
);

router.get(
  "/windows/:id",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validateWindowIdParam,
  getAttendanceWindowDetails
);

router.get(
  "/windows/:id/records",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validateWindowIdParam,
  getAttendanceRecords
);

router.post(
  "/windows/:id/scan",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN),
  validateWindowIdParam,
  validateScanQR,
  scanStudent
);

router.post(
  "/windows/:id/complete",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN),
  validateWindowIdParam,
  completeAttendanceWindow
);

router.patch(
  "/windows/:id/students/:studentId",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN),
  validateWindowIdParam, // Will validate :id as windowId (regex catches it), wait, does it validate :studentId? The original code didn't specifically validate studentId with a middleware in routes.
  correctAttendance
);

export default router;

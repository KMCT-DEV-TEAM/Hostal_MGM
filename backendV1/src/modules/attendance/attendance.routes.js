import express from "express";
import {
  createAttendanceWindow,
  getAttendanceWindows,
  getAttendanceWindowDetails,
  getDashboardStats,
  getAttendanceRecords,
  scanStudent
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

export default router;

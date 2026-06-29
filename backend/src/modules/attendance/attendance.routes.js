import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  createAttendanceWindow,
  getAttendanceWindows,
  getAttendanceWindowDetails,
  getAttendanceRecords,
  scanStudent,
  completeAttendanceWindow,
  getDashboardStats,
  getAttendanceDashboard,
  getAttendanceHistory,
  getAttendanceCalendar,
  getAttendanceDetails,
} from "./attendance.controller.js";

import {
  validateWindowIdParam,
  validateScanQR,
  validateGetWindows,
  validateHistoryQuery,
  validateCalendarQuery,
  validateDateParam
} from "./attendance.validation.js";

export const wardenAttendanceRouter = express.Router();

wardenAttendanceRouter.use(authMiddleware);
wardenAttendanceRouter.use(roleMiddleware("warden"));

wardenAttendanceRouter.post("/windows", createAttendanceWindow);
wardenAttendanceRouter.get("/stats", getDashboardStats);
wardenAttendanceRouter.get("/windows", validateGetWindows, getAttendanceWindows);
wardenAttendanceRouter.get("/windows/:id", validateWindowIdParam, getAttendanceWindowDetails);
wardenAttendanceRouter.get("/windows/:id/records", validateWindowIdParam, getAttendanceRecords);
wardenAttendanceRouter.post("/windows/:id/scan", validateWindowIdParam, validateScanQR, scanStudent);
wardenAttendanceRouter.patch("/windows/:id/complete", validateWindowIdParam, completeAttendanceWindow);
wardenAttendanceRouter.get("/student-calendar", validateCalendarQuery, getAttendanceCalendar);

export const adminAttendanceRouter = express.Router();
adminAttendanceRouter.use(authMiddleware);
adminAttendanceRouter.use(roleMiddleware("admin", "superadmin"));
adminAttendanceRouter.get("/stats", getDashboardStats);
adminAttendanceRouter.get("/windows", validateGetWindows, getAttendanceWindows);
adminAttendanceRouter.get("/windows/:id", validateWindowIdParam, getAttendanceWindowDetails);
adminAttendanceRouter.get("/windows/:id/records", validateWindowIdParam, getAttendanceRecords);
adminAttendanceRouter.get("/student-calendar", validateCalendarQuery, getAttendanceCalendar);

export const superAdminAttendanceRouter = express.Router();
superAdminAttendanceRouter.use(authMiddleware);
superAdminAttendanceRouter.use(roleMiddleware("superadmin"));
superAdminAttendanceRouter.get("/stats", getDashboardStats);
superAdminAttendanceRouter.get("/windows", validateGetWindows, getAttendanceWindows);
superAdminAttendanceRouter.get("/windows/:id", validateWindowIdParam, getAttendanceWindowDetails);
superAdminAttendanceRouter.get("/windows/:id/records", validateWindowIdParam, getAttendanceRecords);
superAdminAttendanceRouter.get("/student-calendar", validateCalendarQuery, getAttendanceCalendar);

export const studentAttendanceRouter = express.Router();
studentAttendanceRouter.use(authMiddleware);
studentAttendanceRouter.use(roleMiddleware("student"));
studentAttendanceRouter.get("/dashboard", getAttendanceDashboard);
studentAttendanceRouter.get("/", validateHistoryQuery, getAttendanceHistory);
studentAttendanceRouter.get("/calendar", validateCalendarQuery, getAttendanceCalendar);
studentAttendanceRouter.get("/details/:date", validateDateParam, getAttendanceDetails);

export const parentAttendanceRouter = express.Router();
parentAttendanceRouter.use(authMiddleware);
parentAttendanceRouter.use(roleMiddleware("parent"));
parentAttendanceRouter.get("/dashboard", getAttendanceDashboard);
parentAttendanceRouter.get("/", validateHistoryQuery, getAttendanceHistory);
parentAttendanceRouter.get("/calendar", validateCalendarQuery, getAttendanceCalendar);
parentAttendanceRouter.get("/details/:date", validateDateParam, getAttendanceDetails);

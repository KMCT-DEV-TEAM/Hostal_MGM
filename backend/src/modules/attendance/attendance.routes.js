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
} from "./attendance.controller.js";

import {
  validateWindowIdParam,
  validateScanQR,
  validateGetWindows,
} from "./attendance.validation.js";

export const wardenAttendanceRouter = express.Router();

wardenAttendanceRouter.use(authMiddleware);
wardenAttendanceRouter.use(roleMiddleware("warden"));

wardenAttendanceRouter.post("/windows", createAttendanceWindow);
wardenAttendanceRouter.get("/windows", validateGetWindows, getAttendanceWindows);
wardenAttendanceRouter.get("/windows/:id", validateWindowIdParam, getAttendanceWindowDetails);
wardenAttendanceRouter.get("/windows/:id/records", validateWindowIdParam, getAttendanceRecords);
wardenAttendanceRouter.post("/windows/:id/scan", validateWindowIdParam, validateScanQR, scanStudent);
wardenAttendanceRouter.patch("/windows/:id/complete", validateWindowIdParam, completeAttendanceWindow);

export const adminAttendanceRouter = express.Router();
adminAttendanceRouter.use(authMiddleware);
adminAttendanceRouter.use(roleMiddleware("admin", "superadmin"));
adminAttendanceRouter.get("/windows", validateGetWindows, getAttendanceWindows);
adminAttendanceRouter.get("/windows/:id", validateWindowIdParam, getAttendanceWindowDetails);
adminAttendanceRouter.get("/windows/:id/records", validateWindowIdParam, getAttendanceRecords);

export const superAdminAttendanceRouter = express.Router();
superAdminAttendanceRouter.use(authMiddleware);
superAdminAttendanceRouter.use(roleMiddleware("superadmin"));
superAdminAttendanceRouter.get("/windows", validateGetWindows, getAttendanceWindows);
superAdminAttendanceRouter.get("/windows/:id", validateWindowIdParam, getAttendanceWindowDetails);
superAdminAttendanceRouter.get("/windows/:id/records", validateWindowIdParam, getAttendanceRecords);

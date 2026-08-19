import express from "express";
import {
  createAttendanceWindow
} from "./attendance.controller.js";
import { authMiddleware, roleMiddleware } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

router.post(
  "/window",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN, ROLES.ASSISTANT_WARDEN),
  createAttendanceWindow
);

export default router;

import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { getSuperAdminStats, getStudentCountByOrganization } from "./dashboard.controller.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("super_admin"),
  getSuperAdminStats
);

router.get(
  "/student-count-by-organization",
  authMiddleware,
  roleMiddleware("super_admin"),
  getStudentCountByOrganization
);

export default router;

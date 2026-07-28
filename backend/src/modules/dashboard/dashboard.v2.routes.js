import express from "express";
import verifyStudentAccess from "../../middlewares/verifyStudentAccess.middleware.js";
import { getParentDashboardStatsV2 } from "./dashboard.controller.js";

const router = express.Router({ mergeParams: true });

// Protect all routes with explicit student access check
router.use(verifyStudentAccess);

router.get("/stats", getParentDashboardStatsV2);

export default router;

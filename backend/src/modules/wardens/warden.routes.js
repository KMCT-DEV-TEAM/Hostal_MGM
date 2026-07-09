import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { getOrganizationData, getWardenByAdmin, getWardenStats, getWardenDashboardSummary } from "./warden.controller.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("warden"),
  getWardenStats
);

router.get(
  "/dashboard-summary",
  authMiddleware,
  roleMiddleware("warden"),
  getWardenDashboardSummary
);

router.get(
  "/organization-data",
  authMiddleware,
  roleMiddleware("warden", "admin", "super_admin"),
  getOrganizationData
);



// admin Routes


// router.get(
//   "/admin",
//   authMiddleware,
//   roleMiddleware("admin"),
//   getWardenByAdmin
// );

export default router;

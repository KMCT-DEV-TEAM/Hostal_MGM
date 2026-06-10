import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { getOrganizationData, getWardenStats } from "./warden.controller.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("warden"),
  getWardenStats
);

router.get(
  "/organization-data",
  authMiddleware,
  roleMiddleware("warden", "admin", "super_admin"),
  getOrganizationData
);

export default router;

import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { getSuperAdminStats } from "./dashboard.controller.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("super_admin"),
  getSuperAdminStats
);

export default router;

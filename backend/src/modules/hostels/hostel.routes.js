import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  validateCreateHostel,
  validateHostelIdParam,
  validateUpdateHostel,
} from "./hostel.validation.js";

import {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  toggleHostelStatus,
} from "./hostel.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateCreateHostel,
  createHostel
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  getHostels
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateHostelIdParam,
  getHostelById
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateHostelIdParam,
  validateUpdateHostel,
  updateHostel
);

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateHostelIdParam,
  toggleHostelStatus
);

export default router;

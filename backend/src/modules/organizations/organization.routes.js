import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  toggleOrganizationStatus
} from "./organization.controller.js";

import {
  validateCreateOrganization,
  validateOrganizationIdParam,
  validateUpdateOrganization
} from "./organization.validation.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateCreateOrganization,
  createOrganization
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("super_admin"),
  getOrganizations
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateOrganizationIdParam,
  getOrganizationById
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateOrganizationIdParam,
  validateUpdateOrganization,
  updateOrganization
);

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateOrganizationIdParam,
  toggleOrganizationStatus
);

export default router;

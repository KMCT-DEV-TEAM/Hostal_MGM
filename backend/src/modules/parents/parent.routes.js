import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateParentIdParam, validateUpdateParent, validateCreateParent } from "./parent.validation.js";
import { createParent, updateParent, toggleParentStatus, setDefaultGuardian, getParentsByAdmin, getParentsBySuperAdmin, exportParentsByAdmin, exportParentsBySuperAdmin, bulkUpdateParentStatus } from "./parent.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateCreateParent,
  createParent
);

router.patch(
  "/bulk-status",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  bulkUpdateParentStatus
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateParentIdParam,
  validateUpdateParent,
  updateParent
);

router.patch(
  "/:id/change-email",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateParentIdParam,
  changeParentEmail
);

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateParentIdParam,
  toggleParentStatus
);

router.patch(
  "/:id/default-guardian",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateParentIdParam,
  validateUpdateParent,
  setDefaultGuardian
);

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  getParentsByAdmin
);

router.get(
  "/super-admin",
  authMiddleware,
  roleMiddleware("super_admin"),
  getParentsBySuperAdmin
);

router.get(
  "/export/admin",
  authMiddleware,
  roleMiddleware("admin"),
  exportParentsByAdmin
);

router.get(
  "/export/super-admin",
  authMiddleware,
  roleMiddleware("super_admin"),
  exportParentsBySuperAdmin
);

export default router;

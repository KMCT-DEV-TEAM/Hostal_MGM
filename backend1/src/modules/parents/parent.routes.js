import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateParentIdParam, validateUpdateParent, validateCreateParent } from "./parent.validation.js";
import { createParent, resolveParentConflict, updateParent, toggleParentStatus, setDefaultGuardian, getParentsByAdmin, getParentsBySuperAdmin, getParentsByWarden, getParentsByMentor, exportParentsByAdmin, exportParentsBySuperAdmin, bulkUpdateParentStatus, changeParentEmail } from "./parent.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "mentor"),
  validateCreateParent,
  createParent
);

router.post(
  "/resolve-conflict",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "mentor"),
  validateCreateParent,
  resolveParentConflict
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
  roleMiddleware("admin", "super_admin", "mentor"),
  validateParentIdParam,
  validateUpdateParent,
  updateParent
);

router.patch(
  "/:id/change-email",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "mentor"),
  validateParentIdParam,
  changeParentEmail
);

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "mentor"),
  validateParentIdParam,
  toggleParentStatus
);

router.patch(
  "/:id/default-guardian",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "mentor"),
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
  "/mentor",
  authMiddleware,
  roleMiddleware("mentor"),
  getParentsByMentor
);

router.get(
  "/warden",
  authMiddleware,
  roleMiddleware("warden"),
  getParentsByWarden
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

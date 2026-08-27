import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

import {
  validateCreateParent,
  validateUpdateParent,
  validateParentIdParam
} from "./parent.validation.js";
import {
  createParent,
  resolveParentConflict,
  updateParent,
  changeParentEmail,
  setDefaultGuardian,
  getParentsByMentor,
  getParentsByWarden,
  getParentsByAdmin,
  getParentsBySuperAdmin,
  exportParentsByAdmin,
  exportParentsBySuperAdmin,
  getParentStudents
} from "./parent.controller.js";
import { toggleParentStatusDb } from "./parent.service.js";

const router = express.Router();

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  getParentsByAdmin
);

router.get(
  "/students",
  authMiddleware,
  roleMiddleware(ROLES.PARENT),
  getParentStudents
);

router.get(
  "/mentor",
  authMiddleware,
  roleMiddleware(ROLES.MENTOR),
  getParentsByMentor
);

router.get(
  "/warden",
  authMiddleware,
  roleMiddleware(ROLES.WARDEN),
  getParentsByWarden
);

router.get(
  "/super-admin",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN),
  getParentsBySuperAdmin
);

router.get(
  "/export/admin",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  exportParentsByAdmin
);

router.get(
  "/export/super-admin",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN),
  exportParentsBySuperAdmin
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validateCreateParent,
  createParent
);

router.post(
  "/resolve-conflict",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validateCreateParent,
  resolveParentConflict
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validateParentIdParam,
  validateUpdateParent,
  updateParent
);

router.patch(
  "/:id/change-email",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validateParentIdParam,
  changeParentEmail
);

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validateParentIdParam,
  toggleParentStatusDb
);

router.patch(
  "/:id/default-guardian",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validateParentIdParam,
  validateUpdateParent,
  setDefaultGuardian
);

export default router;
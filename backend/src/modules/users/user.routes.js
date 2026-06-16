import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { 
  createAdmin, 
  getAdmins, 
  getAdminById, 
  updateAdmin, 
  updateAdminEmail,
  toggleAdminStatus,
  createWarden,
  getWardens,
  getWardenById,
  updateWarden,
  toggleWardenStatus,
  updateAdminOrganization
} from "./user.controller.js";

import { 
  validateCreateAdmin, 
  validateAdminIdParam, 
  validateUpdateAdmin,
  validateUpdateAdminEmail,
  validateCreateWarden,
  validateWardenIdParam,
  validateUpdateWarden,
  validateUpdateAdminOrganization
} from "./user.validation.js";

const router = express.Router();

// --- ADMIN ROUTES ---

router.post(
  "/admins",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateCreateAdmin,
  createAdmin
);

router.get(
  "/admins",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdmins
);

router.get(
  "/admins/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateAdminIdParam,
  getAdminById
);

router.patch(
  "/admins/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateAdminIdParam,
  validateUpdateAdmin,
  updateAdmin
);

router.patch(
  "/admins/:id/email",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateAdminIdParam,
  validateUpdateAdminEmail,
  updateAdminEmail
);

router.patch(
  "/admins/:id/organization",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateAdminIdParam,
  validateUpdateAdminOrganization,
  updateAdminOrganization
);

router.patch(
  "/admins/:id/toggle-status",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateAdminIdParam,
  toggleAdminStatus
);


// --- WARDEN ROUTES ---

router.post(
  "/wardens",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateCreateWarden,
  createWarden
);

router.get(
  "/wardens",
  authMiddleware,
  roleMiddleware("super_admin"),
  getWardens
);

router.get(
  "/wardens/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateWardenIdParam,
  getWardenById
);

router.patch(
  "/wardens/:id", 
  authMiddleware,
  roleMiddleware("super_admin"),
  validateWardenIdParam,
  validateUpdateWarden,
  updateWarden
);

router.patch(
  "/wardens/:id/toggle-status",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateWardenIdParam,
  toggleWardenStatus
);

export default router;
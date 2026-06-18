import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { 
  createAdmin, 
  getAdmins, 
  getAdminById, 
  updateAdmin, 
  updateUserEmail,
  toggleAdminStatus,
  bulkToggleAdminStatus,
  createWarden,
  getWardens,
  getWardenById,
  updateWarden,
  updateWardenHostel,
  toggleWardenStatus,
  bulkToggleWardenStatus,
  updateAdminOrganization
} from "./user.controller.js";

import { 
  validateCreateAdmin, 
  validateAdminIdParam, 
  validateUpdateAdmin,
  validateUpdateUserEmail,
  validateCreateWarden,
  validateWardenIdParam,
  validateUpdateWarden,
  validateUpdateWardenHostel,
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
  "/:id/email",
  authMiddleware,
  roleMiddleware("super_admin","admin"),
  validateAdminIdParam,
  validateUpdateUserEmail,
  updateUserEmail
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

router.post(
  "/admins/bulk-toggle-status",
  authMiddleware,
  roleMiddleware("super_admin"),
  bulkToggleAdminStatus
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
  validateUpdateWarden,
  updateWarden
);

router.patch(
  "/wardens/:id/hostel",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateWardenIdParam,
  validateUpdateWardenHostel,
  updateWardenHostel
);

router.patch(
  "/wardens/:id/toggle-status",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateWardenIdParam,
  toggleWardenStatus 
);

router.post(
  "/wardens/bulk-toggle-status",
  authMiddleware,
  roleMiddleware("super_admin"),
  bulkToggleWardenStatus
);

export default router;
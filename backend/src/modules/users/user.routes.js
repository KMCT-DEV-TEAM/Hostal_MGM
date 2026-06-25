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
  createMaintenanceStaff,
  getMaintenanceStaff,
  getMaintenanceStaffById,
  updateMaintenanceStaff,
  toggleMaintenanceStaffStatus,
  bulkToggleMaintenanceStaffStatus,
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
  validateUpdateAdminOrganization,
  validateCreateMaintenanceStaff,
  validateMaintenanceStaffIdParam,
  validateUpdateMaintenanceStaff
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
  roleMiddleware("super_admin", "admin"),
  getWardens
);

router.get(
  "/wardens/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
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

// --- MAINTENANCE STAFF ROUTES ---

router.post(
  "/maintenance-staff",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateCreateMaintenanceStaff,
  createMaintenanceStaff
);

router.get(
  "/maintenance-staff",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  getMaintenanceStaff
);

router.get(
  "/maintenance-staff/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateMaintenanceStaffIdParam,
  getMaintenanceStaffById
);

router.patch(
  "/maintenance-staff/:id", 
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateMaintenanceStaffIdParam,
  validateUpdateMaintenanceStaff,
  updateMaintenanceStaff
);

router.patch(
  "/maintenance-staff/:id/toggle-status",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateMaintenanceStaffIdParam,
  toggleMaintenanceStaffStatus 
);

router.post(
  "/maintenance-staff/bulk-toggle-status",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  bulkToggleMaintenanceStaffStatus
);

export default router;
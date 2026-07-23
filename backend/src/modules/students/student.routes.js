import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateCreateStudent, validateStudentIdParam, validateUpdateStudent, validateUpdateStudentOrganization, validateBulkStudentStatus } from "./student.validation.js";
import { createStudent, updateStudent, changeStudentEmail, toggleStudentStatus, bulkUpdateStudentStatus, updateStudentOrganization, getAdminOrganizationData, getAdminStats, getStudentsByAdmin, getStudentsBySuperAdmin, getStudentsByWarden, getStudentFilterOptions, getStudentFurnitures, getStudentById, getStudentsByMentor } from "./student.controller.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminStats
);

router.get(
  "/organization-data",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminOrganizationData
);

router.get(
  "/filters",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "warden", "mentor", "assistant_warden"),
  getStudentFilterOptions
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateCreateStudent,
  createStudent
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateStudentIdParam,
  validateUpdateStudent,
  updateStudent
);

router.patch(
  "/:id/change-email",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateStudentIdParam,
  changeStudentEmail
);

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateStudentIdParam,
  toggleStudentStatus
);

router.patch(
  "/bulk-status",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateBulkStudentStatus,
  bulkUpdateStudentStatus
);

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  getStudentsByAdmin
);

router.get(
  "/warden",
  authMiddleware,
  roleMiddleware("warden", "assistant_warden"),
  getStudentsByWarden
);

router.get(
  "/super-admin",
  authMiddleware,
  roleMiddleware("super_admin"),
  getStudentsBySuperAdmin
);

router.get(
  "/mentor",
  authMiddleware,
  roleMiddleware("mentor"),
  getStudentsByMentor
)

router.get(
  "/:id/furnitures",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "warden", "assistant_warden"),
  getStudentFurnitures
);

// super admin change orgonisation
router.put(
  "/:id/organization",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateStudentIdParam,
  validateUpdateStudentOrganization,
  updateStudentOrganization
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "mentor", "assistant_warden"),
  validateStudentIdParam,
  getStudentById
);

export default router;

import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateCreateStudent, validateStudentIdParam, validateUpdateStudent, validateUpdateStudentOrganization, validateBulkStudentStatus } from "./student.validation.js";
import { createStudent, updateStudent, toggleStudentStatus, bulkUpdateStudentStatus, updateStudentHostelStatus, updateStudentHostel, updateStudentOrganization, getAdminOrganizationData, getAdminStats, getStudentsByAdmin, getStudentsBySuperAdmin, getStudentFilterOptions } from "./student.controller.js";

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
  roleMiddleware("admin", "super_admin", "warden"),
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

router.patch(
  "/:id/toggle-hostel-status",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateStudentIdParam,
  updateStudentHostelStatus
);

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  getStudentsByAdmin
)


router.get(
  "/super-admin",
  authMiddleware,
  roleMiddleware("super_admin"),
  getStudentsBySuperAdmin
)

router.patch(
  "/:id/update-hostel",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateStudentIdParam,
  updateStudentHostel
)


// super admin change orgonisation
router.patch(
  "/:id/update-organization",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateStudentIdParam,
  validateUpdateStudentOrganization,
  updateStudentOrganization
)

export default router;

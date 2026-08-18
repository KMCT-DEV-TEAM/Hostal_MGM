import express from "express";
import { validateCreateStudent, validateStudentIdParam, validateUpdateStudent } from "./student.validation.js";
import { createStudent, updateStudent, changeStudentEmail, getAdminOrganizationData, getAdminStats, getStudentsByAdmin, getStudentsByWarden, getStudentsBySuperAdmin, getStudentsByMentor, getStudentFilterOptions } from "./student.controller.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/organization-data",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminOrganizationData
);

router.get(
  "/admin-stats",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminStats
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
  roleMiddleware("super_admin", "admin"),
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

export default router;

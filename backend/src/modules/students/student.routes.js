import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateCreateStudent, validateStudentIdParam, validateUpdateStudent } from "./student.validation.js";
import { createStudent, updateStudent, toggleStudentStatus, updateStudentHostelStatus, updateStudentHostel, getAdminOrganizationData, getAdminStats, getStudentsByAdmin, getStudentsBySuperAdmin } from "./student.controller.js";

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
export default router;

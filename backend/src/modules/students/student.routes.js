import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateCreateStudent, validateStudentIdParam, validateUpdateStudent } from "./student.validation.js";
import { createStudent, updateStudent, toggleStudentStatus, getAdminOrganizationData, getAdminStats } from "./student.controller.js";

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

router.patch(
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

export default router;

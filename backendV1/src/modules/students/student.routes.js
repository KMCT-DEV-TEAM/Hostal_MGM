import express from "express";
import { validateCreateStudent, validateStudentIdParam, validateUpdateStudent } from "./student.validation.js";
import { createStudent, updateStudent, changeStudentEmail, getAdminOrganizationData } from "./student.controller.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/organization-data",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminOrganizationData
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

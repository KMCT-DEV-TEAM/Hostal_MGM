import express from "express";
import { validateCreateStudent, validateStudentIdParam, validateUpdateStudent } from "./student.validation.js";
import { createStudent, updateStudent } from "./student.controller.js";

// Dummy auth and role middlewares just so it runs without crashing, assuming they'll be replaced or use existing.
// Since we don't have them in the new folder, we will create stubs or you can replace them.
const authMiddleware = (req, res, next) => {
  // mock req.user for testing
  req.user = req.user || { id: "f2ee9298-15b7-468e-a542-c00c61c8e89d", role: "super_admin" };
  next();
};

const roleMiddleware = (...roles) => (req, res, next) => next();

const router = express.Router();

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

export default router;

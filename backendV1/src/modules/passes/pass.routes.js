import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { createPass, getMyPassesUnified, getPasses, getPassDetails, updatePass, cancelPass } from "./pass.controller.js";
import { validateCreatePass, validateGetPassesUnified, validateGetPasses, validatePassIdParam, validateUpdatePass, validateCancelPass } from "./pass.validation.js";
import verifyStudentAccess from "../../middlewares/verifyStudentAccess.middleware.js";

const router = express.Router();



router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  validateCreatePass,
  createPass
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("student", "parent"),
  verifyStudentAccess,
  validateGetPassesUnified,
  getMyPassesUnified
);

router.get(
  "/parent-list",
  authMiddleware,
  roleMiddleware("parent"),
  verifyStudentAccess,
  validateGetPasses,
  getPasses
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "student",
    "parent",
    "warden",
    "assistant_warden",
    "mentor",
    "admin",
    "super_admin"
  ),
  validatePassIdParam,
  getPassDetails
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("student", "parent"),
  validatePassIdParam,
  validateUpdatePass,
  updatePass
);

router.put(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("student", "parent", "admin", "super_admin", "mentor"),
  validatePassIdParam,
  validateCancelPass,
  cancelPass
);

export default router;

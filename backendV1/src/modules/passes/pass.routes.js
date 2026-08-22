import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { createPass, getMyPassesUnified, getPasses } from "./pass.controller.js";
import { validateCreatePass, validateGetPassesUnified, validateGetPasses } from "./pass.validation.js";
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

export default router;

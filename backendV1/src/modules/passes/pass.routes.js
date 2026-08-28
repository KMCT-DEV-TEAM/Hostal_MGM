import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { createPass, getMyPassesUnified, getPasses, getPassDetails, updatePass, cancelPass, approvePass } from "./pass.controller.js";
import { validateCreatePass, validateGetPassesUnified, validateGetPasses, validatePassIdParam, validateUpdatePass, validateCancelPass } from "./pass.validation.js";
import verifyStudentAccess from "../../middlewares/verifyStudentAccess.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.STUDENT),
  validateCreatePass,
  createPass
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.STUDENT, ROLES.PARENT),
  verifyStudentAccess,
  validateGetPassesUnified,
  getMyPassesUnified
);

router.get(
  "/parent-list",
  authMiddleware,
  roleMiddleware(ROLES.PARENT),
  verifyStudentAccess,
  validateGetPasses,
  getPasses
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(
    ROLES.STUDENT,
    ROLES.PARENT,
    ROLES.WARDEN,
    ROLES.ASSISTANT_WARDEN,
    ROLES.MENTOR,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN
  ),
  validatePassIdParam,
  getPassDetails
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.STUDENT, ROLES.PARENT),
  validatePassIdParam,
  validateUpdatePass,
  updatePass
);

router.put(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware(ROLES.STUDENT, ROLES.PARENT, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR),
  validatePassIdParam,
  validateCancelPass,
  cancelPass
);

router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(ROLES.PARENT, ROLES.MENTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validatePassIdParam,
  approvePass
);

export default router;

import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateParentIdParam, validateUpdateParent, validateCreateParent } from "./parent.validation.js";
import { createParent, updateParent, toggleParentStatus, setDefaultGuardian } from "./parent.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateCreateParent,
  createParent
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateParentIdParam,
  validateUpdateParent,
  updateParent
);

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateParentIdParam,
  toggleParentStatus
);

router.patch(
  "/:id/default-guardian",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  validateParentIdParam,
  validateUpdateParent,
  setDefaultGuardian
);

export default router;

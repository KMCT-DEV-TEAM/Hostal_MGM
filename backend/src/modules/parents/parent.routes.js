import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateParentIdParam, validateUpdateParent } from "./parent.validation.js";
import { updateParent, toggleParentStatus } from "./parent.controller.js";

const router = express.Router();

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

export default router;

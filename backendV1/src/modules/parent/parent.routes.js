import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import { validateCreateParent } from "./parent.validation.js";
import { createParent, resolveParentConflict } from "./parent.controller.js";

const router = express.Router();

// Only POST / is fully migrated in the controller/service right now, 
// but we mount the route mapping identically to the old MongoDB version.

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "mentor"),
  validateCreateParent,
  createParent
);


router.post(
  "/resolve-conflict",
  authMiddleware,
  roleMiddleware("admin", "super_admin", "mentor"),
  validateCreateParent,
  resolveParentConflict
);


export default router;
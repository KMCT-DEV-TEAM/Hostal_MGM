import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  createPass,
  getMyPasses,
  updatePass,
  cancelPass,
} from "./pass.controller.js";

import {
  validateCreatePass,
  validatePassIdParam,
  validateUpdatePass,
  validateCancelPass,
} from "./pass.validation.js";

const router = express.Router();

// -----Student routes----
router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  validateCreatePass,
  createPass
);

router.get(
  "/my-passes",
  authMiddleware,
  roleMiddleware("student"),
  getMyPasses
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("student"),
  validatePassIdParam,
  validateUpdatePass,
  updatePass
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("student"),
  validatePassIdParam,
  validateCancelPass,
  cancelPass
);

export default router;

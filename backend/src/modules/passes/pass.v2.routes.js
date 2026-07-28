import express from "express";
import verifyStudentAccess from "../../middlewares/verifyStudentAccess.middleware.js";
import {
  getParentPassesUnifiedV2,
  getPassesV2,
  getPassDetailsV2,
  approvePassV2,
  rejectPassV2,
  updatePassV2,
  cancelPassV2
} from "./pass.controller.js";

import {
  validateGetPassesUnified,
  validateGetPasses,
  validatePassIdParam,
  validateRejectPass,
  validateUpdatePass,
  validateCancelPass
} from "./pass.validation.js";

const router = express.Router({ mergeParams: true });

// Protect all pass routes with explicit student access check
router.use(verifyStudentAccess);

// Unified listing: GET /passes?mode=requests|history
router.get("/passes", validateGetPassesUnified, getParentPassesUnifiedV2);

// Standard Listing & Details
router.get("/", validateGetPasses, getPassesV2);
router.get("/:id", validatePassIdParam, getPassDetailsV2);

// Actions
router.patch("/:id/approve", validatePassIdParam, approvePassV2);
router.patch("/:id/reject", validatePassIdParam, validateRejectPass, rejectPassV2);
router.put("/:id", validatePassIdParam, validateUpdatePass, updatePassV2);
router.patch("/:id/cancel", validatePassIdParam, validateCancelPass, cancelPassV2);

export default router;

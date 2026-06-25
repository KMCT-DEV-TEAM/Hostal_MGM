import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";


import {
  createPass,
  getMyPasses,
  updatePass,
  cancelPass,
  getPasses,
  approvePass,
  rejectPass,
  getPassDetails,
  getWardenDashboardStats,
  getWardenPasses,
  getWardenPassDetails,
  approveWardenPass,
  rejectWardenPass,
  markStudentLeftHostel,
  markStudentReturned,
  studentAmendPass,
  parentAmendPass,
  parentApproveAmendment,
  parentRejectAmendment,
  wardenApproveAmendment,
  wardenRejectAmendment,
  wardenAdminCancelPass
} from "./pass.controller.js";

import {
  validateCreatePass,
  validatePassIdParam,
  validateUpdatePass,
  validateCancelPass,
  validateGetPasses,
  validateRejectPass,
  validateAmendPass
} from "./pass.validation.js";

export const studentPassRouter = express.Router();

// -----Student routes----
studentPassRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  validateCreatePass,
  createPass
);

studentPassRouter.get(
  "/my-passes",
  authMiddleware,
  roleMiddleware("student"),
  getMyPasses
);

studentPassRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("student"),
  validatePassIdParam,
  validateUpdatePass,
  updatePass
);

studentPassRouter.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("student"),
  validatePassIdParam,
  validateCancelPass,
  cancelPass
);

studentPassRouter.post(
  "/:id/amend",
  authMiddleware,
  roleMiddleware("student"),
  validatePassIdParam,
  validateAmendPass,
  studentAmendPass
);

// -----Parent routes----

export const parentPassRouter = express.Router();


// Pass Listing & Details
parentPassRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("parent"),
  validateGetPasses,
  getPasses
);

parentPassRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("parent"),
  validatePassIdParam,
  getPassDetails
);

// Actions
parentPassRouter.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("parent"),
  validatePassIdParam,
  approvePass
);

parentPassRouter.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("parent"),
  validatePassIdParam,
  validateRejectPass,
  rejectPass
);

parentPassRouter.post(
  "/:id/amend",
  authMiddleware,
  roleMiddleware("parent"),
  validatePassIdParam,
  validateAmendPass,
  parentAmendPass
);

parentPassRouter.patch(
  "/:id/amendment/approve",
  authMiddleware,
  roleMiddleware("parent"),
  validatePassIdParam,
  parentApproveAmendment
);

parentPassRouter.patch(
  "/:id/amendment/reject",
  authMiddleware,
  roleMiddleware("parent"),
  validatePassIdParam,
  validateRejectPass,
  parentRejectAmendment
);

// ----- Warden routes ----
export const wardenPassRouter = express.Router();

// Dashboard
wardenPassRouter.get(
  "/dashboard-stats",
  authMiddleware,
  roleMiddleware("warden"),
  getWardenDashboardStats
);

// Pass Listing & Details
wardenPassRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("warden"),
  validateGetPasses,
  getWardenPasses
);

wardenPassRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  getWardenPassDetails
);

// Actions
wardenPassRouter.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  approveWardenPass
);

wardenPassRouter.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  validateRejectPass,
  rejectWardenPass
);

wardenPassRouter.patch(
  "/:id/mark-left",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  markStudentLeftHostel
);

wardenPassRouter.patch(
  "/:id/mark-returned",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  markStudentReturned
);

wardenPassRouter.patch(
  "/:id/amendment/approve",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  wardenApproveAmendment
);

wardenPassRouter.patch(
  "/:id/amendment/reject",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  validateRejectPass,
  wardenRejectAmendment
);

wardenPassRouter.patch(
  "/:id/admin-cancel",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  validateRejectPass,
  wardenAdminCancelPass
);


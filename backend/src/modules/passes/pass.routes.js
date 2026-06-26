import express from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";


import {
  createPass,
  getMyPasses,
  getStudentPassDetails,
  updatePass,
  cancelPass,
  getPasses,
  approvePass,
  rejectPass,
  getPassDetails,
  getWardenDashboardStats,
  getWardenPasses,
  getWardenPassDetails,
  adminApprovePass,
  adminRejectPass,
  markStudentLeftHostel,
  markStudentReturned,
  wardenAdminCancelPass,
  getAdminDashboardStats,
  getAdminHostels,
  getAdminPasses,
  getAdminPassDetails,
  adminCancelPass,
  getSuperAdminDashboardStats,
  getSuperAdminOrganizationsHostels,
  getSuperAdminPasses,
  getSuperAdminPassDetails,
  superAdminCancelPass
} from "./pass.controller.js";

import {
  validateCreatePass,
  validatePassIdParam,
  validateUpdatePass,
  validateCancelPass,
  validateGetPasses,
  validateRejectPass
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

studentPassRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("student"),
  validatePassIdParam,
  getStudentPassDetails
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

parentPassRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("parent"),
  validatePassIdParam,
  validateUpdatePass,
  updatePass
);

parentPassRouter.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("parent"),
  validatePassIdParam,
  validateCancelPass,
  cancelPass
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
  "/:id/admin-cancel",
  authMiddleware,
  roleMiddleware("warden"),
  validatePassIdParam,
  validateRejectPass,
  wardenAdminCancelPass
);

// ----- Admin routes -----
export const adminPassRouter = express.Router();

adminPassRouter.use(authMiddleware);
adminPassRouter.use(roleMiddleware("admin", "super_admin"));

adminPassRouter.get("/dashboard", getAdminDashboardStats);
adminPassRouter.get("/hostels", getAdminHostels);
adminPassRouter.get("/hostels/:hostelId", getAdminPasses);
adminPassRouter.get("/:id", getAdminPassDetails);
adminPassRouter.patch("/:id/approve", validatePassIdParam, adminApprovePass);
adminPassRouter.patch("/:id/reject", validatePassIdParam, validateRejectPass, adminRejectPass);
adminPassRouter.put("/:id/cancel", adminCancelPass);

// ----- Super Admin routes -----
export const superAdminPassRouter = express.Router();

superAdminPassRouter.use(authMiddleware);
superAdminPassRouter.use(roleMiddleware("super_admin"));

superAdminPassRouter.get("/dashboard", getSuperAdminDashboardStats);
superAdminPassRouter.get("/hostels", getSuperAdminOrganizationsHostels);
superAdminPassRouter.get("/hostels/:hostelId", getSuperAdminPasses);
superAdminPassRouter.get("/:id", getSuperAdminPassDetails);
superAdminPassRouter.put("/:id/cancel", superAdminCancelPass);

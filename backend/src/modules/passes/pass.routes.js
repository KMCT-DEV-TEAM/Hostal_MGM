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
  getManagementAllPasses,
  getManagementHostelPasses,
  getAdminPassDetails,
  adminCancelPass,
  getMentorHostels,
  getMentorAllPasses,
  getMentorPassDetails,
  mentorApprovePass,
  mentorRejectPass,
  mentorCancelPass,
  getSuperAdminDashboardStats,
  getSuperAdminOrganizationsHostels,
  getSuperAdminPassDetails,
  superAdminCancelPass,
  getMyPassesUnified,
  getParentPassesUnified
} from "./pass.controller.js";

import {
  validateCreatePass,
  validatePassIdParam,
  validateUpdatePass,
  validateCancelPass,
  validateGetPasses,
  validateRejectPass,
  validateGetPassesUnified
} from "./pass.validation.js";
import { getMentorDashboardStats } from "../dashboard/dashboard.controller.js";
import verifyStudentAccess from "../../middlewares/verifyStudentAccess.middleware.js";

export const studentPassRouter = express.Router();

// -----Student routes----
studentPassRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  validateCreatePass,
  createPass
);

// Unified listing: GET /passes?mode=requests|history
studentPassRouter.get(
  "/passes",
  authMiddleware,
  roleMiddleware("student"),
  validateGetPassesUnified,
  getMyPassesUnified
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

// export const parentPassRouter = express.Router();


// // Unified listing: GET /passes?mode=requests|history
// parentPassRouter.get(
//   "/passes",
//   authMiddleware,
//   roleMiddleware("parent"),
//   validateGetPassesUnified,
//   getParentPassesUnified
// );

// // Pass Listing & Details
// parentPassRouter.get(
//   "/",
//   authMiddleware,
//   roleMiddleware("parent"),
//   validateGetPasses,
//   getPasses
// );

// parentPassRouter.get(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("parent"),
//   validatePassIdParam,
//   getPassDetails
// );

// // Actions
// parentPassRouter.patch(
//   "/:id/approve",
//   authMiddleware,
//   roleMiddleware("parent"),
//   validatePassIdParam,
//   approvePass
// );

// parentPassRouter.patch(
//   "/:id/reject",
//   authMiddleware,
//   roleMiddleware("parent"),
//   validatePassIdParam,
//   validateRejectPass,
//   rejectPass
// );

// parentPassRouter.put(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("parent"),
//   validatePassIdParam,
//   validateUpdatePass,
//   updatePass
// );

// parentPassRouter.patch(
//   "/:id/cancel",
//   authMiddleware,
//   roleMiddleware("parent"),
//   validatePassIdParam,
//   validateCancelPass,
//   cancelPass
// );


export const parentPassRouter = express.Router({ mergeParams: true });

parentPassRouter.use(authMiddleware);
parentPassRouter.use(roleMiddleware("parent"));
parentPassRouter.use(verifyStudentAccess);

// Unified listing
parentPassRouter.get(
  "/passes",
  validateGetPassesUnified,
  getParentPassesUnified
);

// Pass listing
parentPassRouter.get(
  "/",
  validateGetPasses,
  getPasses
);

// Pass details
parentPassRouter.get(
  "/:id",
  validatePassIdParam,
  getPassDetails
);

// Approve
parentPassRouter.patch(
  "/:id/approve",
  validatePassIdParam,
  approvePass
);

// Reject
parentPassRouter.patch(
  "/:id/reject",
  validatePassIdParam,
  validateRejectPass,
  rejectPass
);

// Update
parentPassRouter.put(
  "/:id",
  validatePassIdParam,
  validateUpdatePass,
  updatePass
);

// Cancel
parentPassRouter.patch(
  "/:id/cancel",
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
  roleMiddleware("warden", "assistant_warden"),
  getWardenDashboardStats
);

// Pass Listing & Details
wardenPassRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("warden", "assistant_warden"),
  validateGetPasses,
  getWardenPasses
);

wardenPassRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("warden", "assistant_warden"),
  validatePassIdParam,
  getWardenPassDetails
);

// Actions

wardenPassRouter.patch(
  "/:id/mark-left",
  authMiddleware,
  roleMiddleware("warden", "assistant_warden"),
  validatePassIdParam,
  markStudentLeftHostel
);

wardenPassRouter.patch(
  "/:id/mark-returned",
  authMiddleware,
  roleMiddleware("warden", "assistant_warden"),
  validatePassIdParam,
  markStudentReturned
);

wardenPassRouter.patch(
  "/:id/admin-cancel",
  authMiddleware,
  roleMiddleware("warden", "assistant_warden"),
  validatePassIdParam,
  validateRejectPass,
  wardenAdminCancelPass
);

// ----- Admin routes -----
export const adminPassRouter = express.Router();

adminPassRouter.use(authMiddleware);
adminPassRouter.use(roleMiddleware("admin", "super_admin"));

adminPassRouter.get("/", getManagementAllPasses);
adminPassRouter.get("/dashboard", getAdminDashboardStats);
adminPassRouter.get("/hostels", getAdminHostels);
adminPassRouter.get("/hostels/:hostelId/passes", getManagementHostelPasses);
adminPassRouter.get("/:id", getAdminPassDetails);
adminPassRouter.patch("/:id/approve", validatePassIdParam, adminApprovePass);
adminPassRouter.patch("/:id/reject", validatePassIdParam, validateRejectPass, adminRejectPass);
adminPassRouter.put("/:id/cancel", adminCancelPass);

// ----- Super Admin routes -----
export const superAdminPassRouter = express.Router();

superAdminPassRouter.use(authMiddleware);
superAdminPassRouter.use(roleMiddleware("super_admin"));

superAdminPassRouter.get("/", getManagementAllPasses);
superAdminPassRouter.get("/dashboard", getSuperAdminDashboardStats);
superAdminPassRouter.get("/hostels", getSuperAdminOrganizationsHostels);
superAdminPassRouter.get("/hostels/:hostelId/passes", getManagementHostelPasses);
superAdminPassRouter.get("/:id", getSuperAdminPassDetails);
superAdminPassRouter.put("/:id/cancel", superAdminCancelPass);

// ----- Mentor routes -----
export const mentorPassRouter = express.Router();


mentorPassRouter.use(authMiddleware);
mentorPassRouter.use(roleMiddleware("mentor"));

mentorPassRouter.get("/", getMentorAllPasses);
mentorPassRouter.get("/dashboard", getMentorDashboardStats);
mentorPassRouter.get("/hostels", getMentorHostels);
mentorPassRouter.get("/hostels/:hostelId/passes", getManagementHostelPasses);
mentorPassRouter.get("/:id", getMentorPassDetails);
mentorPassRouter.patch("/:id/approve", validatePassIdParam, mentorApprovePass);
mentorPassRouter.patch("/:id/reject", validatePassIdParam, validateRejectPass, mentorRejectPass);
mentorPassRouter.put("/:id/cancel", mentorCancelPass);

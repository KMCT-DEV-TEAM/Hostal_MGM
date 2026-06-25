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
  getPassDetails
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



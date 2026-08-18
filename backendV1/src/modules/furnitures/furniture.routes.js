import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  createFurnitureType,
  adjustAssetCount,
  allocateFurniture,
  returnFurniture,
  getDashboardSummary,
  getAssetsDashboardSummary,
  getFurnitureTypes,
  getFurnitureTypeDetails
} from "./furniture.controller.js";

import {
  validateCreateFurnitureType,
  validateAdjustAssetCount,
  validateAllocate,
  validateReturn
} from "./furniture.validation.js";

const router = express.Router();

router.get(
  "/dashboard/summary",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  getDashboardSummary
);

router.get(
  "/assets/dashboard/summary",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  getAssetsDashboardSummary
);

router.get(
  "/types",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  getFurnitureTypes
);

router.get(
  "/types/:typeId",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  getFurnitureTypeDetails
);

router.post(
  "/types",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateCreateFurnitureType,
  createFurnitureType
);

router.patch(
  "/types/:typeId/assets-count",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateAdjustAssetCount,
  adjustAssetCount
);

router.post(
  "/assets/allocate",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  validateAllocate,
  allocateFurniture
);

router.post(
  "/students/:studentId/assets/:assetId/return",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  validateReturn,
  returnFurniture
);

export default router;

import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  createFurnitureType,
  getFurnitureTypes,
  adjustAssetCount,
  allocateFurniture,
  returnFurniture,
  startMaintenance,
  completeMaintenance,
  getDashboardSummary
} from "./furniture.controller.js";

import {
  validateCreateFurnitureType,
  validateAdjustAssetCount,
  validateAllocate,
  validateReturn,
  validateStartMaintenance,
  validateCompleteMaintenance
} from "./furniture.validation.js";

const router = express.Router();

router.get(
  "/types",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  getFurnitureTypes
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
  "/students/:studentId/assets/:assetId/allocate",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  validateAllocate,
  allocateFurniture
);

router.post(
  "/students/:studentId/assets/:assetId/return",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  validateReturn,
  returnFurniture
);

router.post(
  "/assets/:assetId/maintenance/start",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  validateStartMaintenance,
  startMaintenance
);

router.post(
  "/assets/:assetId/maintenance/complete",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  validateCompleteMaintenance,
  completeMaintenance
);

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden"),
  getDashboardSummary
);

export default router;

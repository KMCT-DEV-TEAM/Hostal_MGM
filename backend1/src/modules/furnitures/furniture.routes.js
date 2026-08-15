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
  getDashboardSummary,
  getFurnitureTypeDetails,
  updateFurnitureType,
  deleteFurnitureType,
  changeAssetStatus,
  getFurnitureAssetsByType,
  getAllHostelFurnitureAssets,
  getFurnitureAssetDetails,
  getActiveFurnitureTypesList,
  getAvailableFurnitureAssetsList,
  getAssetsDashboardSummary
} from "./furniture.controller.js";

import {
  validateCreateFurnitureType,
  validateAdjustAssetCount,
  validateAllocate,
  validateReturn,
  validateStartMaintenance,
  validateCompleteMaintenance,
  validateUpdateFurnitureType,
  validateManualStatusChange
} from "./furniture.validation.js";

const router = express.Router();

router.get(
  "/types",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  getFurnitureTypes
);

router.get(
  "/types/active",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  getActiveFurnitureTypesList
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

router.get(
  "/types/:typeId",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  getFurnitureTypeDetails
);

router.put(
  "/types/:typeId",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateUpdateFurnitureType,
  updateFurnitureType
);

router.delete(
  "/types/:typeId",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  deleteFurnitureType
);

router.get(
  "/types/:typeId/assets/active",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  getAvailableFurnitureAssetsList
);

router.get(
  "/types/:typeId/assets",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  getFurnitureAssetsByType
);

router.patch(
  "/assets/:assetId/status",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  validateManualStatusChange,
  changeAssetStatus
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

router.post(
  "/assets/:assetId/maintenance/start",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  validateStartMaintenance,
  startMaintenance
);

router.post(
  "/assets/:assetId/maintenance/complete",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  validateCompleteMaintenance,
  completeMaintenance
);

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  getDashboardSummary
);
router.get(
  "/assets-dashboard",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  getAssetsDashboardSummary
);
router.get(
  "/assets",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  getAllHostelFurnitureAssets
);
router.get(
  "/assets/:assetId",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "warden", "assistant_warden"),
  getFurnitureAssetDetails
);

export default router;

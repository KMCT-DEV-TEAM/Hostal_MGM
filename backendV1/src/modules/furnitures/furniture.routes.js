import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

import {
  createFurnitureType,
  adjustAssetCount,
  allocateFurniture,
  returnFurniture,
  getDashboardSummary,
  getAssetsDashboardSummary,
  getFurnitureTypes,
  getFurnitureTypeDetails,
  updateFurnitureType,
  deleteFurnitureType,
  changeAssetStatus,
  getFurnitureAssetsByType,
  getAllHostelFurnitureAssets,
  getFurnitureAssetDetails,
  getActiveFurnitureTypesList,
  getAvailableFurnitureAssetsList
} from "./furniture.controller.js";

import {
  validateCreateFurnitureType,
  validateAdjustAssetCount,
  validateAllocate,
  validateReturn,
  validateUpdateFurnitureType,
  validateManualStatusChange
} from "./furniture.validation.js";

const router = express.Router();

router.get(
  "/dashboard/summary",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getDashboardSummary
);

router.get(
  "/assets/dashboard/summary",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getAssetsDashboardSummary
);

router.get(
  "/types/active",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getActiveFurnitureTypesList
);

router.get(
  "/types",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getFurnitureTypes
);

router.get(
  "/types/:typeId",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getFurnitureTypeDetails
);

router.get(
  "/types/:typeId/assets",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getFurnitureAssetsByType
);

router.get(
  "/types/:typeId/available-assets",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getAvailableFurnitureAssetsList
);

router.post(
  "/types",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateCreateFurnitureType,
  createFurnitureType
);

router.put(
  "/types/:typeId",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateUpdateFurnitureType,
  updateFurnitureType
);

router.delete(
  "/types/:typeId",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  deleteFurnitureType
);

router.patch(
  "/types/:typeId/assets-count",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateAdjustAssetCount,
  adjustAssetCount
);

router.post(
  "/assets/allocate",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  validateAllocate,
  allocateFurniture
);

router.post(
  "/students/:studentId/assets/:assetId/return",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  validateReturn,
  returnFurniture
);

router.get(
  "/assets/all-hostel",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getAllHostelFurnitureAssets
);

router.get(
  "/assets/:assetId",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN),
  getFurnitureAssetDetails
);

router.patch(
  "/assets/:assetId/status",
  authMiddleware,
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateManualStatusChange,
  changeAssetStatus
);

export default router;

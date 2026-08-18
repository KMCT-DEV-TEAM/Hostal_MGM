import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  createFurnitureType,
  adjustAssetCount,
  allocateFurniture
} from "./furniture.controller.js";

import {
  validateCreateFurnitureType,
  validateAdjustAssetCount,
  validateAllocate
} from "./furniture.validation.js";

const router = express.Router();

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

export default router;

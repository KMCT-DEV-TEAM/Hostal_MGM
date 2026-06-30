import express from "express";
import {
  createFurnitureType,
  getFurnitureTypes,
  getFurnitureTypeDetails,
  updateFurnitureType,
  deleteFurnitureType,
  adjustAssetsCount,
  changeAssetStatus,
  getFurnitureAssetsByType,
} from "./furniture.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// --- Furniture Types ---
router.get("/", getFurnitureTypes);
router.get("/:typeId", getFurnitureTypeDetails);
router.post("/", roleMiddleware("admin", "super_admin"), createFurnitureType);
router.put("/:typeId", roleMiddleware("admin", "super_admin"), updateFurnitureType);
router.delete("/:typeId", roleMiddleware("admin", "super_admin"), deleteFurnitureType);

// --- Furniture Assets ---
router.patch("/:typeId/assets-count", roleMiddleware("admin", "super_admin"), adjustAssetsCount);
router.patch("/assets/:assetId/status", roleMiddleware("admin", "super_admin"), changeAssetStatus);
router.get("/:typeId/assets", roleMiddleware("admin", "super_admin", "wardn"), getFurnitureAssetsByType);




export default router;

import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

import {
  createFurnitureType
} from "./furniture.controller.js";

import {
  validateCreateFurnitureType
} from "./furniture.validation.js";

const router = express.Router();

router.post(
  "/types",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateCreateFurnitureType,
  createFurnitureType
);

export default router;

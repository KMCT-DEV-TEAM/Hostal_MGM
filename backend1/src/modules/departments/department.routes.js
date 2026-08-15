import express from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  toggleDepartmentStatus,
  bulkUpdateDepartmentStatus,
} from "./Department.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createDepartment);
router.get("/", getDepartments);
router.put("/bulk-status", bulkUpdateDepartmentStatus);
router.get("/:id", getDepartmentById);
router.put("/:id", updateDepartment);
router.patch("/:id/status", toggleDepartmentStatus);

export default router;


import express from "express";
import {
  createComplaintCategory,
  getComplaintCategories,
  getComplaintCategoryById,
  updateComplaintCategory,
  toggleComplaintCategoryStatus,
  bulkUpdateComplaintCategoryStatus,
} from "./complaintCategory.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createComplaintCategory);
router.get("/", getComplaintCategories);
router.put("/bulk-status", bulkUpdateComplaintCategoryStatus);
router.get("/:id", getComplaintCategoryById);
router.put("/:id", updateComplaintCategory);
router.patch("/:id/status", toggleComplaintCategoryStatus);

export default router;

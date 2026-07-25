import express from "express";
import {
  createBatch,
  getBatches,
  getMentorAssignments,
  getMentorAssignmentById,
  getBatchById,
  updateBatch,
  toggleBatchStatus,
  bulkUpdateBatchStatus,
} from "./batch.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

// Apply auth middleware to all batch routes
router.use(authMiddleware);

router.post("/", createBatch);
router.get("/", getBatches);
router.get("/mentor/assignments", getMentorAssignments);
router.put("/bulk-status", bulkUpdateBatchStatus);
router.get("/:id", getBatchById);
router.put("/:id", updateBatch);
router.patch("/:id/status", toggleBatchStatus);
router.get("/mentor/assignments/:id", roleMiddleware("mentor"), getMentorAssignmentById);

export default router;

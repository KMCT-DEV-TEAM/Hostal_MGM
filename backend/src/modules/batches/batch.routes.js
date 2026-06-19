import express from "express";
import {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  toggleBatchStatus,
  bulkUpdateBatchStatus,
} from "./batch.controller.js";

const router = express.Router();

router.post("/", createBatch);
router.get("/", getBatches);
router.put("/bulk-status", bulkUpdateBatchStatus);
router.get("/:id", getBatchById);
router.put("/:id", updateBatch);
router.patch("/:id/status", toggleBatchStatus);

export default router;

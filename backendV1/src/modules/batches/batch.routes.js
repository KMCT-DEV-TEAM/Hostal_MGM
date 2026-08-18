import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import { validateCreateBatch, validateUpdateBatch } from './batch.validation.js';
import {
  createBatch,
  getBatchs,
  getBatchById,
  updateBatch,
  deleteBatch,
  toggleBatchStatus,
  bulkToggleBatchStatus
} from './batch.controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(validateCreateBatch, createBatch)
  .get(getBatchs);

router.route('/bulk-status')
  .put(bulkToggleBatchStatus);

router.route('/:id/status')
  .patch(toggleBatchStatus);

router.route('/:id')
  .get(getBatchById)
  .put(validateUpdateBatch, updateBatch)
  .delete(deleteBatch);

export default router;

import express from 'express';
import {
  createBatch,
  getBatchs,
  getBatchById,
  updateBatch,
  deleteBatch,
} from './batch.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createBatch)
  .get(protect, getBatchs);

router.route('/:id')
  .get(protect, getBatchById)
  .put(protect, updateBatch)
  .delete(protect, deleteBatch);

export default router;

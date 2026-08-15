import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createBatch,
  getBatchs,
  getBatchById,
  updateBatch,
  deleteBatch
} from './batch.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createBatch)
  .get(getBatchs);

router.route('/:id')
  .get(getBatchById)
  .put(updateBatch)
  .delete(deleteBatch);

export default router;

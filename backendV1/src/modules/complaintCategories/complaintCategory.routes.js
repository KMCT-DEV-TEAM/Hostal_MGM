import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createComplaintCategory,
  getComplaintCategories,
  getComplaintCategoryById,
  updateComplaintCategory,
  toggleComplaintCategoryStatus,
  bulkUpdateComplaintCategoryStatus
} from './complaintCategory.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createComplaintCategory)
  .get(getComplaintCategories);

router.put('/bulk-status', bulkUpdateComplaintCategoryStatus);

router.route('/:id')
  .get(getComplaintCategoryById)
  .put(updateComplaintCategory);

router.patch('/:id/status', toggleComplaintCategoryStatus);

export default router;

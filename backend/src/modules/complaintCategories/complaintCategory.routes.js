import express from 'express';
import {
  createComplaintCategory,
  getComplaintCategorys,
  getComplaintCategoryById,
  updateComplaintCategory,
  deleteComplaintCategory,
} from './complaintCategory.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createComplaintCategory)
  .get(protect, getComplaintCategorys);

router.route('/:id')
  .get(protect, getComplaintCategoryById)
  .put(protect, updateComplaintCategory)
  .delete(protect, deleteComplaintCategory);

export default router;

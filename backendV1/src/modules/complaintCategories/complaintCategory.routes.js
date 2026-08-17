import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createComplaintCategory,
  getComplaintCategorys,
  getComplaintCategoryById,
  updateComplaintCategory,
  deleteComplaintCategory
} from './complaintCategory.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createComplaintCategory)
  .get(getComplaintCategorys);

router.route('/:id')
  .get(getComplaintCategoryById)
  .put(updateComplaintCategory)
  .delete(deleteComplaintCategory);

export default router;

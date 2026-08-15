import express from 'express';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from './department.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createDepartment)
  .get(protect, getDepartments);

router.route('/:id')
  .get(protect, getDepartmentById)
  .put(protect, updateDepartment)
  .delete(protect, deleteDepartment);

export default router;

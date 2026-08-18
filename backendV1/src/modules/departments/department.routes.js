import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import { validateCreateDepartment, validateUpdateDepartment } from './department.validation.js';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
  bulkToggleDepartmentStatus
} from './department.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(validateCreateDepartment, createDepartment)
  .get(getDepartments);

router.route('/bulk-status')
  .put(bulkToggleDepartmentStatus);

router.route('/:id/status')
  .patch(toggleDepartmentStatus);

router.route('/:id')
  .get(getDepartmentById)
  .put(validateUpdateDepartment, updateDepartment)
  .delete(deleteDepartment);

export default router;

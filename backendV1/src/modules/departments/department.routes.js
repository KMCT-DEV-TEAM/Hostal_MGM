import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} from './department.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createDepartment)
  .get(getDepartments);

router.route('/:id')
  .get(getDepartmentById)
  .put(updateDepartment)
  .delete(deleteDepartment);

export default router;

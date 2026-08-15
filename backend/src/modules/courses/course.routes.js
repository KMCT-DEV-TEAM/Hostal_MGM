import express from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from './course.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createCourse)
  .get(protect, getCourses);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, updateCourse)
  .delete(protect, deleteCourse);

export default router;

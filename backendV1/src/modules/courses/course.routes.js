import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import { validateCreateCourse, validateUpdateCourse } from './course.validation.js';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  bulkToggleCourseStatus
} from './course.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(validateCreateCourse, createCourse)
  .get(getCourses);

router.route('/bulk-status')
  .put(bulkToggleCourseStatus);

router.route('/:id/status')
  .patch(toggleCourseStatus);

router.route('/:id')
  .get(getCourseById)
  .put(validateUpdateCourse, updateCourse)
  .delete(deleteCourse);

export default router;

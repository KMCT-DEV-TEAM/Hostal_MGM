import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} from './announcement.controller.js';
import {
  validateCreateAnnouncement,
  validateAnnouncementIdParam,
  validateUpdateAnnouncement
} from './announcement.validation.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(validateCreateAnnouncement, createAnnouncement)
  .get(getAnnouncements);

router.route('/:id')
  .get(validateAnnouncementIdParam, getAnnouncementById)
  .put(validateAnnouncementIdParam, validateUpdateAnnouncement, updateAnnouncement)
  .delete(validateAnnouncementIdParam, deleteAnnouncement);

export default router;

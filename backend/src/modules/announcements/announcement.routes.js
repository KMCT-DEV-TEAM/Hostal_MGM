import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from './announcement.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createAnnouncement)
  .get(protect, getAnnouncements);

router.route('/:id')
  .get(protect, getAnnouncementById)
  .put(protect, updateAnnouncement)
  .delete(protect, deleteAnnouncement);

export default router;

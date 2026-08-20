import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  deleteHostel,
  toggleHostelStatus,
  bulkToggleHostelStatus
} from './hostel.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createHostel)
  .get(getHostels);

// Needs to be before /:id to prevent "bulk-status" being treated as an id
router.route('/bulk-status')
  .patch(bulkToggleHostelStatus);

// Needs to be before /:id to prevent "selection" being treated as an id
router.route('/selection')
  .get(getHostels);

router.route('/:id')
  .get(getHostelById)
  .patch(updateHostel)
  .delete(deleteHostel);

router.route('/:id/toggle-status')
  .patch(toggleHostelStatus);

export default router;

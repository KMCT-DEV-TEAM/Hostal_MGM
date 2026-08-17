import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  deleteHostel
} from './hostel.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createHostel)
  .get(getHostels);

router.route('/:id')
  .get(getHostelById)
  .put(updateHostel)
  .delete(deleteHostel);

export default router;

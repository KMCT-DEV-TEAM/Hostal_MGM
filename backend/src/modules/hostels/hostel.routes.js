import express from 'express';
import {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  deleteHostel,
} from './hostel.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createHostel)
  .get(protect, getHostels);

router.route('/:id')
  .get(protect, getHostelById)
  .put(protect, updateHostel)
  .delete(protect, deleteHostel);

export default router;

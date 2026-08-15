import express from 'express';
import {
  createOtp,
  getOtps,
  getOtpById,
  updateOtp,
  deleteOtp,
} from './otp.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createOtp)
  .get(protect, getOtps);

router.route('/:id')
  .get(protect, getOtpById)
  .put(protect, updateOtp)
  .delete(protect, deleteOtp);

export default router;

import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  createOtp,
  getOtps,
  getOtpById,
  updateOtp,
  deleteOtp
} from './otp.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

router.route('/')
  .post(createOtp)
  .get(getOtps);

router.route('/:id')
  .get(getOtpById)
  .put(updateOtp)
  .delete(deleteOtp);

export default router;

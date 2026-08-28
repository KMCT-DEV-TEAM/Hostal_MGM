import express from 'express';
import {
  login,
  logout,
  refreshToken,
  me,
  verifyPassword,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  updateProfile,
  requestEmailChange,
  verifyEmailChange
} from './auth.controller.js';
import {
  verifyEmailForReset,
  submitPasswordRequest
} from '../passwordRequests/passwordRequest.controller.js';
import { protect } from './auth.middleware.js';

const router = express.Router();

// Public auth routes
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

router.post('/verify-email', verifyEmailForReset);
router.post('/password-request', submitPasswordRequest);

// Protected auth routes
router.get('/me', protect, me);
router.post('/verify-password', protect, verifyPassword);
router.post('/change-password', protect, changePassword);
router.patch('/profile', protect, updateProfile);
router.put('/profile', protect, updateProfile);
router.post('/request-email-change', protect, requestEmailChange);
router.post('/verify-email-change', protect, verifyEmailChange);

export default router;

import express from 'express';
import { login, logout, me, verifyPassword } from './auth.controller.js';
import { protect } from './auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/verify-password', protect, verifyPassword);

export default router;

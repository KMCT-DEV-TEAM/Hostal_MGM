import express from 'express';
import { login, getMe, refresh, logout } from './auth.controller.js';
import { protect } from './auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;


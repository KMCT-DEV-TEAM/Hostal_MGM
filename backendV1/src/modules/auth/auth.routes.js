import express from 'express';
import { login, logout, me } from './auth.controller.js';
import { protect } from './auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;

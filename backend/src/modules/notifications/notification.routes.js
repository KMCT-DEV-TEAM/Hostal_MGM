import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import { getNotifications } from './notification.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);

export default router;

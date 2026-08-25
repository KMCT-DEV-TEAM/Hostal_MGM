import express from 'express';
import profileController from './profile.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

router.get('/', protect, profileController.getProfile);

export default router;

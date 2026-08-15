import express from 'express';
import profileController from './profile.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, profileController.getProfile);

export default router;

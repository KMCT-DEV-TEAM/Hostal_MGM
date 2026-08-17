import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  getAdmins,
  getWardens,
  getAssistantWardens
} from './user.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

// --- ADMIN ROUTES ---
router.route('/admins')
  .get(getAdmins);

// --- WARDEN ROUTES ---
router.route('/wardens')
  .get(getWardens);

// --- ASSISTANT WARDEN ROUTES ---
router.route('/assistant-wardens')
  .get(getAssistantWardens);

export default router;

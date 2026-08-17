import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  getAdmins,
  getWardens,
  getAssistantWardens,
  createWarden,
  updateWarden,
  updateEmail,
  updateWardenHostel,
  toggleWardenStatus,
  bulkToggleWardenStatus
} from './user.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

// --- ADMIN ROUTES ---
router.route('/admins')
  .get(getAdmins);

// --- WARDEN ROUTES ---
router.route('/wardens')
  .post(createWarden)
  .get(getWardens);

router.post('/wardens/bulk-toggle-status', bulkToggleWardenStatus);

router.route('/wardens/:id')
  .patch(updateWarden);

router.route('/:id/email')
  .patch(updateEmail);

router.route('/wardens/:id/hostel')
  .patch(updateWardenHostel);

router.route('/wardens/:id/toggle-status')
  .patch(toggleWardenStatus);

// --- ASSISTANT WARDEN ROUTES ---
router.route('/assistant-wardens')
  .get(getAssistantWardens);

export default router;

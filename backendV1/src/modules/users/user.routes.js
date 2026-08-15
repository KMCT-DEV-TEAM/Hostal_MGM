import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  updateAdminOrganization,
  toggleAdminStatus,
  bulkToggleAdminStatus,
  updateUserEmail,
  getWardens,
  getAssistantWardens
} from './user.controller.js';

const router = express.Router();

router.use(protect); // Apply protect middleware to all routes

// --- ADMIN ROUTES ---
router.route('/admins/bulk-toggle-status')
  .post(bulkToggleAdminStatus)
  .patch(bulkToggleAdminStatus);

router.route('/admins/:id/toggle-status')
  .patch(toggleAdminStatus);

router.route('/admins/:id/organization')
  .patch(updateAdminOrganization);

router.route('/admins/:id')
  .patch(updateAdmin);

router.route('/:id/email')
  .patch(updateUserEmail);

router.route('/admins/:id/email')
  .patch(updateUserEmail);

router.route('/admins')
  .get(getAdmins)
  .post(createAdmin);

// --- WARDEN ROUTES ---
router.route('/wardens')
  .get(getWardens);

// --- ASSISTANT WARDEN ROUTES ---
router.route('/assistant-wardens')
  .get(getAssistantWardens);

export default router;


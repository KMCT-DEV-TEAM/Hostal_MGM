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
  getAssistantWardens,
  getAssistantWardenById,
  createAssistantWarden,
  updateAssistantWarden,
  updateAssistantWardenHostel,
  toggleAssistantWardenStatus,
  bulkToggleAssistantWardenStatus,
  createWarden,
  updateWarden,
  updateEmail,
  updateWardenHostel,
  toggleWardenStatus,
  bulkToggleWardenStatus,
  getMaintenanceStaff,
  createMaintenanceStaff,
  updateMaintenanceStaff,
  toggleMaintenanceStaffStatus,
  bulkToggleMaintenanceStaffStatus
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
  .get(getAssistantWardens)
  .post(createAssistantWarden);

router.post('/assistant-wardens/bulk-toggle-status', bulkToggleAssistantWardenStatus);

router.route('/assistant-wardens/:id')
  .get(getAssistantWardenById)
  .patch(updateAssistantWarden);

router.route('/assistant-wardens/:id/hostel')
  .patch(updateAssistantWardenHostel);

router.route('/assistant-wardens/:id/toggle-status')
  .patch(toggleAssistantWardenStatus);

// --- MAINTENANCE STAFF ROUTES ---
router.route('/maintenance-staff')
  .get(getMaintenanceStaff)
  .post(createMaintenanceStaff);

router.post('/maintenance-staff/bulk-toggle-status', bulkToggleMaintenanceStaffStatus);

router.route('/maintenance-staff/:id')
  .patch(updateMaintenanceStaff);

router.route('/maintenance-staff/:id/toggle-status')
  .patch(toggleMaintenanceStaffStatus);

export default router;


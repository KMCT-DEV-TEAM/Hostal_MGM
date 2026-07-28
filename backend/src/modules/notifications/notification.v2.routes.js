import express from 'express';
import * as notificationController from './notification.controller.js';
import verifyStudentAccess from '../../middlewares/verifyStudentAccess.middleware.js';

const router = express.Router({ mergeParams: true });

// Protect all visitor routes with explicit student access check
router.use(verifyStudentAccess);

router.get('/', notificationController.getMyNotificationsV2);
router.patch('/:id/read', notificationController.markAsRead); // Reusing V1 controller since it just updates a specific ID for the authenticated user

export default router;

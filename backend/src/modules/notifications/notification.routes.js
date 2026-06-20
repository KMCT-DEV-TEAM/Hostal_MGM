import express from 'express';
import * as notificationController from './notification.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

router
    .route('/')
    .get(notificationController.getMyNotifications)
    .post(
        roleMiddleware('super_admin', 'org_admin'),
        notificationController.createNotification
    );

router.patch('/read-all', notificationController.markAllAsRead);

router
    .route('/:id')
    .delete(notificationController.deleteNotification);

router.patch('/:id/read', notificationController.markAsRead);

export default router;

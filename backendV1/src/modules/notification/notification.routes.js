import express from 'express';
import * as notificationController from './notification.controller.js';
import { protect } from '../auth/auth.middleware.js';
// import * as validation from './notification.validation.js';

const router = express.Router();

router.use(protect);

router.get(
    '/',
    // validation.validateGetNotifications,
    notificationController.getMyNotifications
);

router.post(
    '/broadcast',
    // roleMiddleware('super_admin', 'admin'),
    // validation.validateBroadcast,
    notificationController.testBroadcast
);

router.patch(
    '/read-all',
    notificationController.markAllAsRead
);

router.patch(
    '/:id/read',
    // validation.validateNotificationId,
    notificationController.markAsRead
);

router.delete(
    '/:id',
    // validation.validateNotificationId,
    notificationController.deleteNotification
);

export default router;

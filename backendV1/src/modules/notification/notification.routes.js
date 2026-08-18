import express from 'express';
import * as notificationController from './notification.controller.js';
import { protect } from '../auth/auth.middleware.js';
import roleMiddleware from '../../../../backend/src/middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);

router.get(
    '/',
    notificationController.getMyNotifications
);

router.post(
    '/broadcast',
    roleMiddleware('super_admin', 'admin'),
    notificationController.testBroadcast
);

router.patch(
    '/read-all',
    notificationController.markAllAsRead
);

router.patch(
    '/:id/read',
    notificationController.markAsRead
);

router.delete(
    '/:id',
    notificationController.deleteNotification
);

export default router;

import { notificationRepository } from './notification.repository.js';
import { orchestratorService } from './services/orchestrator.service.js';

class NotificationService {
    async getUserNotifications(userId, role, query = {}) {
        const { page = 1, limit = 20, isRead } = query;
        const skip = (page - 1) * limit;

        const roleMap = {
            'student': 'Student',
            'parent': 'Parent'
        };
        const model = roleMap[role?.toLowerCase()] || 'User';

        return await notificationRepository.findUserNotifications(userId, model, { skip, limit: parseInt(limit), isRead });
    }

    async markAsRead(notificationId, userId) {
        return await notificationRepository.markAsRead(notificationId, userId);
    }

    async markAllAsRead(userId, role) {
        const roleMap = {
            'student': 'Student',
            'parent': 'Parent'
        };
        const model = roleMap[role?.toLowerCase()] || 'User';
        return await notificationRepository.markAllAsRead(userId, model);
    }

    async deleteNotification(notificationId, userId) {
        return await notificationRepository.deleteNotification(notificationId, userId);
    }

    async triggerBroadcast(payload) {
        return await orchestratorService.triggerNotification(payload);
    }
}

export const notificationService = new NotificationService();

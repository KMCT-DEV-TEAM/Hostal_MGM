import { prisma } from '../../config/prisma.js';
import { logger } from '../../../utils/logger.js';

class NotificationRepository {
    
    // 9. Centralized Error Handling wrapper
    async _executeWithCatch(operation, context) {
        try {
            return await operation();
        } catch (error) {
            logger.error({ context, err: error.message }, 'NotificationRepository Error');
            // Standardize Prisma specific known errors (e.g., P2025 Record not found)
            if (error.code === 'P2025') {
                throw new Error('Record not found');
            }
            throw error;
        }
    }

    // 5. Bulk Create (Kept createMany for max throughput)
    async createBulkNotifications(notifications) {
        return this._executeWithCatch(async () => {
            if (!notifications || notifications.length === 0) return { count: 0 };
            return await prisma.notification.createMany({
                data: notifications,
                skipDuplicates: true
            });
        }, 'createBulkNotifications');
    }

    // 3. Projection & 4. Pagination Protection & 2. Exclude Deleted
    async findUserNotifications(recipientId, recipientModel, { skip = 0, limit = 20, isRead }) {
        return this._executeWithCatch(async () => {
            // Protect against pagination abuse
            const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
            const safeSkip = Math.max(parseInt(skip) || 0, 0);

            const where = {
                recipientId,
                recipientModel,
                deletedAt: null
            };

            if (isRead !== undefined) {
                where.isRead = isRead;
            }

            const [notifications, total, unreadCount] = await Promise.all([
                prisma.notification.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: safeSkip,
                    take: safeLimit,
                    // Projection: Only fetch what the frontend needs
                    select: {
                        id: true,
                        title: true,
                        message: true,
                        link: true,
                        isRead: true,
                        type: true,
                        eventPriority: true,
                        eventTypeLabel: true,
                        createdAt: true
                        // Excluded heavy JSON metadata/delivery states unless explicitly requested
                    }
                }),
                prisma.notification.count({ where: { recipientId, recipientModel, deletedAt: null } }),
                this.countUnread(recipientId, recipientModel)
            ]);

            return { notifications, total, unreadCount, limit: safeLimit };
        }, 'findUserNotifications');
    }

    // 8. Missing Method: findById
    async findById(notificationId, recipientId) {
        return this._executeWithCatch(async () => {
            return await prisma.notification.findFirst({
                where: { id: notificationId, recipientId, deletedAt: null }
            });
        }, 'findById');
    }

    // 8. Missing Method: countUnread
    async countUnread(recipientId, recipientModel) {
        return this._executeWithCatch(async () => {
            return await prisma.notification.count({
                where: { recipientId, recipientModel, isRead: false, deletedAt: null }
            });
        }, 'countUnread');
    }

    // 1. markAsRead (Fixed Race Condition with updateMany atomic operation)
    async markAsRead(notificationId, recipientId) {
        return this._executeWithCatch(async () => {
            // updateMany safely executes an atomic conditional update, preventing read-write race conditions.
            const result = await prisma.notification.updateMany({
                where: { 
                    id: notificationId, 
                    recipientId, 
                    isRead: false, 
                    deletedAt: null 
                },
                data: {
                    isRead: true,
                    deliveryInAppStatus: 'READ',
                    deliveryInAppReadAt: new Date()
                }
            });
            return result.count > 0;
        }, 'markAsRead');
    }

    async markAllAsRead(recipientId, recipientModel) {
        return this._executeWithCatch(async () => {
            const result = await prisma.notification.updateMany({
                where: { recipientId, recipientModel, isRead: false, deletedAt: null },
                data: { 
                    isRead: true,
                    deliveryInAppStatus: 'READ',
                    deliveryInAppReadAt: new Date()
                }
            });
            return result.count;
        }, 'markAllAsRead');
    }

    // 2. Soft Delete 
    async deleteNotification(notificationId, recipientId) {
        return this._executeWithCatch(async () => {
            const result = await prisma.notification.updateMany({
                where: { id: notificationId, recipientId, deletedAt: null },
                data: { deletedAt: new Date() }
            });
            return result.count > 0;
        }, 'deleteNotification');
    }

    // 8. Missing Method: archiveNotification (Alternative to soft delete)
    async archiveNotification(notificationId, recipientId) {
        return this._executeWithCatch(async () => {
            // Often archive is identical to soft delete, or updates an 'isArchived' flag
            return await this.deleteNotification(notificationId, recipientId);
        }, 'archiveNotification');
    }

    // 7. Bulk Update Delivery Status (Transaction Support)
    async bulkUpdateDeliveryStatus(operations) {
        return this._executeWithCatch(async () => {
            if (!operations || operations.length === 0) return;

            const queries = operations.map(op => {
                return prisma.notification.update({
                    where: { id: op.docId },
                    data: op.updateData
                });
            });

            // Executes all updates within a single ACID transaction
            return await prisma.$transaction(queries);
        }, 'bulkUpdateDeliveryStatus');
    }
}

export const notificationRepository = new NotificationRepository();

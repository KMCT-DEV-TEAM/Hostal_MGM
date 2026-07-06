import Notification from './notification.model.js';
import mongoose from 'mongoose';

class NotificationRepository {
    /**
     * Creates a new notification record.
     * @param {Object} data 
     * @returns {Object}
     */
    async createNotification(data) {
        if (!data.recipient || !data.recipient.id || !data.recipient.model) {
            throw new Error('recipient (id and model) is required to save a notification');
        }
        return await Notification.create(data);
    }

    /**
     * Find a notification by its ID
     */
    async findById(id) {
        return await Notification.findById(id);
    }

    /**
     * Retrieves notifications for a specific user with pagination and filters
     */
    async findUserNotifications(userId, userModel, { skip = 0, limit = 20, isRead } = {}) {
        const query = { 
            'recipient.id': new mongoose.Types.ObjectId(userId),
            'recipient.model': userModel
        };

        if (isRead !== undefined) {
            query['deliveries.inApp.status'] = isRead ? 'READ' : { $ne: 'READ' };
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Notification.countDocuments(query),
            Notification.countDocuments({ ...query, 'deliveries.inApp.status': { $ne: 'READ' } })
        ]);

        return { notifications, total, unreadCount };
    }

    /**
     * Marks a specific notification as read
     */
    async markAsRead(notificationId, userId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, 'recipient.id': new mongoose.Types.ObjectId(userId) },
            { 
                $set: { 
                    'deliveries.inApp.status': 'READ', 
                    'deliveries.inApp.readAt': new Date() 
                } 
            },
            { new: true, runValidators: true }
        );
    }

    /**
     * Marks all notifications as read for a user
     */
    async markAllAsRead(userId, userModel) {
        return await Notification.updateMany(
            { 'recipient.id': new mongoose.Types.ObjectId(userId), 'recipient.model': userModel, 'deliveries.inApp.status': { $ne: 'READ' } },
            { 
                $set: { 
                    'deliveries.inApp.status': 'READ', 
                    'deliveries.inApp.readAt': new Date() 
                } 
            }
        );
    }

    /**
     * Deletes (or archives) a notification
     */
    async archiveNotification(notificationId, userId) {
        return await Notification.findOneAndDelete({
            _id: notificationId,
            'recipient.id': new mongoose.Types.ObjectId(userId)
        });
    }

    /**
     * Updates delivery status for a specific channel
     * @param {String} notificationId 
     * @param {String} channel - 'inApp', 'email', 'push'
     * @param {Object} result - { status, provider, providerMessageId, error }
     */
    async updateDeliveryStatus(notificationId, channel, result) {
        const update = { $set: {} };
        const prefix = `deliveries.${channel}`;

        if (result.status) update.$set[`${prefix}.status`] = result.status;
        if (result.provider) update.$set[`${prefix}.provider`] = result.provider;
        if (result.providerMessageId) update.$set[`${prefix}.providerMessageId`] = result.providerMessageId;
        if (result.error !== undefined) update.$set[`${prefix}.error`] = result.error;
        
        // Auto-set timestamps based on status
        if (result.status === 'QUEUED') update.$set[`${prefix}.queuedAt`] = new Date();
        if (result.status === 'SENT') update.$set[`${prefix}.sentAt`] = new Date();
        if (result.status === 'DELIVERED') update.$set[`${prefix}.deliveredAt`] = new Date();

        return await Notification.findByIdAndUpdate(notificationId, update, { new: true });
    }

    /**
     * Increments the delivery attempts for a channel
     */
    async updateDeliveryAttempts(notificationId, channel, attempts) {
        return await Notification.findByIdAndUpdate(
            notificationId,
            { 
                $set: { 
                    [`deliveries.${channel}.attempts`]: attempts,
                    [`deliveries.${channel}.lastAttemptAt`]: new Date()
                } 
            },
            { new: true }
        );
    }

    /**
     * Updates provider message ID for a channel
     */
    async updateProviderMessageId(notificationId, channel, messageId) {
        return await Notification.findByIdAndUpdate(
            notificationId,
            { $set: { [`deliveries.${channel}.providerMessageId`]: messageId } },
            { new: true }
        );
    }

    /**
     * Updates error message for a channel
     */
    async updateProviderError(notificationId, channel, error) {
        return await Notification.findByIdAndUpdate(
            notificationId,
            { $set: { [`deliveries.${channel}.error`]: error } },
            { new: true }
        );
    }

    /**
     * Updates a specific timestamp field for a channel
     * @param {String} field - 'queuedAt', 'sentAt', 'deliveredAt', 'readAt'
     */
    async updateDeliveryTimestamp(notificationId, channel, field) {
        return await Notification.findByIdAndUpdate(
            notificationId,
            { $set: { [`deliveries.${channel}.${field}`]: new Date() } },
            { new: true }
        );
    }

    /**
     * Bulk inserts notifications
     */
    async bulkCreate(dataArray, session = null) {
        if (!dataArray || dataArray.length === 0) return [];
        return await Notification.insertMany(dataArray, { session });
    }

    /**
     * Executes bulk update operations using bulkWrite
     */
    async bulkUpdate(operations, session = null) {
        if (!operations || operations.length === 0) return;
        return await Notification.bulkWrite(operations, { session });
    }
}

export const notificationRepository = new NotificationRepository();

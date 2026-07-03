import Notification from './notification.model.js';

class NotificationRepository {
    /**
     * Creates a new notification record in the database.
     * This serves as the system of record.
     * 
     * @param {Object} data - The notification data payload
     * @returns {Object} The created notification document
     */
    async create(data) {
        if (!data.recipient) {
            throw new Error('recipient (userId) is required to save a notification');
        }

        return await Notification.create(data);
    }

    /**
     * Bulk inserts notifications for optimal performance.
     * @param {Array} dataArray - Array of notification payloads
     * @param {Object} session - Mongoose transaction session
     */
    async insertMany(dataArray, session = null) {
        if (!dataArray || dataArray.length === 0) return [];
        return await Notification.insertMany(dataArray, { session });
    }


    // Future repository methods (find, update, markAsRead) can go here
}

export const notificationRepository = new NotificationRepository();

import { notificationRepository } from './notification.repository.js';

/**
 * Notification Compatibility Layer
 * 
 * A temporary adapter for modules that have not yet migrated to the new Notification Platform.
 * Converts legacy payloads into the new Notification schema and delegates to the repository.
 * 
 * NOTE: This file contains no business logic or template rendering and should be deleted
 * once all modules migrate to orchestratorService.triggerNotification().
 */
class NotificationCompatibilityLayer {
    
    /**
     * Formats a legacy notification payload into the new Notification schema.
     * @param {Object} payload - The legacy notification data.
     * @returns {Object} The formatted data matching the new schema.
     * @private
     */
    #formatNotification(payload) {
        return {
            recipient: {
                id: payload.recipient,
                model: payload.model || "User"
            },
            event: {
                event: payload.event || "SYSTEM",
                category: payload.category || "SYSTEM",
                priority: payload.priority || "NORMAL",
                type: payload.type || "info"
            },
            title: payload.title,
            message: payload.message,
            link: payload.link || null,
            metadata: payload.metadata || {}
        };
    }

    /**
     * Creates a single notification record using the compatibility schema.
     * @param {Object} payload 
     * @returns {Promise<Object>}
     */
    async create(payload) {
        if (!payload) return null;
        const formattedData = this.#formatNotification(payload);
        return await notificationRepository.createNotification(formattedData);
    }

    /**
     * Creates multiple notification records in bulk using the compatibility schema.
     * @param {Array<Object>} payloads 
     * @returns {Promise<Array>}
     */
    async insertMany(payloads) {
        if (!Array.isArray(payloads) || payloads.length === 0) {
            return [];
        }
        const formattedDataArray = payloads.map(payload => this.#formatNotification(payload));
        return await notificationRepository.bulkCreate(formattedDataArray);
    }
}

export const NotificationCompat = new NotificationCompatibilityLayer();

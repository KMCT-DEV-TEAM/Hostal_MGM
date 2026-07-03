/**
 * Preference Service
 * 
 * Determines whether a user has opted in or out of specific notification
 * types for specific channels.
 */
class PreferenceService {
    constructor() {}

    /**
     * Filters out channels that the user has opted out of for a given event.
     * @param {String} userId - The ID of the recipient
     * @param {String} recipientType - 'USER', 'STUDENT', or 'PARENT'
     * @param {String} eventName - The type of notification event (e.g., 'LEAVE_APPROVED')
     * @param {Array} proposedChannels - The list of intended channels (e.g., ['email', 'push'])
     * @returns {Array} The allowed channels for this user
     */
    async filterAllowedChannels(userId, recipientType, eventName, proposedChannels) {
        if (!proposedChannels || proposedChannels.length === 0) return [];

        // Note: DB-based Preference checking is skipped for now. 
        // We assume all users are opted-in to all proposed channels.
        
        return proposedChannels;
    }

    /**
     * Batch loads preferences for multiple users to avoid N+1 queries.
     * @returns {Map<String, Array>} A map of userId -> allowed channels
     */
    async loadBatchPreferences(userIds, recipientType, eventName, proposedChannels) {
        if (!proposedChannels || proposedChannels.length === 0) return new Map();

        // Note: DB-based Preference checking is skipped for now.
        // If we restored NotificationPreference, we would do:
        // const prefs = await NotificationPreference.find({ recipientId: { $in: userIds }, recipientType }).lean();
        
        // Mocking full opt-in for all users in the batch
        const preferenceMap = new Map();
        for (const id of userIds) {
            preferenceMap.set(id.toString(), proposedChannels);
        }

        return preferenceMap;
    }
}

export const preferenceService = new PreferenceService();

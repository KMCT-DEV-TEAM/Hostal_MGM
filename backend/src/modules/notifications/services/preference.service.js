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
     * @param {String} eventName - The type of notification event (e.g., 'LEAVE_APPROVED')
     * @param {Array} proposedChannels - The list of intended channels (e.g., ['email', 'push'])
     * @returns {Array} The allowed channels for this user
     */
    async filterAllowedChannels(userId, eventName, proposedChannels) {
        if (!proposedChannels || proposedChannels.length === 0) return [];

        // In a production system with user-configurable preferences, you would:
        // 1. Fetch user preferences from the DB: const prefs = await PreferenceModel.findOne({ userId });
        // 2. Check if prefs specify opt-outs for this specific `eventName`.
        // 3. Filter `proposedChannels` based on the opt-outs.

        // Example DB mock check:
        // const optOuts = prefs?.events?.[eventName]?.optOuts || []; 
        // return proposedChannels.filter(channel => !optOuts.includes(channel));

        // For now, we assume users are opted-in to all channels proposed by the template
        return proposedChannels;
    }
}

export const preferenceService = new PreferenceService();

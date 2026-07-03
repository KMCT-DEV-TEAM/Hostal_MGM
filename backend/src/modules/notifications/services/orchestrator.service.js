import { notificationRepository } from '../repositories/notification.repository.js';
import { dispatcherService } from './dispatcher.service.js';
import { recipientService } from './recipient.service.js';
import { preferenceService } from './preference.service.js';
import { templateService } from './template.service.js';
import { builderService } from './builder.service.js';

/**
 * Orchestrator Service
 * 
 * Coordinates the entire notification flow: gathering recipients, 
 * resolving preferences, building the templates, and dispatching.
 */
class OrchestratorService {
    constructor() {}

    /**
     * Entry point to trigger a notification workflow
     * @param {Object} eventPayload 
     * @param {String} eventPayload.eventName - e.g., 'LEAVE_APPROVED'
     * @param {String|Array} eventPayload.recipient - e.g., 'user_id', ['id1'], 'all-wardens'
     * @param {Object} eventPayload.data - The context data to inject into templates
     * @param {Array} [eventPayload.channels] - Intended external channels (defaults to ['email', 'push'])
     */
    async triggerNotification({ eventName, recipient, data = {}, channels = ['email', 'push'] }) {
        if (!eventName || !recipient) {
            throw new Error('eventName and recipient are required to trigger a notification.');
        }

        // 1. Fetch concrete recipient data
        const users = await recipientService.getRecipients(recipient);
        const results = [];

        for (const user of users) {
            try {
                // 2. Build the baseline 'in-app' template for the Database
                // We assume every notification must have an 'in-app' template for the DB record.
                const rawInAppTemplate = await templateService.getTemplate(eventName, 'in-app');
                const inAppPayload = await builderService.buildPayload(rawInAppTemplate, data);

                // 3. System of Record: Create in DB via Repository FIRST
                const dbNotification = await notificationRepository.create({
                    recipient: user.id,
                    title: inAppPayload.title,
                    message: inAppPayload.message,
                    type: inAppPayload.type || 'info',
                    link: inAppPayload.link || data.link || null,
                    metadata: data
                });

                // 4. Check user preferences to filter allowed external channels
                const allowedChannels = await preferenceService.filterAllowedChannels(user.id, eventName, channels);

                // 5. Dispatch to external providers (Email, Push, etc.)
                for (const channel of allowedChannels) {
                    try {
                        // Fetch the specific template for this channel (e.g. Email needs {subject, html})
                        const rawChannelTemplate = await templateService.getTemplate(eventName, channel);
                        const channelPayload = await builderService.buildPayload(rawChannelTemplate, data);
                        
                        // Dispatch via the Provider Registry
                        await dispatcherService.dispatch(channel, channelPayload, user);
                    } catch (channelErr) {
                        // We catch and log channel errors (like missing templates) so it doesn't break the entire flow
                        console.warn(`[Orchestrator] Skipped channel '${channel}' for user ${user.id}: ${channelErr.message}`);
                    }
                }

                results.push(dbNotification);
            } catch (err) {
                console.error(`[Orchestrator] Failed to process notification for user ${user.id}:`, err);
            }
        }

        return results;
    }
}

export const orchestratorService = new OrchestratorService();

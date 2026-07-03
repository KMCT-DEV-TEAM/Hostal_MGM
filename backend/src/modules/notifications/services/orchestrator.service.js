import { notificationRepository } from '../notification.repository.js';
import { dispatcherService } from './dispatcher.service.js';
import { recipientService } from './recipient.service.js';
import { preferenceService } from './preference.service.js';
import { templateService } from './template.service.js';
import { builderService } from './builder.service.js';
import mongoose from 'mongoose';

/**
 * Orchestrator Service
 * 
 * Coordinates the entire notification lifecycle:
 * 1. Resolves Recipient Targets
 * 2. Caches & Compiles Templates
 * 3. Checks User Preferences in Bulk
 * 4. Saves to Notification Database (System of Record) via Bulk Inserts
 * 5. Dispatches to External Channels
 */
class OrchestratorService {
    constructor() {}

    /**
     * Entry point to trigger a notification workflow
     * @param {Object} eventPayload 
     * @param {String} eventPayload.eventName - e.g., 'LEAVE_APPROVED'
     * @param {Object} eventPayload.target - e.g., { type: 'STUDENT', filter: { courseId: '123' } }
     * @param {Object} eventPayload.data - The context data to inject into templates
     * @param {Array} [eventPayload.channels] - Intended external channels (defaults to ['email', 'push'])
     */
    async triggerNotification({ eventName, target, data = {}, channels = ['email', 'push'] }) {
        if (!eventName || !target) {
            throw new Error('eventName and target are required to trigger a notification.');
        }

        // Strict Gatekeeping: Verify event is registered
        if (!templateService.hasEvent(eventName)) {
            const error = new Error(`Validation Error: Event '${eventName}' is not registered.`);
            error.status = 400;
            throw error;
        }

        // Strict Gatekeeping: Filter unsupported channels
        const allowedChannels = templateService.getAllowedChannels(eventName);
        channels = channels.filter(channel => allowedChannels.includes(channel));

        if (channels.length === 0) {
            console.warn(`[Orchestrator] All requested external channels were discarded because they are not supported by event '${eventName}'. Only in-app will be processed.`);
        }

        // 1. Template Caching: Load templates ONCE before the loop
        const templates = {
            'in-app': await templateService.getTemplate(eventName, 'in-app')
        };
        for (const channel of channels) {
            try {
                templates[channel] = await templateService.getTemplate(eventName, channel);
            } catch (err) {
                console.warn(`[Orchestrator] Missing template for channel '${channel}', skipping.`);
            }
        }

        // 2. Fetch concrete recipient cursor (Async Generator) for batch streaming
        const recipientCursor = await recipientService.getRecipients(target);
        
        let processedCount = 0;
        let batch = [];
        const BATCH_SIZE = 500;

        // Start MongoDB Session for transaction safety
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            // 3. Process the stream in batches
            for await (const user of recipientCursor) {
                batch.push(user);

                if (batch.length >= BATCH_SIZE) {
                    await this.processBatch(batch, eventName, data, channels, templates, session);
                    processedCount += batch.length;
                    batch = [];
                }
            }

            // Process any remaining users in the final batch
            if (batch.length > 0) {
                await this.processBatch(batch, eventName, data, channels, templates, session);
                processedCount += batch.length;
            }

            // Commit all batches if everything succeeded
            await session.commitTransaction();
            console.log(`[Orchestrator] Successfully committed notification broadcast for ${processedCount} users.`);

        } catch (error) {
            await session.abortTransaction();
            console.error(`[Orchestrator] Broadcast failed! Aborted transaction. Error:`, error);
            throw error;
        } finally {
            session.endSession();
        }

        return { status: 'success', totalProcessed: processedCount };
    }

    /**
     * Processes a batch of up to 500 users at once
     */
    async processBatch(batch, eventName, data, channels, templates, session) {
        // 1. Load preferences in bulk (One DB query instead of 500)
        const userIds = batch.map(u => u.id);
        const recipientType = batch[0]?.recipientType || 'USER'; 
        const preferenceMap = await preferenceService.loadBatchPreferences(userIds, recipientType, eventName, channels);

        // 2. Build In-App notifications for bulk insert
        const inAppDocs = [];
        for (const user of batch) {
            const inAppPayload = await builderService.buildPayload(templates['in-app'], data);
            inAppDocs.push({
                recipient: user.id,
                event: eventName,
                title: inAppPayload.title,
                message: inAppPayload.message,
                type: inAppPayload.type || 'info',
                link: inAppPayload.link || data.link || null,
                metadata: data
            });
        }

        // 3. Bulk Insert (System of Record) - Using the passed session
        await notificationRepository.insertMany(inAppDocs, session);

        // 4. Dispatch external channels rapidly using Promise.all
        const dispatchPromises = [];

        for (const user of batch) {
            const allowedChannels = preferenceMap.get(user.id.toString()) || [];
            
            for (const channel of allowedChannels) {
                if (!templates[channel]) continue;

                // Build payload using cached template
                const channelPayload = await builderService.buildPayload(templates[channel], data);
                
                dispatchPromises.push(
                    dispatcherService.dispatch(channel, channelPayload, user).catch(err => {
                        console.warn(`[Orchestrator] Dispatch failed for user ${user.id} on ${channel}:`, err.message);
                    })
                );
            }
        }

        await Promise.all(dispatchPromises);
    }
}

export const orchestratorService = new OrchestratorService();

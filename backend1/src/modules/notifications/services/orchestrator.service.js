import { notificationRepository } from '../notification.repository.js';
import { dispatcherService } from './dispatcher.service.js';
import { recipientService } from './recipient.service.js';
import { preferenceService } from './preference.service.js';
import { templateService } from './template.service.js';
import { builderService } from './builder.service.js';
import { audienceResolver } from './audience.resolver.js';
import mongoose from 'mongoose';
import { logger, requestContext } from '../../../utils/logger.js';
import { notificationCounter, notificationDuration } from '../../../utils/metrics.js';

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
    constructor() { }

    /**
     * Entry point to trigger a notification workflow
     * @param {Object} eventPayload 
     * @param {String} eventPayload.eventName - e.g., 'LEAVE_APPROVED'
     * @param {Object} eventPayload.target - e.g., { type: 'STUDENT', filter: { courseId: '123' } }
     * @param {Object} eventPayload.data - The context data to inject into templates
     * @param {Array} [eventPayload.channels] - Intended external channels (defaults to ['email', 'push'])
     * @param {Object} [eventPayload.sender] - Optional sender info
     */
    async triggerNotification({ eventName, target, data = {}, channels = ['in-app', 'push'], sender = null }) {
        if (!eventName || !target) {
            throw new Error('eventName and target are required to trigger a notification.');
        }

        if (!templateService.hasEvent(eventName)) {
            const error = new Error(`Validation Error: Event '${eventName}' is not registered.`);
            error.status = 400;
            throw error;
        }

        const requestId = data.requestId || new mongoose.Types.ObjectId().toString();
        const context = { requestId, eventName, senderId: sender?.id?.toString() };

        return requestContext.run(context, async () => {
            logger.info({ target, channels }, 'Notification broadcast triggered');

            const allowedChannels = templateService.getAllowedChannels(eventName);
            let filteredChannels = channels.filter(channel => allowedChannels.includes(channel));

            if (filteredChannels.length === 0) {
                logger.warn(`All requested external channels were discarded because they are not supported by event '${eventName}'. Only in-app will be processed.`);
            }

            const targets = Array.isArray(target) ? target : [target];
            let processedCount = 0;
            let batch = [];
            const BATCH_SIZE = 500;

            try {
                const processedUserIds = new Set();

                // 3. Process each target in the targets array
                for (const tgt of targets) {
                    const recipientCursor = await recipientService.getRecipients(tgt);
                    for await (const user of recipientCursor) {
                        const userIdStr = user.id.toString();
                        if (processedUserIds.has(userIdStr)) {
                            continue;
                        }
                        processedUserIds.add(userIdStr);

                        batch.push(user);
                        if (batch.length >= BATCH_SIZE) {
                            await this.processBatch(batch, eventName, data, filteredChannels, sender);
                            processedCount += batch.length;
                            batch = [];
                        }
                    }
                }

                if (batch.length > 0) {
                    await this.processBatch(batch, eventName, data, filteredChannels, sender);
                    processedCount += batch.length;
                }

                logger.info({ processedCount }, 'Successfully completed notification broadcast');

            } catch (error) {
                logger.error({ err: error.message }, 'Broadcast encountered an error');
                throw error;
            }

            return { status: 'success', totalProcessed: processedCount };
        });
    }

    /**
     * Processes a batch of up to 500 users at once
     */
    async processBatch(batch, eventName, data, channels, sender = null) {
        const userIds = batch.map(u => u.id);
        const recipientType = batch[0]?.recipientType || 'USER';
        const preferenceMap = await preferenceService.loadBatchPreferences(userIds, recipientType, eventName, channels);

        const dispatchJobs = [];
        const dbDocs = [];

        // 1. Resolve Templates and Build Jobs FIRST
        for (const user of batch) {
            const allowedChannels = preferenceMap.get(user.id.toString()) || [];
            const audience = audienceResolver.resolve(user);

            let baseTitle = null;
            let baseMessage = null;
            let baseLink = data.link || null;
            const deliveries = {};

            const docId = new mongoose.Types.ObjectId();

            for (const channel of allowedChannels) {
                const channelTemplate = await templateService.getTemplate(eventName, audience, channel);
                if (!channelTemplate) continue;

                const channelPayload = await builderService.buildPayload(channelTemplate, data);

                if (!baseTitle) baseTitle = channelPayload.title;
                if (!baseMessage) baseMessage = channelPayload.message;
                if (channelPayload.link) baseLink = channelPayload.link;

                if (baseLink) channelPayload.data = { url: baseLink };
                if (channel === 'in-app') {
                    channelPayload.id = docId;
                    channelPayload.event = eventName;
                    if (sender) channelPayload.sender = { name: sender.snapshot?.name, role: sender.snapshot?.role };
                }

                // Strictly PENDING at insert time, with 0 attempts.
                deliveries[channel] = { enabled: true, status: 'PENDING', attempts: 0 };

                dispatchJobs.push({ docId, user, channel, channelPayload });
            }

            if (Object.keys(deliveries).length === 0) continue;

            const modelMap = { 'STUDENT': 'Student', 'PARENT': 'Parent', 'USER': 'User' };
            const recipientModel = modelMap[user.recipientType] || 'User';

            const doc = {
                _id: docId,
                recipient: { id: user.id, model: recipientModel, snapshot: { name: user.name, role: user.recipientType } },
                event: { event: eventName, category: data.category || 'GENERAL', priority: data.priority || 'NORMAL', type: 'info' },
                title: baseTitle || 'Notification',
                message: baseMessage || '',
                link: baseLink,
                metadata: data,
                deliveries: deliveries
            };

            if (sender) {
                doc.sender = { id: sender.id, model: sender.model || 'User', snapshot: { name: sender.snapshot?.name, role: sender.snapshot?.role } };
            }
            dbDocs.push(doc);
        }

        // 2. Database Phase - Bulk Create
        if (dbDocs.length > 0) {
            const session = await mongoose.startSession();
            try {
                session.startTransaction();
                await notificationRepository.bulkCreate(dbDocs, session);
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        }

        // 3. Network Phase - Dispatch with DB Updates
        const envLimit = parseInt(process.env.NOTIFICATION_CONCURRENCY_LIMIT, 10);
        const CONCURRENCY_LIMIT = (envLimit > 0) ? envLimit : 50;
        let chunkJobs = [];

        for (const job of dispatchJobs) {
            chunkJobs.push(job);

            if (chunkJobs.length >= CONCURRENCY_LIMIT) {
                await this._executeChunk(chunkJobs);
                chunkJobs = [];
                await new Promise(resolve => setImmediate(resolve));
            }
        }

        if (chunkJobs.length > 0) {
            await this._executeChunk(chunkJobs);
        }
    }

    /**
     * Executes a single concurrency chunk of dispatch jobs, maintaining lifecycle states.
     */
    async _executeChunk(chunkJobs) {
        // 1. Transition to PROCESSING state in DB
        await this._bulkUpdateToProcessing(chunkJobs);

        // 2. Map jobs to execution promises
        const execPromises = chunkJobs.map(job => {
            const startTime = Date.now();
            return dispatcherService.dispatch(job.channel, job.channelPayload, job.user)
                .then(result => ({
                    docId: job.docId, channel: job.channel, result, durationMs: Date.now() - startTime
                }))
                .catch(error => ({
                    docId: job.docId, channel: job.channel, error, durationMs: Date.now() - startTime
                }));
        });

        // 3. Wait for all network calls in this chunk
        const results = await Promise.all(execPromises);

        // 4. Transition to DELIVERED/FAILED state in DB
        await this._bulkUpdateDeliveryStatuses(results);
    }

    /**
     * Transitions jobs from PENDING to PROCESSING and increments attempts.
     */
    async _bulkUpdateToProcessing(jobs) {
        const operations = jobs.map(job => ({
            updateOne: {
                filter: { _id: job.docId },
                update: {
                    $set: {
                        [`deliveries.${job.channel}.status`]: 'PROCESSING',
                        [`deliveries.${job.channel}.lastAttemptAt`]: new Date()
                    },
                    $inc: {
                        [`deliveries.${job.channel}.attempts`]: 1
                    }
                }
            }
        }));

        if (operations.length > 0) {
            await notificationRepository.bulkUpdate(operations);
        }
    }

    /**
     * Translates dispatch results into MongoDB bulkWrite operations.
     */
    async _bulkUpdateDeliveryStatuses(results) {
        const context = requestContext.getStore() || {};
        const eventName = context.eventName || 'UNKNOWN';

        const operations = results.map(({ docId, channel, result, error, durationMs }) => {
            const prefix = `deliveries.${channel}`;
            const updateSet = {};

            updateSet[`${prefix}.durationMs`] = durationMs;
            notificationDuration.observe({ channel }, durationMs / 1000);

            if (error) {
                logger.error({ notificationId: docId, channel, err: error.message }, 'Delivery failed');
                notificationCounter.inc({ channel, status: 'FAILED', event_name: eventName });

                updateSet[`${prefix}.status`] = 'FAILED';
                updateSet[`${prefix}.error`] = { code: error.code || 'UNKNOWN', message: error.message };
            } else {
                logger.debug({ notificationId: docId, channel }, 'Delivery successful');
                notificationCounter.inc({ channel, status: 'DELIVERED', event_name: eventName });

                updateSet[`${prefix}.status`] = result.status || 'DELIVERED';
                updateSet[`${prefix}.deliveredAt`] = new Date();
                if (result.details?.messageId) {
                    updateSet[`${prefix}.providerMessageId`] = result.details.messageId;
                }
            }

            return {
                updateOne: {
                    filter: { _id: docId },
                    update: { $set: updateSet }
                }
            };
        });

        if (operations.length > 0) {
            await notificationRepository.bulkUpdate(operations);
        }
    }
}

export const orchestratorService = new OrchestratorService();

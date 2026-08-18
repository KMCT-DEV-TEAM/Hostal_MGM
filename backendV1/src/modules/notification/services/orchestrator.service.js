import { notificationRepository } from '../notification.repository.js';
import { dispatcherService } from './dispatcher.service.js';
import { audienceResolverService } from './audienceResolver.service.js';
import { templateService } from './template.service.js';
import { chunkArray } from '../utils/chunk.util.js';
import { logger } from '../../../utils/logger.js';
import { NotificationStatus } from '../constants/notification.enums.js';

class OrchestratorService {
    async triggerNotification({ eventName, target, data = {}, channels = ['in-app', 'push'], sender = null }) {
        if (!eventName || !target) {
            throw new Error('eventName and target are required to trigger a notification.');
        }

        if (!templateService.hasEvent(eventName)) {
            const error = new Error(`Validation Error: Event '${eventName}' is not registered.`);
            error.status = 400;
            throw error;
        }

        logger.info({ target, channels }, 'Notification broadcast triggered');

        const allowedChannels = templateService.getAllowedChannels(eventName);
        const filteredChannels = channels.filter(channel => allowedChannels.includes(channel));

        if (filteredChannels.length === 0) {
            logger.warn(`All requested external channels were discarded because they are not supported by event '${eventName}'.`);
        }

        const targets = Array.isArray(target) ? target : [target];
        let processedCount = 0;
        let allRecipients = [];

        try {
            // 1. Resolve all recipients
            for (const tgt of targets) {
                const users = await audienceResolverService.resolve(tgt);
                allRecipients.push(...users);
            }

            // Deduplicate users by ID
            const uniqueUsersMap = new Map();
            allRecipients.forEach(u => uniqueUsersMap.set(u.id.toString(), u));
            const batch = Array.from(uniqueUsersMap.values());

            // 2. Process in chunks
            const BATCH_SIZE = 500;
            const chunks = chunkArray(batch, BATCH_SIZE);

            for (const chunk of chunks) {
                await this.processBatch(chunk, eventName, data, filteredChannels, sender);
                processedCount += chunk.length;
            }

            logger.info({ processedCount }, 'Successfully completed notification broadcast');
            return { status: 'success', totalProcessed: processedCount };

        } catch (error) {
            logger.error({ err: error.message }, 'Broadcast encountered an error');
            throw error;
        }
    }

    async processBatch(batch, eventName, data, channels, sender = null) {
        const dispatchJobs = [];
        const dbDocs = [];

        for (const user of batch) {
            let baseTitle = null;
            let baseMessage = null;
            let baseLink = data.link || null;

            const deliveryInApp = {};
            const deliveryPush = {};
            const deliveryEmail = {};

            // Build content from template (stubbed basic generator if no explicit template engine)
            const template = templateService.getTemplate(eventName, user.recipientType, 'in-app') || {
                title: `${eventName} Notification`,
                message: `You have a new notification regarding ${eventName}`
            };

            baseTitle = template.title;
            baseMessage = template.message;

            if (channels.includes('in-app')) {
                deliveryInApp.status = NotificationStatus.PENDING;
                deliveryInApp.attempts = 0;
            }
            if (channels.includes('push')) {
                deliveryPush.status = NotificationStatus.PENDING;
                deliveryPush.attempts = 0;
            }

            // Create payload for dispatcher
            const channelPayload = {
                title: baseTitle,
                message: baseMessage,
                link: baseLink,
                data
            };

            // Temporary ID generation to map dispatch jobs to DB records
            // In Prisma, we let DB generate UUID, so we'll wait for insert, or we can use crypto.randomUUID()
            const docId = crypto.randomUUID();

            const doc = {
                id: docId,
                recipientId: user.id,
                recipientModel: user.recipientType,
                recipientSnapshotName: user.name,
                eventType: eventName,
                eventCategory: data.category || 'GENERAL',
                eventTypeLabel: data.label || eventName,
                title: baseTitle || 'Notification',
                message: baseMessage || '',
                link: baseLink,
                metadata: data,
                deliveryInAppStatus: channels.includes('in-app') ? NotificationStatus.PENDING : undefined,
                deliveryPushStatus: channels.includes('push') ? NotificationStatus.PENDING : undefined,
            };

            if (sender) {
                doc.senderId = sender.id;
                doc.senderModel = sender.model || 'User';
                doc.senderSnapshotName = sender.snapshot?.name;
            }

            dbDocs.push(doc);

            if (channels.includes('in-app')) {
                dispatchJobs.push({ docId, user, channel: 'in-app', channelPayload: { ...channelPayload, id: docId, event: eventName } });
            }
            if (channels.includes('push')) {
                dispatchJobs.push({ docId, user, channel: 'push', channelPayload });
            }
        }

        // 2. Database Phase - Bulk Create
        if (dbDocs.length > 0) {
            await notificationRepository.createBulkNotifications(dbDocs);
        }

        // 3. Network Phase - Dispatch
        const CONCURRENCY_LIMIT = 50;
        const jobChunks = chunkArray(dispatchJobs, CONCURRENCY_LIMIT);

        for (const chunk of jobChunks) {
            await this._executeChunk(chunk);
            await new Promise(resolve => setImmediate(resolve));
        }
    }

    async _executeChunk(chunkJobs) {
        // Mark as PROCESSING
        const updateOps = chunkJobs.map(job => {
            const prefix = job.channel === 'in-app' ? 'deliveryInApp' : 'deliveryPush';
            return {
                docId: job.docId,
                updateData: {
                    [`${prefix}Status`]: NotificationStatus.PROCESSING,
                    [`${prefix}Attempts`]: 1
                }
            };
        });
        await notificationRepository.bulkUpdateDeliveryStatus(updateOps);

        // Map jobs to execution promises
        const execPromises = chunkJobs.map(job => {
            return dispatcherService.dispatch(job.channel, job.channelPayload, job.user)
                .then(result => ({ docId: job.docId, channel: job.channel, result }))
                .catch(error => ({ docId: job.docId, channel: job.channel, error }));
        });

        const results = await Promise.all(execPromises);

        // Update DB with DELIVERED/FAILED
        const finalOps = results.map(({ docId, channel, result, error }) => {
            const prefix = channel === 'in-app' ? 'deliveryInApp' : 'deliveryPush';
            const status = error ? NotificationStatus.FAILED : (result.status || NotificationStatus.DELIVERED);

            return {
                docId,
                updateData: {
                    [`${prefix}Status`]: status,
                    [`${prefix}SentAt`]: error ? undefined : new Date()
                }
            };
        });

        await notificationRepository.bulkUpdateDeliveryStatus(finalOps);
    }
}

export const orchestratorService = new OrchestratorService();

import { sendPushNotification } from '../../push/push.service.js';

export class PushProvider {
    /**
     * Sends a push notification to a device.
     */
    async send(payload, recipientDetails) {
        if (!recipientDetails.id || !recipientDetails.recipientType) {
            throw new Error('id and recipientType are required for push notifications');
        }

        const modelMap = {
            'STUDENT': 'Student',
            'PARENT': 'Parent',
            'USER': 'User'
        };
        const model = modelMap[recipientDetails.recipientType];

        const recipient = {
            id: recipientDetails.id,
            model: model
        };

        const result = await sendPushNotification(recipient, payload);
        
        if (!result.success) {
            console.log(`[PushProvider] Skipped (No active subscriptions) for recipient:`, recipient);
        } else if (result.failedCount > 0) {
            console.error(`[PushProvider] Failed deliveries for recipient:`, recipient, result.failures);
        } else {
            console.log(`[PushProvider] Successfully delivered ${result.successCount} push notifications to recipient:`, recipient);
        }

        return { status: result.success ? 'DELIVERED' : 'FAILED', channel: 'push', timestamp: new Date(), details: result };
    }
}

import { sendPushNotification } from '../../push/push.service.js';

export class PushProvider {
    /**
     * Sends a push notification to a device.
     */
    async send(payload, recipientDetails) {
        if (!recipientDetails.id || !recipientDetails.recipientType) {
            console.error('[Notification DEBUG - Push] Missing id or recipientType:', recipientDetails);
            throw new Error('id and recipientType are required for push notifications');
        }

        const modelMap = {
            'STUDENT': 'Student',
            'PARENT': 'Parent',
            'USER': 'User'
        };
        const model = modelMap[recipientDetails.recipientType] || recipientDetails.recipientType;

        const recipient = {
            id: recipientDetails.id,
            model: model
        };

        console.log(`[Notification DEBUG - Push] 📲 Dispatching Push Notification to ${model} ID [${recipient.id}]...`);
        const result = await sendPushNotification(recipient, payload);
        
        if (!result.success) {
            console.log(`[Notification DEBUG - Push] ⚠️ Skipped (No active push subscriptions found for ${model} ID [${recipient.id}])`);
        } else if (result.failedCount > 0) {
            console.error(`[Notification DEBUG - Push] ❌ Failed deliveries (${result.failedCount}) for ${model} ID [${recipient.id}]:`, result.failures);
        } else {
            console.log(`[Notification DEBUG - Push] ✅ Successfully delivered ${result.successCount} push notification(s) to ${model} ID [${recipient.id}]`);
        }

        return { status: result.success ? 'DELIVERED' : 'FAILED', channel: 'push', timestamp: new Date(), details: result };
    }
}

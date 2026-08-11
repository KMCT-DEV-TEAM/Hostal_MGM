import { dispatcherService } from './services/dispatcher.service.js';
import { sendPushNotification } from '../push/push.service.js';
import { getIo } from '../../config/socket.js';

export class EmailProvider {
    /**
     * Sends an email notification.
     */
    async send(payload, recipientDetails) {
        if (!recipientDetails.email) {
            throw new Error('email is required for email notifications');
        }

        // TODO: Implement actual email sending logic (e.g., Nodemailer, SendGrid, AWS SES)
        console.log(`[EmailProvider] Simulated sending email to: ${recipientDetails.email}`);

        return { status: 'success', channel: 'email', timestamp: new Date() };
    }
}

export class InAppProvider {
    /**
     * Sends an in-app notification.
     */
    async send(payload, recipientDetails) {
        if (!recipientDetails.id && !recipientDetails.userId) {
            throw new Error('user id is required for in-app notifications');
        }

        const userId = (recipientDetails.id || recipientDetails.userId).toString();
        const io = getIo();

        if (io) {
            io.to(userId).emit("notification", {
                ...payload,
                timestamp: new Date()
            });
            console.log(`[InAppProvider] Emitted realtime socket event to room ${userId}`);
        }

        return { status: 'DELIVERED', channel: 'in-app', timestamp: new Date() };
    }
}

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
        
        // Add logging to debug push deliveries
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

/**
 * Initializes and registers all available notification providers 
 * with the central dispatcher registry.
 */
export const registerNotificationProviders = () => {
    // Instantiate providers
    // const emailProvider = new EmailProvider();
    const pushProvider = new PushProvider();
    const inAppProvider = new InAppProvider();

    // Register them with the dynamic registry
    // dispatcherService.registerProvider('email', emailProvider);
    dispatcherService.registerProvider('push', pushProvider);
    dispatcherService.registerProvider('in-app', inAppProvider);

    console.log('[Notification System] All providers successfully registered.');
};

import { dispatcherService } from './services/dispatcher.service.js';

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

export class PushProvider {
    /**
     * Sends a push notification to a device.
     */
    async send(payload, recipientDetails) {
        if (!recipientDetails.pushToken) {
            throw new Error('pushToken is required for push notifications');
        }
        
        // TODO: Implement actual push sending logic (e.g., Firebase Admin SDK, APNs)
        console.log(`[PushProvider] Simulated sending push to token: ${recipientDetails.pushToken}`);
        
        return { status: 'success', channel: 'push', timestamp: new Date() };
    }
}

/**
 * Initializes and registers all available notification providers 
 * with the central dispatcher registry.
 */
export const registerNotificationProviders = () => {
    // Instantiate providers
    const emailProvider = new EmailProvider();
    const pushProvider = new PushProvider();

    // Register them with the dynamic registry
    dispatcherService.registerProvider('email', emailProvider);
    dispatcherService.registerProvider('push', pushProvider);

    console.log('[Notification System] All providers successfully registered.');
};

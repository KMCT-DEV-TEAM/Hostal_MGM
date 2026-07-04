/**
 * Dispatcher Service
 * 
 * A dynamic registry for notification providers. The dispatcher is completely
 * agnostic to the underlying channels (Email, Push, SMS, etc.). It simply looks
 * up a registered provider and invokes its common send() contract.
 */
class DispatcherService {
    constructor() {
        this.providers = new Map();
    }

    /**
     * Registers a new provider for a specific channel.
     * @param {String} channel - The channel name (e.g., 'email', 'in-app', 'sms')
     * @param {Object} provider - An object implementing the `send(payload, recipientDetails)` method
     */
    registerProvider(channel, provider) {
        if (!provider || typeof provider.send !== 'function') {
            throw new Error(`Provider for channel '${channel}' must implement an async send() method.`);
        }
        this.providers.set(channel, provider);
    }

    /**
     * Dispatches the notification payload using the appropriate provider.
     * @param {String} channel - The target channel (must be registered)
     * @param {Object} payload - The finalized message payload
     * @param {Object} recipientDetails - The destination details
     */
    async dispatch(channel, payload, recipientDetails) {
        const provider = this.providers.get(channel);
        
        if (!provider) {
            throw new Error(`No provider registered for channel: ${channel}`);
        }
        
        return provider.send(payload, recipientDetails);
    }
}

export const dispatcherService = new DispatcherService();

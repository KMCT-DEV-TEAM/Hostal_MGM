import { logger } from '../../../utils/logger.js';
import { isRetryableError } from '../utils/retry.util.js';
import { InAppProvider } from '../providers/inApp.provider.js';
import { PushProvider } from '../providers/push.provider.js';

class DispatcherService {
    constructor() {
        this.providers = new Map();
        // Register default channel providers
        this.registerProvider('in-app', new InAppProvider());
        this.registerProvider('push', new PushProvider());
    }

    /**
     * Registers a new provider for a specific channel.
     */
    registerProvider(channel, provider) {
        if (!provider || typeof provider.send !== 'function') {
            throw new Error(`Provider for channel '${channel}' must implement an async send() method.`);
        }
        this.providers.set(channel, provider);
        console.log(`[Notification DEBUG - Dispatcher] Registered provider for channel: '${channel}'`);
    }

    _getTimeout(channel) {
        if (channel === 'push') return parseInt(process.env.PUSH_TIMEOUT_MS, 10) || 10000;
        if (channel === 'email') return parseInt(process.env.EMAIL_TIMEOUT_MS, 10) || 15000;
        if (channel === 'in-app') return parseInt(process.env.SOCKET_TIMEOUT_MS, 10) || 1000;
        return 5000;
    }

    /**
     * Executes a provider with a strict AbortController timeout.
     */
    async _executeWithTimeout(provider, payload, recipientDetails, timeoutMs, channel) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            const err = new Error(`ProviderTimeout: ${channel} provider timed out after ${timeoutMs}ms`);
            err.isTimeout = true;
            controller.abort(err);
        }, timeoutMs);

        try {
            const result = await Promise.race([
                provider.send(payload, recipientDetails, { signal: controller.signal }),
                new Promise((_, reject) => {
                    controller.signal.addEventListener('abort', () => reject(controller.signal.reason));
                })
            ]);
            return result;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Standardizes the output format of a provider execution.
     */
    _standardizeResponse(channel, result) {
        return {
            success: true,
            channel,
            status: result?.status || 'DELIVERED',
            timestamp: new Date(),
            details: result?.details || result || null
        };
    }

    /**
     * Dispatches the notification payload using the appropriate provider.
     */
    async dispatch(channel, payload, recipientDetails) {
        console.log(`[Notification DEBUG - Dispatcher] Dispatching channel [${channel}] to recipient [${recipientDetails?.id}] (${recipientDetails?.recipientType})`);
        const provider = this.providers.get(channel);

        if (!provider) {
            console.error(`[Notification DEBUG - Dispatcher] ❌ NO provider registered for channel: [${channel}]. Available providers:`, Array.from(this.providers.keys()));
            throw new Error(`No provider registered for channel: ${channel}`);
        }

        const timeoutMs = this._getTimeout(channel);
        const policy = provider.retryPolicy || {};
        const MAX_RETRIES = policy.maxRetries !== undefined ? policy.maxRetries : 0;
        let attempt = 0;

        while (attempt <= MAX_RETRIES) {
            try {
                const result = await this._executeWithTimeout(provider, payload, recipientDetails, timeoutMs, channel);
                console.log(`[Notification DEBUG - Dispatcher] ✅ Dispatch SUCCESS for channel [${channel}] to recipient [${recipientDetails?.id}]`);
                return this._standardizeResponse(channel, result);
            } catch (error) {
                console.error(`[Notification DEBUG - Dispatcher] ❌ Dispatch ERROR for channel [${channel}] to recipient [${recipientDetails?.id}]:`, error.message);
                if (!isRetryableError(error, policy)) {
                    throw error;
                }

                attempt++;
                if (attempt > MAX_RETRIES) {
                    error.message = `[Dispatch Failed] Channel '${channel}' exhausted ${MAX_RETRIES} retries. Last error: ${error.message}`;
                    throw error;
                }

                logger.warn({ channel, attempt, maxRetries: MAX_RETRIES, err: error.message }, 'Provider transient failure, retrying...');

                const backoffMs = (typeof policy.backoff === 'function')
                    ? policy.backoff(attempt)
                    : Math.pow(2, attempt - 1) * 1000;

                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }
    }
}

export const dispatcherService = new DispatcherService();

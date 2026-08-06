import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage();

// Standardized log levels mapped to environments
const getLogLevel = () => {
    if (process.env.LOG_LEVEL) {
        return process.env.LOG_LEVEL;
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

export const logger = pino({
    level: getLogLevel(),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => ({ level: label.toUpperCase() })
    },
    mixin() {
        const context = requestContext.getStore();
        return context ? context : {};
    }
});

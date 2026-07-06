/**
 * Centralized logger to avoid direct console.log usage across the application.
 * In a real-world enterprise app, this might ship logs to Datadog, Sentry, etc.
 */
export const logger = {
  info: (...args) => {
    if (import.meta.env.MODE !== 'production') {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args) => {
    if (import.meta.env.MODE !== 'production') {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args) => {
    // We typically always want to log errors, even in prod, 
    // or send them to an error monitoring service
    console.error('[ERROR]', ...args);
  },
};

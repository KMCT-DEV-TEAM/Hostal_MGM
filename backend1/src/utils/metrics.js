import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register }); // Auto-collects memory/CPU/EventLoop lag

export const notificationCounter = new promClient.Counter({
    name: 'notifications_total',
    help: 'Total notifications processed',
    labelNames: ['channel', 'status', 'event_name'],
    registers: [register]
});

export const notificationDuration = new promClient.Histogram({
    name: 'notification_dispatch_duration_seconds',
    help: 'Duration of dispatch calls',
    labelNames: ['channel'],
    buckets: [0.1, 0.5, 1, 2, 5, 10], // seconds
    registers: [register]
});

export const metricsRegistry = register;

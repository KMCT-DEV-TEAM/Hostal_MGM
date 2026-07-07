import mongoose from 'mongoose';

const deliveryChannelSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRYING'],
        default: 'PENDING'
    },
    attempts: { type: Number, default: 0 },
    provider: { type: String },
    providerMessageId: { type: String },
    queuedAt: { type: Date },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    lastAttemptAt: { type: Date },
    error: {
        code: { type: String },
        message: { type: String }
    }
}, { _id: false });

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'recipient.model' },
            model: { type: String, required: true, enum: ['User', 'Student', 'Parent'] },
            snapshot: {
                name: String,
                role: String
            }
        },
        sender: {
            id: { type: mongoose.Schema.Types.ObjectId, refPath: 'sender.model' },
            model: { type: String, enum: ['User', 'Student', 'Parent', 'System'] },
            snapshot: {
                name: String,
                role: String
            }
        },
        event: {
            event: { type: String, required: true },
            category: { type: String, required: true },
            priority: { type: String, required: true, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
            type: { type: String, required: true }
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        deliveries: {
            inApp: { type: deliveryChannelSchema, default: () => ({ enabled: true, status: 'PENDING' }) },
            email: { type: deliveryChannelSchema, default: () => ({}) },
            push: { type: deliveryChannelSchema, default: () => ({}) }
        }
    },
    {
        timestamps: true,
    }
);

// Indexes specified in the requirements
notificationSchema.index({ 'recipient.id': 1, createdAt: -1 }); // Primary query pattern
notificationSchema.index({ 'recipient.id': 1, 'recipient.model': 1 });
notificationSchema.index({ 'event.event': 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });
notificationSchema.index({ 'deliveries.email.status': 1 });
notificationSchema.index({ 'deliveries.push.status': 1 });
notificationSchema.index({ 'event.priority': 1 });
notificationSchema.index({ 'event.category': 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

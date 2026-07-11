import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    recipient: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipient.model',
      },
      model: {
        type: String,
        required: true,
        enum: ['User', 'Student', 'Parent'],
      },
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    inactiveAt: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
// For quickly finding all active subscriptions for a recipient
pushSubscriptionSchema.index({ 'recipient.id': 1, 'recipient.model': 1, isActive: 1 });
// TTL index: delete documents 90 days (7776000 seconds) after they become inactive. 
// Partial filter ensures we don't index (and therefore don't expire) documents where inactiveAt is null.
pushSubscriptionSchema.index(
  { inactiveAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, partialFilterExpression: { isActive: false } }
);

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;

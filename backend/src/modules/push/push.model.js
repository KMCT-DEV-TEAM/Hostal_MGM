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
    subscriptions: [
      {
        endpoint: {
          type: String,
          required: true,
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
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Indexes
// One document per recipient
pushSubscriptionSchema.index({ 'recipient.id': 1, 'recipient.model': 1 }, { unique: true });
// Index on the endpoints inside the array for quick lookup/removal
pushSubscriptionSchema.index({ 'subscriptions.endpoint': 1 });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;

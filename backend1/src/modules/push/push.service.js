import PushSubscription from './push.model.js';
import mongoose from 'mongoose';
import webpush from '../../config/push.config.js';

/**
 * Registers a new web push subscription or updates an existing one for the user.
 * @param {Object} recipientData - { id, model }
 * @param {Object} subscriptionData - { endpoint, keys: { p256dh, auth } }
 * @returns {Promise<Object>} The registered subscription document
 */
export const registerSubscriptionService = async (recipientData, subscriptionData) => {
  const { endpoint, keys } = subscriptionData;

  try {
    return await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          recipient: recipientData,
          keys,
          isActive: true,
          inactiveAt: null
        }
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    if (error.code === 11000 && error.message.includes('recipient.id_1_recipient.model_1')) {
      console.log('Dropping legacy unique index on PushSubscription...');
      await PushSubscription.collection.dropIndex('recipient.id_1_recipient.model_1').catch(e => console.log('Index already dropped or drop failed:', e.message));

      return await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
          $set: {
            recipient: recipientData,
            keys,
            isActive: true,
            inactiveAt: null
          }
        },
        { upsert: true, new: true }
      );
    }
    throw error;
  }
};

/**
 * Soft removes a subscription by marking it as inactive, OR hard deletes it if specified.
 * @param {String} endpoint - The subscription endpoint URL
 * @param {Boolean} hardDelete - Whether to hard delete the subscription
 * @returns {Promise<Object|null>} The updated/deleted document or null if not found
 */
export const removeSubscriptionService = async (endpoint, hardDelete = false) => {
  if (hardDelete) {
    return await PushSubscription.findOneAndDelete({ endpoint });
  } else {
    return await PushSubscription.findOneAndUpdate(
      { endpoint },
      { $set: { isActive: false, inactiveAt: new Date() } },
      { new: true }
    );
  }
};

/**
 * Retrieves all active subscriptions for a specific recipient.
 * @param {String} recipientId - The ID of the recipient
 * @param {String} recipientModel - The Model of the recipient
 * @returns {Promise<Array>} Array of active subscriptions
 */
export const getActiveSubscriptionsService = async (recipientId, recipientModel) => {
  const matchQuery = {
    'recipient.id': new mongoose.Types.ObjectId(recipientId),
    isActive: true
  };

  if (recipientModel) {
    matchQuery['recipient.model'] = recipientModel;
  }

  const subscriptions = await PushSubscription.find(matchQuery).lean();

  return subscriptions.map(sub => ({
    endpoint: sub.endpoint,
    keys: sub.keys
  }));
};

/**
 * Sends a push notification to all active subscriptions of a recipient.
 * @param {Object} recipient - { id, model }
 * @param {Object} payload - { title, body, icon, badge, data }
 * @returns {Promise<Object>} Summary of delivery
 */
export const sendPushNotification = async (recipient, payload) => {
  const activeSubscriptions = await getActiveSubscriptionsService(recipient.id, recipient.model);

  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    return {
      success: false,
      totalSubscriptions: 0,
      successCount: 0,
      failedCount: 0,
      failures: []
    };
  }

  const payloadString = JSON.stringify(payload);
  let successCount = 0;
  let failedCount = 0;
  const failures = [];

  const promises = activeSubscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payloadString
      );
      successCount++;
    } catch (error) {
      failedCount++;
      const statusCode = error.statusCode;
      failures.push({ endpoint: sub.endpoint, error: error.message, statusCode });

      if (statusCode === 401 || statusCode === 404 || statusCode === 410 || (statusCode === 403 && error.body && error.body.includes("VAPID credentials"))) {
        await removeSubscriptionService(sub.endpoint, true);
      }
    }
  });

  await Promise.allSettled(promises);

  return {
    success: true,
    totalSubscriptions: activeSubscriptions.length,
    successCount,
    failedCount,
    failures
  };
};

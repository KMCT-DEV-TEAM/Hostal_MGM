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
  const subEntry = { endpoint, keys, isActive: true };

  // 1. Global Search: Does this exact endpoint exist anywhere in the DB?
  let existingDoc = await PushSubscription.findOne({ 'subscriptions.endpoint': endpoint });

  if (existingDoc) {
    const isSameUser = existingDoc.recipient.id.toString() === recipientData.id.toString() &&
                       existingDoc.recipient.model === recipientData.model;

    if (!isSameUser) {
      // 2. Reassignment: Endpoint belongs to another user. Remove it from them.
      existingDoc.subscriptions = existingDoc.subscriptions.filter(sub => sub.endpoint !== endpoint);
      await existingDoc.save();
    } else {
      // 3. Update: Endpoint belongs to this user. Just update keys & activate.
      const existingIndex = existingDoc.subscriptions.findIndex(sub => sub.endpoint === endpoint);
      if (existingIndex > -1) {
        existingDoc.subscriptions[existingIndex].keys = keys;
        existingDoc.subscriptions[existingIndex].isActive = true;
      }
      return await existingDoc.save();
    }
  }

  // 4. Creation/Append: We are here if endpoint didn't exist, OR it was removed from another user.
  let currentDoc = await PushSubscription.findOne({
    'recipient.id': recipientData.id,
    'recipient.model': recipientData.model
  });

  if (currentDoc) {
    currentDoc.subscriptions.push(subEntry);
    return await currentDoc.save();
  } else {
    const newDoc = new PushSubscription({
      recipient: recipientData,
      subscriptions: [subEntry]
    });
    return await newDoc.save();
  }
};

/**
 * Soft removes a subscription by marking it as inactive inside the array.
 * @param {String} endpoint - The subscription endpoint URL
 * @returns {Promise<Object|null>} The updated document or null if not found
 */
export const removeSubscriptionService = async (endpoint) => {
  return await PushSubscription.findOneAndUpdate(
    { 'subscriptions.endpoint': endpoint },
    { $set: { 'subscriptions.$.isActive': false } },
    { new: true }
  );
};

/**
 * Retrieves all active subscriptions for a specific recipient using aggregation.
 * @param {String} recipientId - The ID of the recipient
 * @param {String} recipientModel - The Model of the recipient
 * @returns {Promise<Array>} Array of active subscriptions
 */
export const getActiveSubscriptionsService = async (recipientId, recipientModel) => {
  const matchQuery = {
    'recipient.id': new mongoose.Types.ObjectId(recipientId)
  };
  
  if (recipientModel) {
    matchQuery['recipient.model'] = recipientModel;
  }

  const result = await PushSubscription.aggregate([
    { $match: matchQuery },
    { $unwind: '$subscriptions' },
    {
      $match: {
        'subscriptions.isActive': true
      }
    },
    {
      $project: {
        _id: 0,
        endpoint: '$subscriptions.endpoint',
        keys: '$subscriptions.keys'
      }
    }
  ]);
  
  return result;
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

      if (statusCode === 404 || statusCode === 410) {
        // Deactivate subscription as per requirements
        await removeSubscriptionService(sub.endpoint);
      }
    }
  });

  await Promise.allSettled(promises); // Use Promise.allSettled to ensure all finish even if one crashes

  return {
    success: true,
    totalSubscriptions: activeSubscriptions.length,
    successCount,
    failedCount,
    failures
  };
};

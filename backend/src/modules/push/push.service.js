import PushSubscription from './push.model.js';
import mongoose from 'mongoose';

/**
 * Registers a new web push subscription or updates an existing one for the user.
 * @param {Object} recipientData - { id, model }
 * @param {Object} subscriptionData - { endpoint, keys: { p256dh, auth } }
 * @returns {Promise<Object>} The registered subscription document
 */
export const registerSubscriptionService = async (recipientData, subscriptionData) => {
  let doc = await PushSubscription.findOne({
    'recipient.id': recipientData.id,
    'recipient.model': recipientData.model
  });

  const subEntry = {
    endpoint: subscriptionData.endpoint,
    keys: subscriptionData.keys,
    isActive: true
  };

  if (doc) {
    // Check if this endpoint already exists in the array
    const existingIndex = doc.subscriptions.findIndex(
      (sub) => sub.endpoint === subscriptionData.endpoint
    );

    if (existingIndex > -1) {
      // Update existing
      doc.subscriptions[existingIndex].keys = subscriptionData.keys;
      doc.subscriptions[existingIndex].isActive = true;
    } else {
      // Add new
      doc.subscriptions.push(subEntry);
    }
    return await doc.save();
  } else {
    // Create new recipient document
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
 * @returns {Promise<Array>} Array of active subscriptions
 */
export const getActiveSubscriptionsService = async (recipientId) => {
  const result = await PushSubscription.aggregate([
    {
      $match: {
        'recipient.id': new mongoose.Types.ObjectId(recipientId)
      }
    },
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

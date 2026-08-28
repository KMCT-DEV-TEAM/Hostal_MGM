import { prisma } from "../../config/prisma.js";
import webpush from "../../config/push.config.js";

/**
 * Formats a Prisma PushSubscription model to match the standard API response structure.
 */
export const formatPushSubscription = (subscription) => {
  if (!subscription) return null;
  return {
    id: subscription.id,
    recipient: {
      id: subscription.recipientId,
      model: subscription.recipientModel,
    },
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keyP256dh,
      auth: subscription.keyAuth,
    },
    isActive: subscription.isActive,
    inactiveAt: subscription.inactiveAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
};

/**
 * Registers a new web push subscription or updates an existing one for the recipient.
 * @param {Object} recipientData - { id, model }
 * @param {Object} subscriptionData - { endpoint, keys: { p256dh, auth } }
 * @returns {Promise<Object>} The registered subscription document
 */
export const registerSubscriptionDb = async (recipientData, subscriptionData) => {
  const { endpoint, keys } = subscriptionData;
  const p256dh = keys?.p256dh || "";
  const auth = keys?.auth || "";

  const savedSubscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      recipientId: recipientData.id,
      recipientModel: recipientData.model,
      endpoint,
      keyP256dh: p256dh,
      keyAuth: auth,
      isActive: true,
      inactiveAt: null,
    },
    update: {
      recipientId: recipientData.id,
      recipientModel: recipientData.model,
      keyP256dh: p256dh,
      keyAuth: auth,
      isActive: true,
      inactiveAt: null,
    },
  });

  return formatPushSubscription(savedSubscription);
};

export const registerSubscriptionService = registerSubscriptionDb;

/**
 * Soft removes a subscription by marking it as inactive, OR hard deletes it if specified.
 * @param {String} endpoint - The subscription endpoint URL
 * @param {Boolean} hardDelete - Whether to hard delete the subscription
 * @returns {Promise<Object|null>} The updated/deleted document or null if not found
 */
export const removeSubscriptionDb = async (endpoint, hardDelete = false) => {
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint },
  });

  if (!existing) {
    return null;
  }

  if (hardDelete) {
    const deleted = await prisma.pushSubscription.delete({
      where: { endpoint },
    });
    return formatPushSubscription(deleted);
  } else {
    const updated = await prisma.pushSubscription.update({
      where: { endpoint },
      data: {
        isActive: false,
        inactiveAt: new Date(),
      },
    });
    return formatPushSubscription(updated);
  }
};

export const removeSubscriptionService = removeSubscriptionDb;

/**
 * Retrieves all active subscriptions for a specific recipient.
 * @param {String} recipientId - The ID of the recipient
 * @param {String} recipientModel - The Model of the recipient ('User', 'Student', 'Parent')
 * @returns {Promise<Array>} Array of active subscriptions { endpoint, keys }
 */
export const getActiveSubscriptionsDb = async (recipientId, recipientModel) => {
  const where = {
    recipientId,
    isActive: true,
  };

  if (recipientModel) {
    where.recipientModel = recipientModel;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where,
  });

  return subscriptions.map((sub) => ({
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keyP256dh,
      auth: sub.keyAuth,
    },
  }));
};

export const getActiveSubscriptionsService = getActiveSubscriptionsDb;

/**
 * Sends a push notification to all active subscriptions of a recipient.
 * @param {Object} recipient - { id, model }
 * @param {Object} payload - { title, body, icon, badge, data }
 * @returns {Promise<Object>} Summary of delivery
 */
export const sendPushNotification = async (recipient, payload) => {
  const activeSubscriptions = await getActiveSubscriptionsDb(recipient.id, recipient.model);

  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    return {
      success: false,
      totalSubscriptions: 0,
      successCount: 0,
      failedCount: 0,
      failures: [],
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

      if (
        statusCode === 401 ||
        statusCode === 404 ||
        statusCode === 410 ||
        (statusCode === 403 && error.body && error.body.includes("VAPID credentials"))
      ) {
        await removeSubscriptionDb(sub.endpoint, true).catch((e) =>
          console.error(`[PushService] Failed to clean up stale subscription: ${sub.endpoint}`, e.message)
        );
      }
    }
  });

  await Promise.allSettled(promises);

  return {
    success: true,
    totalSubscriptions: activeSubscriptions.length,
    successCount,
    failedCount,
    failures,
  };
};

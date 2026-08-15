import asyncHandler from '../../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../../utils/response.js';
import {
  registerSubscriptionService,
  removeSubscriptionService,
  getActiveSubscriptionsService,
  sendPushNotification
} from './push.service.js';

/**
 * Endpoint: POST /api/push/register
 * Registers a new web push subscription for the logged-in user.
 */
export const registerPushSubscription = asyncHandler(async (req, res) => {
  const subscription = req.body;
  let recipientModel = 'User';
  if (req.user.role === 'student') recipientModel = 'Student';
  if (req.user.role === 'parent') recipientModel = 'Parent';

  const recipient = {
    id: req.user.id || req.user._id,
    model: recipientModel,
  };

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return sendError(res, 400, 'Invalid subscription object provided');
  }

  const result = await registerSubscriptionService(recipient, subscription);

  return sendSuccess(res, 200, 'Push subscription registered successfully', result);
});

/**
 * Endpoint: DELETE /api/push/unregister
 * Unregisters a web push subscription.
 */
export const unregisterPushSubscription = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return sendError(res, 400, 'Endpoint is required to unregister subscription');
  }

  const result = await removeSubscriptionService(endpoint);

  if (!result) {
    return sendError(res, 404, 'Subscription not found');
  }

  return sendSuccess(res, 200, 'Push subscription unregistered successfully');
});

/**
 * Endpoint: GET /api/push/subscriptions
 * Retrieves all active push subscriptions for the logged-in user.
 */
export const getUserSubscriptions = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  let recipientModel = 'User';
  if (req.user.role === 'student') recipientModel = 'Student';
  if (req.user.role === 'parent') recipientModel = 'Parent';

  const subscriptions = await getActiveSubscriptionsService(userId, recipientModel);

  return sendSuccess(res, 200, 'Active subscriptions retrieved', subscriptions);
});


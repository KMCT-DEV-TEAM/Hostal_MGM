import api from '@/services/axios';
import { NOTIFICATION_ENDPOINTS } from '../constants/notification.constants';
import { urlBase64ToUint8Array } from '../utils/urlBase64ToUint8Array';
import { logger } from '../utils/logger';

/**
 * Registers the service worker.
 * @returns {Promise<ServiceWorkerRegistration>}
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser.');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    logger.error('Service Worker registration failed:', error);
    throw error;
  }
};

/**
 * Subscribes the user to Push Notifications.
 * @param {ServiceWorkerRegistration} registration 
 * @returns {Promise<PushSubscription>}
 */
export const subscribeToPush = async (registration) => {
  if (!registration || !registration.pushManager) {
    throw new Error('Push Manager is not available.');
  }

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    throw new Error('VAPID Public Key is missing.');
  }

  const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  return subscription;
};

/**
 * Sends the push subscription object to the backend for storage.
 * @param {PushSubscription} subscription 
 * @returns {Promise<void>}
 */
export const registerPushSubscription = async (subscription) => {
  try {
    const response = await api.post(NOTIFICATION_ENDPOINTS.REGISTER_SUBSCRIPTION, subscription);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // Already registered, which is fine
      return;
    }
    throw error;
  }
};

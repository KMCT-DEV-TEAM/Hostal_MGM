import { useState, useEffect, useCallback } from 'react';
import { NOTIFICATION_STATUS } from '../constants/notification.constants';
import {
  registerServiceWorker,
  subscribeToPush,
  registerPushSubscription,
} from '../services/notification.service';
import { logger } from '../utils/logger';

export const usePushNotification = () => {
  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const [permission, setPermission] = useState(
    isSupported ? Notification.permission : NOTIFICATION_STATUS.DENIED
  );
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Checks if a subscription already exists on the service worker
  const checkExistingSubscription = useCallback(async () => {
    if (!isSupported) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          setSubscription(existingSub);
        }
      }
    } catch (err) {
      logger.error('Failed to check existing subscription', err);
    }
  }, [isSupported]);

  useEffect(() => {
    if (permission === NOTIFICATION_STATUS.GRANTED) {
      checkExistingSubscription();
    }
  }, [permission, checkExistingSubscription]);

  const registerSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const registration = await registerServiceWorker();
      const newSubscription = await subscribeToPush(registration);
      
      setSubscription(newSubscription);
      
      // Send to backend
      await registerPushSubscription(newSubscription);
      logger.info('Successfully registered push subscription');
      
    } catch (err) {
      logger.error('Failed to register subscription', err);
      setError(err.message || 'Failed to register subscription');
    } finally {
      setLoading(false);
    }
  };

  const enableNotifications = async () => {
    if (!isSupported) {
      setError('Notifications are not supported by your browser');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // We only request permission if it's default
      if (Notification.permission === NOTIFICATION_STATUS.DEFAULT) {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);

        if (newPermission === NOTIFICATION_STATUS.GRANTED) {
          await registerSubscription();
        } else {
          logger.warn('User denied notification permissions');
        }
      } else if (Notification.permission === NOTIFICATION_STATUS.GRANTED) {
        await registerSubscription();
      } else {
        setPermission(NOTIFICATION_STATUS.DENIED);
      }
    } catch (err) {
      logger.error('Error enabling notifications', err);
      setError(err.message || 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    if (permission !== NOTIFICATION_STATUS.GRANTED) return;
    
    // In a real app, this might unsubscribe and resubscribe
    // or just forcefully sync the existing sub to the backend
    await registerSubscription();
  };

  return {
    permission,
    isSupported,
    loading,
    error,
    subscription,
    enableNotifications,
    registerSubscription,
    refreshSubscription,
  };
};

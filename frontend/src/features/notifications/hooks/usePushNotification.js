import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  registerServiceWorker,
  subscribeToPush,
  registerPushSubscription,
} from '../services/notification.service';
import { logger } from '../utils/logger';

export const PUSH_STATES = {
  UNSUPPORTED: 'UNSUPPORTED',
  WAITING_FOR_AUTH: 'WAITING_FOR_AUTH',
  DEFAULT_PERMISSION: 'DEFAULT_PERMISSION',
  REQUESTING_PERMISSION: 'REQUESTING_PERMISSION',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  CHECKING_SUBSCRIPTION: 'CHECKING_SUBSCRIPTION',
  NO_SUBSCRIPTION: 'NO_SUBSCRIPTION',
  CREATING_SUBSCRIPTION: 'CREATING_SUBSCRIPTION',
  SYNCING_BACKEND: 'SYNCING_BACKEND',
  READY: 'READY',
  SYNC_FAILED: 'SYNC_FAILED',
};

export const usePushNotification = () => {
  const { user, authenticated } = useAuthStore();
  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const [machineState, setMachineState] = useState(() => {
    if (!isSupported) return PUSH_STATES.UNSUPPORTED;
    return PUSH_STATES.WAITING_FOR_AUTH;
  });

  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  // Use a ref to prevent concurrent registration attempts
  const isProcessingRef = useRef(false);

  const determineInitialPermissionState = useCallback(() => {
    if (Notification.permission === 'granted') {
      setMachineState(PUSH_STATES.CHECKING_SUBSCRIPTION);
    } else if (Notification.permission === 'denied') {
      setMachineState(PUSH_STATES.PERMISSION_DENIED);
    } else {
      setMachineState(PUSH_STATES.DEFAULT_PERMISSION);
    }
  }, []);

  // 1. Auth Sync
  useEffect(() => {
    if (!isSupported) return;

    if (!authenticated || !user) {
      setMachineState(PUSH_STATES.WAITING_FOR_AUTH);
      return;
    }

    if (machineState === PUSH_STATES.WAITING_FOR_AUTH) {
      determineInitialPermissionState();
    }
  }, [authenticated, user, isSupported, machineState, determineInitialPermissionState]);

  // 2. Reacting to CHECKING_SUBSCRIPTION
  useEffect(() => {
    let mounted = true;

    const checkLocalSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        let existingSub = null;
        if (registration && registration.active) {
          existingSub = await registration.pushManager.getSubscription();
        }

        if (!mounted) return;

        if (existingSub) {
          setSubscription(existingSub);
          setMachineState(PUSH_STATES.SYNCING_BACKEND);
        } else {
          setMachineState(PUSH_STATES.NO_SUBSCRIPTION);
        }
      } catch (err) {
        logger.error('Failed to check local subscription', err);
        if (mounted) setMachineState(PUSH_STATES.NO_SUBSCRIPTION);
      }
    };

    if (machineState === PUSH_STATES.CHECKING_SUBSCRIPTION) {
      checkLocalSubscription();
    }

    return () => { mounted = false; };
  }, [machineState]);

  // 3. Reacting to NO_SUBSCRIPTION -> CREATING_SUBSCRIPTION
  useEffect(() => {
    if (machineState === PUSH_STATES.NO_SUBSCRIPTION) {
      setMachineState(PUSH_STATES.CREATING_SUBSCRIPTION);
    }
  }, [machineState]);

  // 4. Reacting to CREATING_SUBSCRIPTION
  useEffect(() => {
    let mounted = true;

    const createNewSubscription = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const registration = await registerServiceWorker();
        const newSub = await subscribeToPush(registration);
        
        if (!mounted) return;
        setSubscription(newSub);
        setMachineState(PUSH_STATES.SYNCING_BACKEND);
      } catch (err) {
        logger.error('Failed to create local subscription', err);
        if (mounted) {
          setError(err.message || 'Failed to create subscription');
          setMachineState(PUSH_STATES.SYNC_FAILED);
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    if (machineState === PUSH_STATES.CREATING_SUBSCRIPTION) {
      createNewSubscription();
    }

    return () => { mounted = false; };
  }, [machineState]);

  // 5. Reacting to SYNCING_BACKEND
  useEffect(() => {
    let mounted = true;

    const syncWithBackend = async () => {
      if (!subscription) return;
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        await registerPushSubscription(subscription);
        if (mounted) {
          logger.info('Successfully synced subscription with backend');
          setMachineState(PUSH_STATES.READY);
          setError(null);
        }
      } catch (err) {
        logger.error('Backend sync failed', err);
        if (mounted) {
          // If the backend says the sub is invalid, we should drop it and create a new one
          if (err.response && (err.response.status === 404 || err.response.status === 410 || err.response.status === 400)) {
            setSubscription(null);
            setMachineState(PUSH_STATES.NO_SUBSCRIPTION);
          } else {
            setError(err.message || 'Backend sync failed, will retry later.');
            setMachineState(PUSH_STATES.SYNC_FAILED);
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    if (machineState === PUSH_STATES.SYNCING_BACKEND) {
      syncWithBackend();
    }

    return () => { mounted = false; };
  }, [machineState, subscription]);

  // Expose an action to manually start the request permission flow
  const enableNotifications = async () => {
    if (machineState !== PUSH_STATES.DEFAULT_PERMISSION) return;

    try {
      setMachineState(PUSH_STATES.REQUESTING_PERMISSION);
      const newPermission = await Notification.requestPermission();
      
      if (newPermission === 'granted') {
        setMachineState(PUSH_STATES.CHECKING_SUBSCRIPTION);
      } else if (newPermission === 'denied') {
        setMachineState(PUSH_STATES.PERMISSION_DENIED);
      } else {
        setMachineState(PUSH_STATES.DEFAULT_PERMISSION);
      }
    } catch (err) {
      logger.error('Error requesting permission', err);
      setMachineState(PUSH_STATES.DEFAULT_PERMISSION);
    }
  };

  const retrySync = () => {
    if (machineState === PUSH_STATES.SYNC_FAILED) {
      if (subscription) {
        setMachineState(PUSH_STATES.SYNCING_BACKEND);
      } else {
        setMachineState(PUSH_STATES.CHECKING_SUBSCRIPTION);
      }
    }
  };

  return {
    machineState,
    isSupported,
    error,
    subscription,
    enableNotifications,
    retrySync,
  };
};

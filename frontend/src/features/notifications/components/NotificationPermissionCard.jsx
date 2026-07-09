import React, { useState, useEffect } from 'react';
import { usePushNotification, PUSH_STATES } from '../hooks/usePushNotification';

const DISMISSAL_KEY = 'notification_popup_dismissed';
// 7 days in ms
const DISMISSAL_EXPIRY = 7 * 24 * 60 * 60 * 1000;

const NotificationPermissionCard = () => {
  const { machineState, enableNotifications, retrySync, error } = usePushNotification();
  const [dismissed, setDismissed] = useState(true); // default true until we check localStorage
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSAL_KEY);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        if (Date.now() - timestamp < DISMISSAL_EXPIRY) {
          setDismissed(true);
        } else {
          // Expired, clear it and show
          localStorage.removeItem(DISMISSAL_KEY);
          setDismissed(false);
        }
      } else {
        setDismissed(false);
      }
    } catch (err) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
    } catch (e) {}
    setDismissed(true);
  };

  // 1. Show nothing if it's dismissed or we are in a state where we shouldn't show a popup
  if (dismissed) {
    // Optionally, we might want to still show PERMISSION_DENIED or SYNC_FAILED as a small banner 
    // even if dismissed, but for now we follow the instruction to hide the popup.
  }

  // 2. Denied State: Small banner explaining how to fix
  if (machineState === PUSH_STATES.PERMISSION_DENIED) {
    if (dismissed) return null; // let user dismiss the denied banner too
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow-lg animate-fade-in-down flex items-start">
          <span className="text-yellow-400 text-xl flex-shrink-0">⚠️</span>
          <div className="ml-3 flex-1">
            <p className="text-sm text-yellow-800 font-medium">Notifications Blocked</p>
            <p className="text-xs text-yellow-700 mt-1">
              Click the lock icon (🔒) in your browser's address bar to allow notifications.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="ml-2 text-yellow-600 hover:text-yellow-800 flex-shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // 3. Sync Failed State: Small banner with a retry button
  if (machineState === PUSH_STATES.SYNC_FAILED) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-red-400 text-xl flex-shrink-0">❌</span>
            <p className="ml-3 text-sm text-red-800">Failed to sync notifications.</p>
          </div>
          <button
            onClick={retrySync}
            className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 bg-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 4. Default State: The main popup
  if (machineState === PUSH_STATES.DEFAULT_PERMISSION && !dismissed) {
    const isLoading = machineState === PUSH_STATES.REQUESTING_PERMISSION;
    
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-6 py-6 text-center animate-fade-in-down">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner">
              🔔
            </div>
            
            <h3 className="text-lg font-bold text-gray-900">
              Stay Updated
            </h3>
            
            <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-sm">
              Enable notifications to instantly receive leave approvals, complaints updates, and important alerts even when closed.
            </p>

            <div className="mt-6 w-full flex flex-col items-center gap-3">
              <button
                onClick={enableNotifications}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-sm"
              >
                {isLoading ? 'Waiting for Browser...' : 'Enable Notifications'}
              </button>
              
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="text-sm font-medium text-gray-400 hover:text-gray-600 py-1 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NotificationPermissionCard;
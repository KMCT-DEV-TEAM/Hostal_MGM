import React from 'react';
import { NOTIFICATION_STATUS } from '../constants/notification.constants';
import { usePushNotification } from '../hooks/usePushNotification';

const NotificationPermissionCard = () => {
  const { permission, isSupported, enableNotifications, loading } = usePushNotification();
  const [dismissed, setDismissed] = React.useState(false);

  // If not supported or already granted, we don't need to show the card
  if (!isSupported || permission === NOTIFICATION_STATUS.GRANTED) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  if (permission === NOTIFICATION_STATUS.DENIED) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow-lg animate-fade-in-down">
          <div className="flex items-start">
            <span className="text-yellow-400 text-xl flex-shrink-0">⚠️</span>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-800">
                Notifications are blocked. Please enable them from your browser settings.
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
      </div>
    );
  }

  // DEFAULT permission state
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-6 py-6 text-center animate-fade-in-down">
        <div className="flex flex-col items-center">
          <span className="text-3xl mb-2" role="img" aria-label="bell">
            🔔
          </span>

          <h3 className="text-base font-semibold text-gray-900">
            Enable Notifications
          </h3>

          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Stay informed with important updates from the Hostel Management
            System, even when this tab is closed.
          </p>

          <div className="mt-5 w-full flex flex-col items-center gap-2">
            <button
              onClick={enableNotifications}
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </button>

            <button
              onClick={() => setDismissed(true)}
              disabled={loading}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 py-1.5 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionCard;
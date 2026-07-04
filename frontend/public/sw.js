self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const DEFAULT_NOTIFICATION_OPTIONS = {
  icon: "/vite.svg",
  badge: "/vite.svg",
  requireInteraction: false,
  silent: false
};

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'New Notification';

    // Merge DEFAULT_NOTIFICATION_OPTIONS with incoming payload
    const options = {
      ...DEFAULT_NOTIFICATION_OPTIONS,
      body: payload.body || 'You have a new message.',
      data: payload.data || { url: '/' }
    };

    if (payload.image) {
      options.image = payload.image;
    }

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error processing push event:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find an existing application window
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          matchingClient = client;
          break;
        }
      }

      if (matchingClient) {
        // Focus the existing window and navigate if needed
        matchingClient.focus();
        if (matchingClient.url !== urlToOpen) {
          matchingClient.navigate(urlToOpen);
        }
        return matchingClient;
      }

      // Otherwise, open a new browser tab.
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

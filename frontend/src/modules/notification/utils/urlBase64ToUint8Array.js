/**
 * Converts a URL-safe Base64 string to a Uint8Array.
 * Required for converting the VAPID public key before passing it to PushManager.subscribe().
 *
 * @param {string} base64String The URL-safe Base64 encoded VAPID public key.
 * @returns {Uint8Array} The converted Uint8Array.
 */
export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

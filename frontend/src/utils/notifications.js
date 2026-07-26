/** Ask notification dropdowns / admin alerts to reload after a mutating API call. */
export function refreshNotifications() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('notifications-changed'));
  }
}

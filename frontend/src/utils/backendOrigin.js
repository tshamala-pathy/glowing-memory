/**
 * Resolve the Django API origin for Axios, media URLs, and admin links.
 *
 * Priority:
 * 1. ``REACT_APP_BACKEND_URL`` at build time (recommended for split API/frontend hosts)
 * 2. Browser same-origin when not on localhost (nginx single-domain deploy)
 * 3. ``http://localhost:8000`` for local development
 */
export function getBackendOrigin() {
  const configured = process.env.REACT_APP_BACKEND_URL;
  if (configured && configured.trim()) {
    return configured.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return origin;
    }
  }
  return 'http://localhost:8000';
}

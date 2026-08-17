/**
 * Resolve the Django API origin for Axios, media URLs, and admin links.
 *
 * Priority:
 * 1. ``REACT_APP_BACKEND_URL`` at build time (split API/frontend hosts)
 * 2. CRA dev server (localhost:3000/3001/3002) → ``http://localhost:8000``
 * 3. Same-origin (nginx production, including ``http://localhost/``)
 * 4. ``http://localhost:8000`` when ``window`` is unavailable
 */
export function getBackendOrigin() {
  const configured = process.env.REACT_APP_BACKEND_URL;
  if (configured && configured.trim()) {
    return configured.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, origin, port } = window.location;
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';
    const isCraDevPort = port === '3000' || port === '3001' || port === '3002';
    if (isLoopback && isCraDevPort) {
      return 'http://localhost:8000';
    }
    if (origin) {
      return origin;
    }
  }
  return 'http://localhost:8000';
}

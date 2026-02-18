import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute Component
 *
 * Route-level access control:
 * - requireAuth: Unauthenticated users are redirected to /login
 * - requireSuperuser: Non-superusers are redirected to /profile
 *
 * Authenticated users can: view profile, history, private projects, invoices.
 * Unauthenticated users: see only public pages; redirected to login when
 * accessing profile routes.
 *
 * Backend APIs also enforce auth and return 401/403 for protected endpoints.
 */
const ProtectedRoute = ({ children, requireAuth = false, requireSuperuser = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading state while authentication status is being determined
  // Prevents flash of content before redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not authenticated
  // Security: Backend will also enforce authentication; this avoids exposing protected content
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to profile if superuser access is required but user lacks permissions
  // Superuser check requires both authentication AND is_superuser flag to be true
  if (requireSuperuser && (!isAuthenticated || !user || user.is_superuser !== true)) {
    return <Navigate to="/profile" replace />;
  }

  // Access granted - render the protected children
  return children;
};

export default ProtectedRoute;


import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * A wrapper component that provides route-level access control.
 * Prevents unauthorized users from accessing protected routes by:
 * - Checking authentication status
 * - Verifying user permissions (superuser status)
 * - Redirecting unauthorized users to appropriate pages
 * 
 * @param {React.ReactNode} children - The component(s) to render if access is granted
 * @param {boolean} requireAuth - If true, user must be authenticated to access
 * @param {boolean} requireSuperuser - If true, user must be authenticated AND be a superuser
 * @returns {React.ReactNode} Protected component or redirect
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
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if superuser access is required but user lacks permissions
  // Superuser check requires both authentication AND is_superuser flag to be true
  if (requireSuperuser && (!isAuthenticated || !user || user.is_superuser !== true)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Access granted - render the protected children
  return children;
};

export default ProtectedRoute;


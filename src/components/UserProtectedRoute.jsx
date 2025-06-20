// components/UserProtectedRoute.jsx (Simple Version)
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './ui/LoadingSpinner';
import { useAuth } from '../constants/AuthContext';

const UserProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Ensure auth status is checked when component mounts
    if (!initialCheckDone) {
      checkAuthStatus().finally(() => {
        setInitialCheckDone(true);
      });
    }
  }, [checkAuthStatus, initialCheckDone]);

  // Show loading spinner while checking authentication
  if (isLoading || !initialCheckDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to home with login prompt if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, showLogin: true }} replace />;
  }

  // Render protected component if authenticated
  return children;
};

export default UserProtectedRoute;
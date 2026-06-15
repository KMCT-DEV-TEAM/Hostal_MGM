import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

const ProtectedRoute = ({ children, redirectTo = '/user/login' }) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a Spinner component
  }

  if (!user) {
    // Redirect them to the login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

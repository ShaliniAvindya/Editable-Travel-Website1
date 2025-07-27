import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, setRedirectPath, loading } = useContext(AuthContext);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
    }
    if (!user && location.pathname.startsWith('/admin')) {
      setRedirectPath('/admin');
    }
  }, [loading, location, setRedirectPath, user]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but not admin, redirect to home
  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Allow access for admin users
  return children;
}

export default ProtectedRoute;

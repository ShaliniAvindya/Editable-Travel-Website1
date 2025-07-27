import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

const API_URL = 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState(null);
  const navigate = useNavigate();
  const inactivityTimeout = 5 * 60 * 1000; 
  let inactivityTimer = null;

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    if (user && user.isAdmin) {
      inactivityTimer = setTimeout(() => {
        logout('Your session has timed out due to inactivity.', true);
      }, inactivityTimeout);
    }
  };

  // Handle user activity to reset timer
  useEffect(() => {
    if (user && user.isAdmin) {
      const handleActivity = () => resetInactivityTimer();

      // Add event listeners for user activity
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('keydown', handleActivity);

      // Start the timer
      resetInactivityTimer();

      // Cleanup event listeners and timer
      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
      };
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      api
        .get('/api/users/me')
        .then((response) => {
          setUser(response.data);
          if (response.data.isAdmin && redirectPath) {
            navigate(redirectPath);
            setRedirectPath(null);
          }
        })
        .catch((error) => {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
          delete api.defaults.headers['Authorization'];
          setUser(null);
          navigate('/login'); 
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [navigate, redirectPath]);

  const login = async ({ token, user }) => {
    localStorage.setItem('token', token);
    api.defaults.headers['Authorization'] = `Bearer ${token}`;
    setUser(user);
    if (user.isAdmin) {
      navigate('/admin');
    }
  };

  const logout = (message, isTimeout = false) => {
    setUser(null);
    setRedirectPath(null);
    localStorage.removeItem('token');
    delete api.defaults.headers['Authorization'];
    if (isTimeout) {
      navigate('/login', { state: { message: message || 'Your session has timed out due to inactivity.' } });
    } else {
      navigate('/login', { state: { message: message || 'You have been logged out.' } });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, redirectPath, setRedirectPath, api }}>
      {children}
    </AuthContext.Provider>
  );
};
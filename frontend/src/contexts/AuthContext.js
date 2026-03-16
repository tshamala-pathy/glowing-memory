/**
 * AuthContext — Manages authentication state (user, login, register, logout).
 * Uses GET /api/users/profile/ for lightweight user data (not /api/profile/).
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/profile/');
      const userData = response.data;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user:', error);
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/09dda989-d72c-43d8-8020-eb55e586cb02', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'c877e1',
          },
          body: JSON.stringify({
            sessionId: 'c877e1',
            location: 'AuthContext.js:fetchUser',
            message: 'fetchUser failed; clearing tokens',
            data: {
              status: error.response?.status || null,
              path: '/users/profile/',
            },
            timestamp: Date.now(),
            hypothesisId: 'HFETCH',
          }),
        }).catch(() => {});
      } catch (_) {
        // ignore logging failures
      }
      // #endregion
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login/', { email, password });
      const { access, refresh, user: loginUser } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Use user from login response so all authenticated users (admin and non-admin) succeed.
      // Do not call fetchUser() here: it clears tokens on any error and would break login
      // when GET /users/profile/ fails (e.g. for some users or envs).
      if (loginUser) {
        setUser(loginUser);
      }
      return { success: true, user: loginUser };
    } catch (error) {
      // Handle different error formats
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.email?.[0] ||
                          error.response?.data?.password?.[0] ||
                          error.response?.data?.non_field_errors?.[0] ||
                          'Login failed';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/users/register/', userData);
      const { access, refresh, user: registerUser } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      if (registerUser) {
        setUser(registerUser);
      }
      return { success: true, user: registerUser };
    } catch (error) {
      // Handle different error formats from Django
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.email?.[0] ||
                          error.response?.data?.password?.[0] ||
                          error.response?.data?.first_name?.[0] ||
                          error.response?.data?.last_name?.[0] ||
                          (typeof error.response?.data === 'object' && 
                           Object.values(error.response.data).flat().join(', ')) ||
                          'Registration failed';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/profile/');
      setUser(res.data);
      return res.data;
    } catch (e) {
      console.error('Error refreshing user:', e);
      return null;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    refreshUser,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

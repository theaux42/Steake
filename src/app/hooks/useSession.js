import { useState, useEffect, useCallback } from 'react';

export function useSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  const checkSession = useCallback(async () => {
    console.log('Checking JWT session...');
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Include httpOnly cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('JWT session check successful:', data.user.username);
        setUser(data.user);
        return data.user;
      } else {
        console.log('JWT session check failed:', response.status);
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('JWT session check error:', error);
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (username, password) => {
    console.log('Attempting login for:', username);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Login successful, setting user:', data.user.username);
        setUser(data.user);
        // Force a session check to ensure JWT token is properly set
        setTimeout(() => checkSession(), 50);
        return { success: true, user: data.user };
      } else {
        console.log('Login failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [checkSession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user even if logout request fails
      setUser(null);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        // Force a session check to ensure everything is in sync
        setTimeout(() => checkSession(), 50);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [checkSession]);

  // Check session on mount
  useEffect(() => {
    if (!sessionChecked) {
      checkSession().finally(() => {
        setLoading(false);
        setSessionChecked(true);
      });
    }
  }, [checkSession, sessionChecked]);

  // Set up periodic session renewal (every 30 minutes)
  useEffect(() => {
    if (user && sessionChecked) {
      const interval = setInterval(() => {
        checkSession();
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [user, sessionChecked, checkSession]);

  return {
    user,
    loading,
    login,
    logout,
    register,
    checkSession,
    refreshSession: checkSession, // Alias for manual refresh
  };
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '../components/Dashboard';
import AdminPanel from '../components/AdminPanel';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        console.log('User not authenticated, redirecting to home...');
        setRedirecting(true);
        router.replace('/');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setRedirecting(true);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      setRedirecting(true);
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setRedirecting(true);
      router.replace('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-bold">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Conditionally render AdminPanel for admin users or Dashboard for regular users
  return user.isAdmin ? 
    <AdminPanel user={user} onLogout={handleLogout} /> : 
    <Dashboard user={user} onLogout={handleLogout} />;
}

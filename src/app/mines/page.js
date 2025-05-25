'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MinesGame from '../components/MinesGame';

export default function MinesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      
      if (data.authenticated) {
        setUser(data.user);
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceUpdate = (newBalance) => {
    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  const handleBackToGames = () => {
    router.replace('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-bold">Loading Mines...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Game Header */}
      <header className="glass border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Game Title */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold text-white">Steake</h1>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                  <span className="text-white text-xl">💎</span>
                </div>
                <h2 className="text-lg font-bold text-white">Mines</h2>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToGames}
                className="text-secondary hover:text-white px-3 py-2 rounded-lg hover:bg-gray-700/30 transition-all duration-300"
              >
                ← Back to Games
              </button>
              <span className="text-secondary text-sm">Welcome, {user.username}</span>
              <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2">
                <span className="text-secondary text-sm">Balance:</span>
                <span className="text-white font-bold" style={{ color: 'var(--accent)' }}>
                  ${parseFloat(user.balance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Game Content */}
      <main className="container mx-auto px-6 py-8">
        <MinesGame 
          user={user} 
          onBalanceUpdate={handleBalanceUpdate}
        />
      </main>
    </div>
  );
}

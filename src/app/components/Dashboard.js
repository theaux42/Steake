'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('games');
  
  const headerRef = useRef(null);
  const navRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    // GSAP animations on mount
    const tl = gsap.timeline();
    
    tl.fromTo(headerRef.current, 
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    )
    .fromTo(navRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      "-=0.3"
    )
    .fromTo(contentRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.2"
    );
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header ref={headerRef} className="glass border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Steake</h1>
                  <p className="text-secondary text-sm">Welcome back, {user.username}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="card flex items-center space-x-3 py-2 px-4">
                <span className="text-secondary text-sm">Balance:</span>
                <span className="text-white font-bold text-lg" style={{ color: 'var(--accent)' }}>
                  ${parseFloat(user.balance).toFixed(2)}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav ref={navRef} className="glass border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('games')}
              className={`py-4 px-2 border-b-2 transition-all duration-300 font-medium ${
                activeTab === 'games'
                  ? 'text-white'
                  : 'text-secondary hover:text-white'
              }`}
              style={{ borderBottomColor: activeTab === 'games' ? 'var(--accent)' : 'transparent' }}
            >
              Games
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 border-b-2 transition-all duration-300 font-medium ${
                activeTab === 'history'
                  ? 'text-white'
                  : 'text-secondary hover:text-white'
              }`}
              style={{ borderBottomColor: activeTab === 'history' ? 'var(--accent)' : 'transparent' }}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 border-b-2 transition-all duration-300 font-medium ${
                activeTab === 'profile'
                  ? 'text-white'
                  : 'text-secondary hover:text-white'
              }`}
              style={{ borderBottomColor: activeTab === 'profile' ? 'var(--accent)' : 'transparent' }}
            >
              Profile
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main ref={contentRef} className="container mx-auto px-6 py-8">
        {activeTab === 'games' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Casino Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Game Cards */}
              <div className="card text-center hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' }}>
                  <span className="text-white text-2xl">🎰</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Slots</h3>
                <p className="text-secondary text-sm mb-4">Try your luck with our slot machines</p>
                <button className="btn-primary w-full" disabled>
                  Coming Soon
                </button>
              </div>

              <div className="card text-center hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}>
                  <span className="text-white text-2xl">🃏</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Blackjack</h3>
                <p className="text-secondary text-sm mb-4">Beat the dealer in classic blackjack</p>
                <button className="btn-primary w-full" disabled>
                  Coming Soon
                </button>
              </div>

              <div className="card text-center hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
                  <span className="text-white text-2xl">🎲</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Dice</h3>
                <p className="text-secondary text-sm mb-4">Roll the dice and win big</p>
                <button className="btn-primary w-full" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Transaction History</h2>
            <div className="card">
              <p className="text-secondary text-center py-8">
                No transactions yet. Start playing to see your history here!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Profile Information</h2>
            
            <div className="card mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Account Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary">Username:</span>
                  <span className="text-white font-medium">{user.username}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary">Email:</span>
                  <span className="text-white font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary">Balance:</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                    ${parseFloat(user.balance).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary">Account Type:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.isAdmin ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {user.isAdmin ? 'Administrator' : 'Player'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                  <p className="text-secondary text-sm">Total Games</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                  <p className="text-secondary text-sm">Total Wagered</p>
                  <p className="text-2xl font-bold text-white">$0.00</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

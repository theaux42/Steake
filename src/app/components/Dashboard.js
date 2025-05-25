'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('games');
  const [currentUser, setCurrentUser] = useState(user);
  const [transactions, setTransactions] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  // Handle balance updates from games
  const handleBalanceUpdate = (newBalance) => {
    setCurrentUser(prev => ({ ...prev, balance: newBalance }));
    // Refresh transaction history when balance updates
    if (activeTab === 'history') {
      fetchTransactionHistory();
    }
  };

  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/transactions?userId=${currentUser.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions || []);
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history when history tab is activated
  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactionHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    // GSAP animations on mount
    const tl = gsap.timeline();
    
    tl.fromTo(headerRef.current, 
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    )
    .fromTo(contentRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.2"
    );
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Compact Header/Navigation */}
      <header ref={headerRef} className="glass border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold text-white">Steake</h1>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('games')}
                  className={`py-2 px-3 rounded-lg transition-all duration-300 font-medium ${
                    activeTab === 'games'
                      ? 'text-white bg-blue-600/20 border border-blue-500/30'
                      : 'text-secondary hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  Games
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2 px-3 rounded-lg transition-all duration-300 font-medium ${
                    activeTab === 'history'
                      ? 'text-white bg-blue-600/20 border border-blue-500/30'
                      : 'text-secondary hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-3 rounded-lg transition-all duration-300 font-medium ${
                    activeTab === 'profile'
                      ? 'text-white bg-blue-600/20 border border-blue-500/30'
                      : 'text-secondary hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  Profile
                </button>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <span className="text-secondary text-sm">Welcome, {user.username}</span>
              <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2">
                <span className="text-secondary text-sm">Balance:</span>
                <span className="text-white font-bold" style={{ color: 'var(--accent)' }}>
                  ${parseFloat(currentUser.balance).toFixed(2)}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-secondary hover:text-white px-3 py-2 rounded-lg hover:bg-gray-700/30 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

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
                <button 
                  className="btn-primary w-full"
                  onClick={() => router.push('/blackjack')}
                >
                  Play Now
                </button>
              </div>

              <div className="card text-center hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
                  <span className="text-white text-2xl">🎲</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Dice</h3>
                <p className="text-secondary text-sm mb-4">Roll the dice and win big</p>
                <button 
                  className="btn-primary w-full"
                  onClick={() => router.push('/dice')}
                >
                  Play Now
                </button>
              </div>

              <div className="card text-center hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                  <span className="text-white text-2xl">💎</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Mines</h3>
                <p className="text-secondary text-sm mb-4">Find gems while avoiding mines</p>
                <button 
                  className="btn-primary w-full"
                  onClick={() => router.push('/mines')}
                >
                  Play Now
                </button>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Transaction History</h2>
            
            {loading ? (
              <div className="card text-center py-8">
                <p className="text-secondary">Loading...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recent Games */}
                {games.length > 0 && (
                  <div className="card">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Games</h3>
                    <div className="space-y-3">
                      {games.slice(0, 10).map((game) => {
                        const gameResult = JSON.parse(game.result || '{}');
                        const profit = game.win_amount - game.bet_amount;
                        
                        return (
                          <div key={game.id} className="flex justify-between items-center p-3 rounded-lg bg-black/20">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">
                                {game.game_type === 'dice' ? '🎲' : 
                                 game.game_type === 'mines' ? '💎' : 
                                 game.game_type === 'blackjack' ? '🃏' : '🎰'}
                              </span>
                              <div>
                                <p className="text-white font-medium">
                                  {game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)} Game
                                </p>
                                <p className="text-secondary text-sm">
                                  {game.game_type === 'dice' && gameResult.diceValue && (
                                    `Rolled ${gameResult.diceValue}, ${gameResult.prediction} than ${gameResult.targetNumber}`
                                  )}
                                  {game.game_type === 'mines' && gameResult.gemsFound !== undefined && (
                                    `Found ${gameResult.gemsFound} gems, ${gameResult.minesCount} mines on field`
                                  )}
                                  {game.game_type === 'blackjack' && gameResult.playerTotal && (
                                    `Player: ${gameResult.playerTotal}, Dealer: ${gameResult.dealerTotal || 'Hidden'}`
                                  )}
                                </p>
                                <p className="text-secondary text-xs">
                                  {new Date(game.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-secondary text-sm">Bet: ${game.bet_amount}</p>
                              <p className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Transactions */}
                {transactions.length > 0 && (
                  <div className="card">
                    <h3 className="text-xl font-bold text-white mb-4">All Transactions</h3>
                    <div className="space-y-2">
                      {transactions.slice(0, 20).map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                          <div>
                            <p className="text-white font-medium capitalize">
                              {transaction.type}
                            </p>
                            <p className="text-secondary text-sm">
                              {transaction.description}
                            </p>
                            <p className="text-secondary text-xs">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {games.length === 0 && transactions.length === 0 && (
                  <div className="card">
                    <p className="text-secondary text-center py-8">
                      No transactions yet. Start playing to see your history here!
                    </p>
                  </div>
                )}
              </div>
            )}
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
                  <span className="text-white font-medium">{currentUser.username}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary">Email:</span>
                  <span className="text-white font-medium">{currentUser.email}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary">Balance:</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                    ${parseFloat(currentUser.balance).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary">Account Type:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentUser.is_admin ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {currentUser.is_admin ? 'Administrator' : 'Player'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                  <p className="text-secondary text-sm">Total Games</p>
                  <p className="text-2xl font-bold text-white">{games.length}</p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                  <p className="text-secondary text-sm">Total Wagered</p>
                  <p className="text-2xl font-bold text-white">
                    ${games.reduce((sum, game) => sum + parseFloat(game.bet_amount), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

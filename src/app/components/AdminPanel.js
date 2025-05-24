'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function AdminPanel({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [addBalanceForm, setAddBalanceForm] = useState({ username: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserDetails = async (username) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/user-data?username=${username}`);
      const data = await response.json();
      if (response.ok) {
        setUserDetails(data);
        setSelectedUser(username);
      } else {
        setMessage(data.error || 'Error fetching user details');
      }
    } catch (error) {
      setMessage('Error fetching user details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/add-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addBalanceForm),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Successfully added $${addBalanceForm.amount} to ${addBalanceForm.username}'s account`);
        setAddBalanceForm({ username: '', amount: '' });
        fetchUsers(); // Refresh users list
        
        // If this user's details are currently displayed, refresh them
        if (selectedUser === addBalanceForm.username) {
          fetchUserDetails(addBalanceForm.username);
        }
      } else {
        setMessage(data.error || 'Error adding balance');
      }
    } catch (error) {
      setMessage('Error adding balance');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
                  <h1 className="text-2xl font-bold text-white">Steake Admin</h1>
                  <p className="text-secondary text-sm">Administrator Dashboard</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                ADMIN
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-secondary">
                Welcome, <span className="text-white font-semibold">{user.username}</span>
              </span>
              <button
                onClick={onLogout}
                className="btn-secondary bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-300"
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
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 transition-all duration-300 font-medium ${
                activeTab === 'users'
                  ? 'text-white'
                  : 'text-secondary hover:text-white'
              }`}
              style={{ borderBottomColor: activeTab === 'users' ? 'var(--accent)' : 'transparent' }}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`py-4 px-2 border-b-2 transition-all duration-300 font-medium ${
                activeTab === 'balance'
                  ? 'text-white'
                  : 'text-secondary hover:text-white'
              }`}
              style={{ borderBottomColor: activeTab === 'balance' ? 'var(--accent)' : 'transparent' }}
            >
              Add Balance
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main ref={contentRef} className="container mx-auto px-6 py-8">
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl border ${
            message.includes('Successfully') || message.includes('successful')
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {message}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-8">User Management</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Users List */}
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">All Users</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-700/30 hover:border-blue-500/30 transition-all cursor-pointer hover:scale-[1.02]"
                      style={{ background: 'var(--card-bg)' }}
                      onClick={() => fetchUserDetails(user.username)}
                    >
                      <div>
                        <div className="text-white font-medium">{user.username}</div>
                        <div className="text-secondary text-sm">{user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: 'var(--accent)' }}>${parseFloat(user.balance).toFixed(2)}</div>
                        <div className="text-secondary text-xs">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Details */}
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">User Details</h3>
                {loading ? (
                  <div className="text-center text-secondary py-8">Loading...</div>
                ) : userDetails ? (
                  <div className="space-y-4">
                    <div className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                      <h4 className="text-lg font-semibold text-white mb-2">Profile</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-secondary">Username:</span>
                          <span className="text-white">{userDetails.user.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Email:</span>
                          <span className="text-white">{userDetails.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Balance:</span>
                          <span className="font-bold" style={{ color: 'var(--accent)' }}>${parseFloat(userDetails.user.balance).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                      <h4 className="text-lg font-semibold text-white mb-2">Statistics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-secondary">Total Games:</span>
                          <span className="text-white">{userDetails.pnl.totalGames}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Total Wagered:</span>
                          <span className="text-white">${parseFloat(userDetails.pnl.totalWagered).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Total Winnings:</span>
                          <span className="text-white">${parseFloat(userDetails.pnl.totalWinnings).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">P&L:</span>
                          <span className={`font-bold ${parseFloat(userDetails.pnl.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${parseFloat(userDetails.pnl.totalPnL).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Recent Transactions</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {userDetails.transactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex justify-between text-sm">
                            <span className="text-secondary">{transaction.type}</span>
                            <span className="text-white">${parseFloat(transaction.amount).toFixed(2)}</span>
                          </div>
                        ))}
                        {userDetails.transactions.length === 0 && (
                          <div className="text-secondary text-sm">No transactions found</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-secondary py-8">
                    Select a user to view their details
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Add Balance to User</h2>
            
            <div className="card">
              <form onSubmit={handleAddBalance} className="space-y-4">
                <div>
                  <label className="block text-secondary text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={addBalanceForm.username}
                    onChange={(e) => setAddBalanceForm({ ...addBalanceForm, username: e.target.value })}
                    className="input"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-secondary text-sm font-medium mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={addBalanceForm.amount}
                    onChange={(e) => setAddBalanceForm({ ...addBalanceForm, amount: e.target.value })}
                    className="input"
                    placeholder="Enter amount"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Balance...' : 'Add Balance'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

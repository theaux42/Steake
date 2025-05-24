'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function LoginForm({ onLogin, onToggleRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    // GSAP animations on mount
    const tl = gsap.timeline();
    
    tl.fromTo(containerRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
    .fromTo(logoRef.current,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
      "-=0.4"
    )
    .fromTo(formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.3"
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLogin(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div ref={logoRef} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'var(--accent)' }}>
            <span className="text-2xl font-bold text-white">S</span>
          </div>
        </div>

        {/* Form */}
        <div ref={formRef} className="card">
          {error && (
            <div className="mb-6 p-4 rounded-lg border error-shake" style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderColor: 'var(--error)',
              color: 'var(--error)' 
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner w-5 h-5 mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {onToggleRegister && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onToggleRegister}
                className="text-accent hover:text-accent-hover transition-colors"
              >
                Don't have an account? Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadingRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    // GSAP animation for loading screen
    if (loadingRef.current) {
      gsap.fromTo(loadingRef.current, 
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [loading]);

  useEffect(() => {
    // Landing page animations
    if (!loading && !user) {
      const tl = gsap.timeline();
      
      // Hero animations
      tl.fromTo(heroRef.current, 
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
      );

      // Features animations with ScrollTrigger
      gsap.fromTo(featuresRef.current?.children || [], 
        { opacity: 0, y: 80, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Stats counter animation
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.children,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // CTA section animation
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Subtle parallax effect for background elements
      gsap.to(".parallax-slow", {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: ".parallax-slow",
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    }
  }, [loading, user]);

  useEffect(() => {
    // Check if user is already logged in (check session)
    const checkSession = async () => {
      try {
        // Since we're using httpOnly cookies, we can't access them directly
        // We'll implement a session check endpoint if needed
        setLoading(false);
      } catch (error) {
        console.error('Session check error:', error);
        setLoading(false);
      }
    };

    checkSession();

    // Add keyboard shortcuts
    const handleKeyDown = (e) => {
      // Escape key to close modals
      if (e.key === 'Escape') {
        setShowLogin(false);
        setShowRegister(false);
      }
      // Ctrl/Cmd + L for login
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setShowLogin(true);
      }
      // Ctrl/Cmd + R for register
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        setShowRegister(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div ref={loadingRef} className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-white text-xl font-medium">Loading Steake...</div>
          <div className="text-secondary text-sm mt-2">Preparing your gaming experience</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen fade-in" style={{ background: 'var(--background)' }}>
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 glass border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 hover:scale-105 transition-transform cursor-pointer">
                <div className="w-10 h-10 rounded-full flex items-center justify-center glow-on-hover" style={{ background: 'var(--accent)' }}>
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <h1 className="text-xl font-bold text-white">Steake</h1>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowLogin(true)}
                  className="btn-secondary glow-on-hover"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="btn-primary glow-on-hover"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section ref={heroRef} className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse glow-on-hover parallax-slow" style={{ background: 'var(--accent)' }}></div>
            <div className="absolute -bottom-40 -left-40 w-60 h-60 rounded-full opacity-10 animate-pulse glow-on-hover parallax-slow" style={{ background: 'var(--accent)', animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 animate-spin" style={{ background: 'linear-gradient(45deg, var(--accent), transparent)', animationDuration: '20s' }}></div>
            
            {/* Particle Effects */}
            <div className="particle" style={{ left: '10%' }}></div>
            <div className="particle" style={{ left: '20%' }}></div>
            <div className="particle" style={{ left: '40%' }}></div>
            <div className="particle" style={{ left: '60%' }}></div>
            <div className="particle" style={{ left: '80%' }}></div>
          </div>

          <div className="container mx-auto px-6 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight hero-title">
                The Future of
                <span className="block gradient-text">Online Gaming</span>
              </h1>
              <p className="text-xl md:text-2xl text-secondary mb-8 max-w-2xl mx-auto hero-subtitle">
                Experience cutting-edge casino games with blockchain technology, 
                provably fair gaming, and instant payouts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowRegister(true)}
                  className="btn-primary text-lg px-8 py-4 hover:scale-105 transition-transform glow-on-hover"
                >
                  Start Playing Now
                </button>
                <button 
                  onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary text-lg px-8 py-4 hover:scale-105 transition-transform glow-on-hover"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="scroll-indicator">
            <div className="flex flex-col items-center text-white/60">
              <span className="text-sm mb-2">Scroll to explore</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="animate-pulse">
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Floating Cards Animation */}
          <div className="absolute top-1/4 left-10 animate-float">
            <div className="w-16 h-24 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--accent), #1e40af)' }}>
              <div className="p-2 text-white text-xs">♠</div>
            </div>
          </div>
          <div className="absolute top-1/3 right-10 animate-float" style={{ animationDelay: '1s' }}>
            <div className="w-16 h-24 rounded-lg" style={{ background: 'linear-gradient(135deg, #ef4444, var(--accent))' }}>
              <div className="p-2 text-white text-xs">♥</div>
            </div>
          </div>
          <div className="absolute bottom-1/4 left-20 animate-float" style={{ animationDelay: '2s' }}>
            <div className="w-16 h-24 rounded-lg" style={{ background: 'linear-gradient(135deg, #10b981, var(--accent))' }}>
              <div className="p-2 text-white text-xs">♣</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Why Choose Steake?
              </h2>
              <p className="text-xl text-secondary max-w-2xl mx-auto">
                Advanced technology meets classic gaming in our revolutionary platform
              </p>
            </div>
            
            <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card card-depth text-center hover:scale-105 transition-transform group">
                <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, var(--accent), #3b82f6)' }}>
                  <span className="text-white text-2xl">🔒</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Provably Fair</h3>
                <p className="text-secondary">
                  Blockchain-verified random number generation ensures every game is completely fair and transparent.
                </p>
              </div>

              <div className="card card-depth text-center hover:scale-105 transition-transform group">
                <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #10b981, var(--accent))' }}>
                  <span className="text-white text-2xl">⚡</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Instant Payouts</h3>
                <p className="text-secondary">
                  Lightning-fast withdrawals powered by smart contracts. Get your winnings in seconds, not days.
                </p>
              </div>

              <div className="card card-depth text-center hover:scale-105 transition-transform group">
                <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #f59e0b, var(--accent))' }}>
                  <span className="text-white text-2xl">🎮</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Premium Games</h3>
                <p className="text-secondary">
                  Exclusive collection of high-quality games designed for the ultimate gaming experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="py-20" style={{ background: 'linear-gradient(135deg, rgba(0, 178, 255, 0.1), rgba(0, 178, 255, 0.05))' }}>
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--accent)' }}>$2.5M+</div>
                <div className="text-secondary mt-2">Total Winnings</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--accent)' }}>50K+</div>
                <div className="text-secondary mt-2">Active Players</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--accent)' }}>99.9%</div>
                <div className="text-secondary mt-2">Uptime</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--accent)' }}>24/7</div>
                <div className="text-secondary mt-2">Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section ref={ctaRef} className="py-20">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Win Big?
              </h2>
              <p className="text-xl text-secondary mb-8">
                Join thousands of players already winning on Steake. 
                Sign up now and get your welcome bonus!
              </p>
              <button
                onClick={() => setShowRegister(true)}
                className="btn-primary text-xl px-12 py-4 hover:scale-105 transition-transform glow-on-hover"
              >
                Join Now - Get Bonus
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="glass border-t py-8" style={{ borderColor: 'var(--border)' }}>
          <div className="container mx-auto px-6 text-center">
            <p className="text-secondary text-sm">&copy; 2025 Steake Casino. Play responsibly. 18+</p>
            <p className="text-secondary text-xs mt-2">
              Keyboard shortcuts: <kbd className="px-1 py-0.5 bg-card rounded text-xs">Ctrl+L</kbd> Login • 
              <kbd className="px-1 py-0.5 bg-card rounded text-xs ml-1">Ctrl+R</kbd> Register • 
              <kbd className="px-1 py-0.5 bg-card rounded text-xs ml-1">Esc</kbd> Close
            </p>
          </div>
        </footer>

        {/* Login Popup */}
        {showLogin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
            <div className="relative max-w-md w-full modal-enter">
              <button
                onClick={() => setShowLogin(false)}
                className="absolute -top-4 -right-4 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-red-500/20 transition-colors z-10 glow-on-hover"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              >
                ✕
              </button>
              <LoginForm 
                onLogin={handleLogin} 
                onToggleRegister={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Register Popup */}
        {showRegister && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
            <div className="relative max-w-md w-full modal-enter">
              <button
                onClick={() => setShowRegister(false)}
                className="absolute -top-4 -right-4 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-red-500/20 transition-colors z-10 glow-on-hover"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              >
                ✕
              </button>
              <RegisterForm 
                onSuccess={() => setShowRegister(false)}
                onToggleLogin={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {user.isAdmin ? (
        <AdminPanel user={user} onLogout={handleLogout} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

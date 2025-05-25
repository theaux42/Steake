'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function DiceGame({ user, onBalanceUpdate }) {
  const [betAmount, setBetAmount] = useState(1);
  const [prediction, setPrediction] = useState('higher'); // 'higher', 'lower'
  const [targetNumber, setTargetNumber] = useState(50);
  const [diceValue, setDiceValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [message, setMessage] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);

  const diceRef = useRef(null);
  const resultRef = useRef(null);
  const sliderRef = useRef(null);
  const sliderHandleRef = useRef(null);
  const progressBarRef = useRef(null);
  const confettiRef = useRef(null);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf([diceRef.current, sliderHandleRef.current, progressBarRef.current, resultRef.current]);
    };
  }, []);

  // Multipliers based on probability
  const getMultiplier = () => {
    const winChance = prediction === 'higher' ? (100 - targetNumber) / 100 : targetNumber / 100;
    return Math.max(1.1, (0.98 / winChance)); // House edge of 2%
  };

  const rollDice = async () => {
    if (betAmount > user.balance) {
      setMessage('Insufficient balance!');
      return;
    }

    if (betAmount <= 0) {
      setMessage('Please enter a valid bet amount!');
      return;
    }

    setIsRolling(true);
    setMessage('');
    setGameResult(null);

    // Kill any existing animations first
    gsap.killTweensOf([diceRef.current, sliderHandleRef.current, progressBarRef.current, resultRef.current]);

    // Simple pulse animation for dice
    if (diceRef.current) {
      gsap.to(diceRef.current, {
        scale: 1.05,
        duration: 0.3,
        yoyo: true,
        repeat: 3,
        ease: "power2.inOut"
      });
    }

    try {
      const response = await fetch('/api/games/dice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          betAmount: parseFloat(betAmount),
          prediction,
          targetNumber: parseInt(targetNumber)
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Animate the dice result with faster, smoother animation
        setTimeout(() => {
          animateToResult(result.diceValue);
          setGameResult(result);
          setWinAmount(result.winAmount);
          
          if (result.won) {
            setMessage(`🎉 You won $${result.winAmount.toFixed(2)}!`);
            
            // Trigger confetti for big wins (5x bet or more)
            if (result.winAmount >= betAmount * 5) {
              setTimeout(() => createConfetti(), 300);
            }
            
            // Quick win animation
            if (resultRef.current) {
              gsap.fromTo(resultRef.current, 
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
              );
            }
          } else {
            setMessage(`😔 You lost $${betAmount}. Better luck next time!`);
          }
          
          // Update balance in parent component
          onBalanceUpdate(result.newBalance);
          
          // Add to game history
          setGameHistory(prev => [{
            diceValue: result.diceValue,
            won: result.won,
            winAmount: result.winAmount,
            betAmount: parseFloat(betAmount),
            prediction,
            targetNumber: parseInt(targetNumber),
            timestamp: new Date()
          }, ...prev.slice(0, 9)]); // Keep last 10 games
          
          setIsRolling(false);
        }, 800); // Reduced from 1500ms to 800ms
      } else {
        setMessage(result.error || 'An error occurred');
        setIsRolling(false);
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
      setIsRolling(false);
    }
  };

  const animateToResult = (finalValue) => {
    // Much faster and smoother number animation
    let counter = { value: Math.floor(Math.random() * 100) + 1 };
    
    // Single smooth animation to final value
    gsap.to(counter, {
      value: finalValue,
      duration: 0.6, // Reduced from 2 seconds to 0.6 seconds
      ease: "power2.out",
      onUpdate: function() {
        setDiceValue(Math.floor(counter.value));
      },
      onComplete: function() {
        setDiceValue(finalValue);
        // Immediate slider animation
        animateSlider(finalValue);
      }
    });

    // Subtle glow effect during animation
    if (diceRef.current) {
      gsap.to(diceRef.current, {
        boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
        duration: 0.6,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }
  };

  const animateSlider = (value) => {
    const percentage = value;
    
    // Kill any existing slider animations
    gsap.killTweensOf([progressBarRef.current, sliderHandleRef.current]);
    
    // Instant update for immediate visual feedback
    if (progressBarRef.current && sliderHandleRef.current) {
      gsap.set(progressBarRef.current, { width: `${percentage}%` });
      gsap.set(sliderHandleRef.current, { left: `${percentage}%` });
      
      // Quick highlight effect to show the result
      gsap.to(sliderHandleRef.current, {
        scale: 1.2,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });

      // Add glow effect to the winning side
      if (sliderRef.current) {
        const won = gameResult?.won;
        const glowColor = won 
          ? (prediction === 'higher' && value > targetNumber) || (prediction === 'lower' && value < targetNumber)
            ? 'rgba(34, 197, 94, 0.8)' // Green glow for win
            : 'rgba(239, 68, 68, 0.8)'  // Red glow for loss
          : 'rgba(239, 68, 68, 0.8)';

        gsap.to(sliderRef.current, {
          boxShadow: `0 0 20px ${glowColor}`,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    }
  };

  const createConfetti = () => {
    if (!confettiRef.current) return;
    
    const confettiContainer = confettiRef.current;
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = '50%';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '-10px';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '1000';
      
      confettiContainer.appendChild(confetti);
      
      gsap.to(confetti, {
        y: window.innerHeight + 100,
        x: (Math.random() - 0.5) * 200,
        rotation: Math.random() * 360,
        duration: Math.random() * 3 + 2,
        ease: "power2.out",
        onComplete: () => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }
      });
    }
  };

  const getDiceDisplay = (value) => {
    return value || '?';
  };

  const getWinChance = () => {
    if (prediction === 'higher') {
      return ((100 - targetNumber) / 100 * 100).toFixed(1);
    } else {
      return (targetNumber / 100 * 100).toFixed(1);
    }
  };

  const getPotentialWin = () => {
    return (betAmount * getMultiplier()).toFixed(2);
  };

  const handleSliderChange = (e) => {
    setTargetNumber(parseInt(e.target.value));
  };

  const handleSliderStart = () => {
    setIsUserInteracting(true);
  };

  const handleSliderEnd = () => {
    setIsUserInteracting(false);
  };

  useEffect(() => {
    // Initial animation
    if (diceRef.current) {
      gsap.fromTo(diceRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" }
      );
    }

    // Initialize slider position
    if (sliderHandleRef.current && progressBarRef.current) {
      gsap.set(sliderHandleRef.current, { left: `${targetNumber}%` });
      gsap.set(progressBarRef.current, { width: `${targetNumber}%` });
    }
  }, []);

  useEffect(() => {
    // Update slider position when target number changes, but NOT during user interaction
    if (sliderHandleRef.current && progressBarRef.current && !isRolling && !isUserInteracting) {
      gsap.to(sliderHandleRef.current, {
        left: `${targetNumber}%`,
        duration: 0.2, // Faster animation
        ease: "power2.out"
      });
      gsap.to(progressBarRef.current, {
        width: `${targetNumber}%`,
        duration: 0.2, // Faster animation
        ease: "power2.out"
      });
    }
  }, [targetNumber, isRolling, isUserInteracting]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf([diceRef.current, sliderHandleRef.current, progressBarRef.current, resultRef.current]);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Confetti Container */}
      <div ref={confettiRef} className="fixed inset-0 pointer-events-none z-50" />
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">🎲 Dice Game</h2>
        <p className="text-secondary">Roll the dice (1-100) and predict the outcome to win!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Area */}
        <div className="card text-center">
          <h3 className="text-xl font-bold text-white mb-6">Roll the Dice (1-100)</h3>
          
          {/* Dice Display */}
          <div className="mb-8">
            <div 
              ref={diceRef}
              className="w-32 h-32 mx-auto mb-6 rounded-xl flex items-center justify-center text-4xl font-bold text-white"
              style={{ 
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
              }}
            >
              {getDiceDisplay(diceValue)}
            </div>

            {/* Horizontal Slider */}
            <div className="mb-6">
              <div 
                ref={sliderRef}
                className="relative w-full h-16 rounded-lg overflow-hidden" 
                style={{ background: 'linear-gradient(90deg, #ef4444 0%, #22c55e 100%)' }}
              >
                {/* Target Line */}
                <div 
                  className="absolute top-0 w-1 h-full bg-white shadow-lg z-10"
                  style={{ left: `${targetNumber}%`, transform: 'translateX(-50%)' }}
                />
                
                {/* Progress Bar */}
                <div 
                  ref={progressBarRef}
                  className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-300"
                  style={{ width: `${targetNumber}%` }}
                />
                
                {/* Slider Handle */}
                <div 
                  ref={sliderHandleRef}
                  className="absolute top-1/2 w-6 h-6 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 z-20"
                  style={{ left: `${targetNumber}%` }}
                />
                
                {/* Result indicator (only shown during/after roll) */}
                {diceValue && (
                  <div 
                    className="absolute top-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 z-30 animate-pulse"
                    style={{ left: `${diceValue}%` }}
                  />
                )}
                
                {/* Labels */}
                <div className="absolute bottom-1 left-2 text-white text-xs font-bold">1</div>
                <div className="absolute bottom-1 right-2 text-white text-xs font-bold">100</div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold">
                  Target: {targetNumber}
                </div>
                {diceValue && (
                  <div 
                    className="absolute bottom-1 text-yellow-200 text-xs font-bold transform -translate-x-1/2"
                    style={{ left: `${diceValue}%` }}
                  >
                    {diceValue}
                  </div>
                )}
              </div>
              
              {/* Color Legend */}
              <div className="flex justify-between mt-2 text-sm">
                <span className={`font-medium ${prediction === 'lower' ? 'text-red-400' : 'text-red-400/60'}`}>
                  ← Lower (Red Side)
                </span>
                <span className={`font-medium ${prediction === 'higher' ? 'text-green-400' : 'text-green-400/60'}`}>
                  Higher (Green Side) →
                </span>
              </div>
            </div>
            
            {diceValue && !isRolling && (
              <div ref={resultRef} className="space-y-2">
                <p className="text-white text-lg font-bold">
                  Result: {diceValue}
                </p>
                {gameResult && (
                  <div className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    gameResult.won 
                      ? 'bg-green-500/20 text-green-300 animate-pulse' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {gameResult.won ? '🎉 WIN! 🎉' : '💔 LOSE'}
                  </div>
                )}
                {gameResult?.won && winAmount >= betAmount * 3 && (
                  <div className="text-yellow-400 font-bold animate-bounce text-lg">
                    🌟 BIG WIN! 🌟
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg font-medium ${
              message.includes('won') || message.includes('🎉')
                ? 'bg-green-500/20 text-green-300'
                : message.includes('lost') || message.includes('😔')
                ? 'bg-red-500/20 text-red-300'
                : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              {message}
            </div>
          )}

          {/* Roll Button */}
          <button
            onClick={rollDice}
            disabled={isRolling}
            className="btn-primary w-full text-lg font-bold"
            style={{ 
              opacity: isRolling ? 0.6 : 1,
              cursor: isRolling ? 'not-allowed' : 'pointer'
            }}
          >
            {isRolling ? 'Rolling...' : 'Roll Dice 🎲'}
          </button>
        </div>

        {/* Betting Panel */}
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-6">Place Your Bet</h3>
          
          {/* Bet Amount */}
          <div className="mb-6">
            <label className="block text-secondary text-sm font-medium mb-2">
              Bet Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="0.01"
                max={user.balance}
                step="0.01"
                disabled={isRolling}
                className="w-full bg-black/20 border border-gray-600 rounded-lg px-4 py-3 text-white font-medium focus:border-accent focus:outline-none"
                placeholder="Enter bet amount"
              />
              <span className="absolute right-3 top-3 text-secondary">$</span>
            </div>
            <p className="text-xs text-secondary mt-1">
              Available balance: ${parseFloat(user.balance).toFixed(2)}
            </p>
            
            {/* Quick Bet Buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setBetAmount(1)}
                disabled={isRolling}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                $1
              </button>
              <button
                onClick={() => setBetAmount(5)}
                disabled={isRolling}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                $5
              </button>
              <button
                onClick={() => setBetAmount(10)}
                disabled={isRolling}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                $10
              </button>
              <button
                onClick={() => setBetAmount(Math.floor(user.balance / 2))}
                disabled={isRolling || user.balance < 2}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                Half
              </button>
              <button
                onClick={() => setBetAmount(Math.floor(user.balance))}
                disabled={isRolling || user.balance < 1}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          {/* Prediction Type */}
          <div className="mb-6">
            <label className="block text-secondary text-sm font-medium mb-3">
              Prediction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPrediction('lower')}
                disabled={isRolling}
                className={`py-4 px-4 rounded-lg font-medium transition-all ${
                  prediction === 'lower'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500/20 text-red-300 hover:bg-red-500/40'
                }`}
              >
                <span className="block text-lg">🔻</span>
                <span className="block text-sm">Lower</span>
                <span className="block text-xs">Red Side</span>
              </button>
              <button
                onClick={() => setPrediction('higher')}
                disabled={isRolling}
                className={`py-4 px-4 rounded-lg font-medium transition-all ${
                  prediction === 'higher'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-500/20 text-green-300 hover:bg-green-500/40'
                }`}
              >
                <span className="block text-lg">🔺</span>
                <span className="block text-sm">Higher</span>
                <span className="block text-xs">Green Side</span>
              </button>
            </div>
          </div>

          {/* Target Number Slider */}
          <div className="mb-6">
            <label className="block text-secondary text-sm font-medium mb-2">
              Target Number: <span className="text-white font-bold">{targetNumber}</span>
            </label>
            <input
              type="range"
              min="1"
              max="99"
              value={targetNumber}
              onChange={handleSliderChange}
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
              disabled={isRolling}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #ef4444 0%, #ef4444 ${targetNumber}%, #22c55e ${targetNumber}%, #22c55e 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-secondary mt-1">
              <span>1</span>
              <span>99</span>
            </div>
            <p className="text-xs text-secondary mt-2">
              {prediction === 'higher' && `Win if result > ${targetNumber} (Green side)`}
              {prediction === 'lower' && `Win if result < ${targetNumber} (Red side)`}
            </p>
          </div>

          {/* Game Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-t border-gray-600">
              <span className="text-secondary">Win Chance:</span>
              <span className="text-white font-medium">{getWinChance()}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-secondary">Multiplier:</span>
              <span className="text-white font-medium">{getMultiplier().toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-secondary">Potential Win:</span>
              <span className="font-bold" style={{ color: 'var(--accent)' }}>
                ${getPotentialWin()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game History */}
      {gameHistory.length > 0 && (
        <div className="mt-8 card">
          <h3 className="text-lg font-bold text-white mb-4">Recent Games</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {gameHistory.map((game, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg text-center transition-all duration-300 ${
                  game.won 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                <div className="text-2xl font-bold text-white mb-1">
                  {game.diceValue}
                </div>
                <div className={`text-xs font-medium ${
                  game.won ? 'text-green-400' : 'text-red-400'
                }`}>
                  {game.won ? `+$${game.winAmount.toFixed(2)}` : `-$${game.betAmount.toFixed(2)}`}
                </div>
                <div className="text-xs text-secondary">
                  {game.prediction} {game.targetNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function MinesGame({ user, onBalanceUpdate }) {
  const [betAmount, setBetAmount] = useState(10.00);
  const [gameMode, setGameMode] = useState('Manual'); // 'Manual' or 'Auto'
  const [minesCount, setMinesCount] = useState(3);
  const [gemsFound, setGemsFound] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [totalProfit, setTotalProfit] = useState(0.00);
  const [gameState, setGameState] = useState('betting'); // 'betting', 'playing', 'finished'
  const [grid, setGrid] = useState(Array(25).fill(null)); // null = unrevealed, 'gem' = safe, 'mine' = bomb
  const [minePositions, setMinePositions] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const gridRef = useRef(null);
  const cashoutRef = useRef(null);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf([gridRef.current, cashoutRef.current]);
    };
  }, []);

  // Calculate multiplier based on gems found and mines count
  const calculateMultiplier = (gems, mines) => {
    if (gems === 0) return 1.00;
    
    // More balanced multiplier calculation
    const safeSpaces = 25 - mines;
    let multiplier = 1.0;
    
    // Each gem found increases multiplier based on remaining safe spaces
    for (let i = 0; i < gems; i++) {
      const remainingSafe = safeSpaces - i;
      const remainingTotal = 25 - mines - i;
      // More conservative multiplier growth
      multiplier *= 1 + (mines / remainingTotal) * 0.8;
    }
    
    return Math.round(multiplier * 100) / 100; // Round to 2 decimal places
  };

  // Start new game
  const startGame = async () => {
    if (betAmount <= 0 || betAmount > user.balance) {
      setMessage('Invalid bet amount!');
      return;
    }

    setIsAnimating(true);
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/games/mines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          betAmount: parseFloat(betAmount),
          action: 'start',
          minesCount
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setGameState('playing');
        setGemsFound(0);
        setMultiplier(1.00);
        setTotalProfit(0.00);
        setGrid(Array(25).fill(null));
        setMinePositions(result.minePositions);
        
        // Update balance
        onBalanceUpdate(result.newBalance);
      } else {
        setMessage(result.error || 'Failed to start game');
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      setMessage('Failed to start game');
    } finally {
      setIsAnimating(false);
      setLoading(false);
    }
  };

  // Handle tile click
  const handleTileClick = async (index) => {
    if (gameState !== 'playing' || isAnimating || loading || grid[index] !== null) return;

    setIsAnimating(true);

    const newGrid = [...grid];
    
    if (minePositions.includes(index)) {
      // Hit a mine - game over
      newGrid[index] = 'mine';
      setGrid(newGrid);
      setGameState('finished');
      setMessage('BOOM! You hit a mine!');
      animateExplosion(index);

      // Call API to record the loss
      try {
        const response = await fetch('/api/games/mines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            betAmount: parseFloat(betAmount),
            action: 'explode',
            gameData: {
              gemsFound,
              minesCount
            }
          }),
        });
      } catch (error) {
        console.error('Failed to record mine hit:', error);
      }
      
      // Reveal all mines after a short delay
      setTimeout(() => {
        const finalGrid = [...newGrid];
        minePositions.forEach(pos => {
          if (pos !== index) finalGrid[pos] = 'mine';
        });
        setGrid(finalGrid);
      }, 500);
    } else {
      // Found a gem
      newGrid[index] = 'gem';
      setGrid(newGrid);
      
      const newGemsFound = gemsFound + 1;
      setGemsFound(newGemsFound);
      
      const newMultiplier = calculateMultiplier(newGemsFound, minesCount);
      setMultiplier(newMultiplier);
      setTotalProfit(betAmount * newMultiplier - betAmount);
      
      animateGemReveal(index);
      animateCashoutButton();
    }

    setIsAnimating(false);
  };

  // Pick random safe tile
  const pickRandomTile = () => {
    if (gameState !== 'playing' || isAnimating) return;

    const availableTiles = [];
    for (let i = 0; i < 25; i++) {
      if (grid[i] === null && !minePositions.includes(i)) {
        availableTiles.push(i);
      }
    }

    if (availableTiles.length > 0) {
      const randomIndex = availableTiles[Math.floor(Math.random() * availableTiles.length)];
      handleTileClick(randomIndex);
    }
  };

  // Cashout
  const cashout = async () => {
    if (gameState !== 'playing' || gemsFound === 0) return;

    setIsAnimating(true);
    setLoading(true);

    try {
      const response = await fetch('/api/games/mines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          betAmount: parseFloat(betAmount),
          action: 'cashout',
          gameData: {
            gemsFound,
            minesCount,
            multiplier
          }
        }),
      });

      const result = await response.json();
      if (response.ok) {
        onBalanceUpdate(result.newBalance);
        setGameState('finished');
        setMessage(`Cashed out for $${result.winAmount.toFixed(2)}!`);
        animateCashoutSuccess();
      } else {
        setMessage(result.error || 'Failed to cashout');
      }
    } catch (error) {
      console.error('Failed to cashout:', error);
      setMessage('Failed to cashout');
    } finally {
      setIsAnimating(false);
      setLoading(false);
    }
  };

  // New game
  const newGame = () => {
    setGameState('betting');
    setGrid(Array(25).fill(null));
    setGemsFound(0);
    setMultiplier(1.00);
    setTotalProfit(0.00);
    setMinePositions([]);
    setMessage('');
  };

  // Animation functions
  const animateGemReveal = (index) => {
    if (gridRef.current) {
      const tile = gridRef.current.children[index];
      if (tile) {
        gsap.fromTo(tile,
          { scale: 1 },
          { scale: 1.1, duration: 0.2, ease: "back.out(1.7)", yoyo: true, repeat: 1 }
        );
        
        const gem = tile.querySelector('.gem');
        if (gem) {
          gsap.fromTo(gem,
            { scale: 0, opacity: 0, rotation: -180 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.4, ease: "back.out(1.7)" }
          );
        }
      }
    }
  };

  const animateExplosion = (index) => {
    if (gridRef.current) {
      const tile = gridRef.current.children[index];
      if (tile) {
        gsap.to(tile, {
          scale: 1.2,
          backgroundColor: '#ef4444',
          duration: 0.3,
          ease: "power2.out"
        });
      }
    }
  };

  const animateCashoutButton = () => {
    if (cashoutRef.current && gemsFound > 0) {
      gsap.fromTo(cashoutRef.current,
        { scale: 1, boxShadow: '0 0 0 rgba(34, 197, 94, 0.5)' },
        { scale: 1.02, boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)', duration: 0.3, yoyo: true, repeat: 1 }
      );
    }
  };

  const animateCashoutSuccess = () => {
    if (cashoutRef.current) {
      gsap.to(cashoutRef.current, {
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out",
        yoyo: true,
        repeat: 3
      });
    }
  };

  // Bet adjustment functions
  const halveBet = () => {
    const newAmount = Math.max(0.01, betAmount / 2);
    setBetAmount(Math.round(newAmount * 100) / 100);
  };

  const doubleBet = () => {
    const newAmount = Math.min(user.balance, betAmount * 2);
    setBetAmount(Math.round(newAmount * 100) / 100);
  };

  return (
    <div className="flex h-4/5  justify-center">
      {/* Left Control Panel */}
      <div className="w-56 bg-gray-800 p-4 flex flex-col space-y-4">

        {/* Bet Amount */}
        <div className="space-y-2">
          <div className="text-white text-sm font-medium">Bet Amount</div>
          <input
            type="number"
            value={betAmount.toFixed(2)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setBetAmount(Math.max(0, Math.round(value * 100) / 100));
            }}
            min="0.01"
            max={user.balance}
            step="0.01"
            className="w-full px-2 py-1.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            disabled={loading || gameState === 'playing'}
          />
          
          <div className="flex space-x-1">
            <button
              onClick={halveBet}
              disabled={loading || gameState === 'playing'}
              className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              ½
            </button>
            <button
              onClick={doubleBet}
              disabled={loading || gameState === 'playing'}
              className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              2×
            </button>
          </div>
        </div>

        {/* Mines and Gems */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="text-white text-sm font-medium block mb-1">Mines</label>
            <input
              type="number"
              value={minesCount}
              onChange={(e) => setMinesCount(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
              min="1"
              max="24"
              className="w-full px-2 py-1.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              disabled={loading || gameState === 'playing'}
            />
          </div>
          <div className="flex-1">
            <label className="text-white text-sm font-medium block mb-1">Gems</label>
            <input
              type="number"
              value={gemsFound}
              readOnly
              className="w-full px-2 py-1.5 bg-gray-600 text-gray-300 rounded-lg border border-gray-600 cursor-not-allowed text-sm"
            />
          </div>
        </div>

        {/* Total Profit */}
        <div className="space-y-1">
          <div className="text-white text-sm font-medium">
            Total profit ({multiplier.toFixed(2)}x)
          </div>
          <div className="text-white text-lg font-bold">
            ${totalProfit.toFixed(2)}
          </div>
        </div>

        {/* Pick Random Tile Button */}
        <button
          onClick={pickRandomTile}
          disabled={loading || gameState !== 'playing' || isAnimating}
          className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-sm"
        >
          Pick random tile
        </button>

        {/* Cashout Button */}
        <button
          ref={cashoutRef}
          onClick={cashout}
          disabled={loading || gameState !== 'playing' || gemsFound === 0}
          className={`w-full py-3 text-white text-lg font-bold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
            gameState === 'playing' && gemsFound > 0
              ? 'bg-green-600 hover:bg-green-500 border-2 border-green-500'
              : 'bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {loading ? 'Processing...' : 'Cashout'}
        </button>

        {/* Start/New Game Button */}
        <button
          onClick={gameState === 'betting' ? startGame : newGame}
          disabled={loading || isAnimating || (gameState === 'betting' && (betAmount <= 0 || betAmount > user.balance))}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-sm"
        >
          {loading ? 'Loading...' : gameState === 'betting' ? 'Start Game' : 'New Game'}
        </button>
      </div>

      {/* Main Game Grid */}
      <div className="flex flex-col items-center justify-center p-3" style={{ width: 'min(70vh, 70vw)' }}>
        {/* 5x5 Grid Container */}
        <div className="relative w-full h-full" style={{ aspectRatio: '1' }}>
          {/* 5x5 Grid */}
          <div 
            ref={gridRef}
            className={`grid grid-cols-5 gap-1.5 bg-gray-800 p-2 rounded-xl w-full h-full ${
              gameState !== 'playing' ? 'opacity-50' : ''
            }`}
            style={{ gridTemplateRows: 'repeat(5, 1fr)' }}
          >
            {grid.map((tile, index) => (
              <div
                key={index}
                onClick={() => handleTileClick(index)}
                className={`rounded-lg flex items-center justify-center transition-all duration-200 border-2 ${
                  tile === null 
                    ? gameState === 'playing' 
                      ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer hover:scale-105 border-gray-600 hover:border-gray-500' 
                      : 'bg-gray-800 cursor-not-allowed border-gray-700'
                    : tile === 'gem'
                    ? 'bg-green-600 border-green-500'
                    : 'bg-red-600 border-red-500'
                } ${gameState !== 'playing' ? 'pointer-events-none' : ''}`}
                style={{ aspectRatio: '1' }}
              >
                {tile === 'gem' && (
                  <div className="gem text-green-200 font-bold drop-shadow-lg" style={{ fontSize: 'min(2.5rem, 6vw, 6vh)' }}>
                    ♦
                  </div>
                )}
                {tile === 'mine' && (
                  <div className="text-white font-bold drop-shadow-lg" style={{ fontSize: 'min(2rem, 5vw, 5vh)' }}>
                    💣
                  </div>
                )}
                {tile === null && gameState !== 'playing' && (
                  <div className="text-gray-600" style={{ fontSize: 'min(1.5rem, 4vw, 4vh)' }}>
                    ?
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Game State Overlay */}
          {gameState === 'betting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <div className="text-center">
                <div className="text-white text-xl font-bold mb-2">💎 MINES 💎</div>
                <div className="text-gray-300 text-base">Set your bet and click "Start Game"</div>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <div className="text-center">
                <div className="text-white text-xl font-bold mb-2">Game Over</div>
                <div className="text-gray-300 text-base">Click "New Game" to play again</div>
              </div>
            </div>
          )}

          {/* Messages Overlay - Centered on grid */}
          {message && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
              <div className={`text-center p-4 rounded-lg text-lg font-bold max-w-xs ${
                message.includes('BOOM') 
                  ? 'bg-red-500/90 text-white border-2 border-red-400'
                  : message.includes('Cashed out')
                  ? 'bg-green-500/90 text-white border-2 border-green-400'
                  : 'bg-blue-500/90 text-white border-2 border-blue-400'
              }`}>
                {message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

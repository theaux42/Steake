'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function BlackjackGame({ user, onBalanceUpdate }) {
  const [betAmount, setBetAmount] = useState(0.14);
  const [gameState, setGameState] = useState('betting'); // 'betting', 'playing', 'finished'
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const [message, setMessage] = useState('');
  const [showDealerHoleCard, setShowDealerHoleCard] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [doubleDownAvailable, setDoubleDownAvailable] = useState(false);
  const [canSplit, setCanSplit] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);

  const cardContainerRef = useRef(null);
  const playerCardsRef = useRef(null);
  const dealerCardsRef = useRef(null);
  const playerTotalRef = useRef(null);
  const dealerTotalRef = useRef(null);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf([cardContainerRef.current, playerCardsRef.current, dealerCardsRef.current]);
    };
  }, []);

  // Calculate hand total with ace handling
  const calculateTotal = (cards) => {
    let total = 0;
    let aces = 0;

    cards.forEach(card => {
      if (card.value === 'A') {
        total += 11;
        aces++;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        total += 10;
      } else {
        total += parseInt(card.value);
      }
    });

    // Handle aces (convert from 11 to 1 if needed)
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  };

  // API functions
  const dealInitialCards = async () => {
    if (betAmount > user.balance || betAmount <= 0) {
      setMessage('Invalid bet amount!');
      return;
    }

    setIsAnimating(true);
    setMessage('');
    setGameResult(null);
    setShowDealerHoleCard(false);

    try {
      const response = await fetch('/api/games/blackjack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          betAmount: parseFloat(betAmount),
          action: 'deal'
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setPlayerCards(result.playerCards);
        setDealerCards(result.dealerCards);
        setPlayerTotal(result.playerTotal);
        setDealerTotal(result.dealerTotal);
        setGameState('playing');
        setDoubleDownAvailable(result.playerCards.length === 2);
        setCanSplit(result.playerCards.length === 2 && result.playerCards[0].value === result.playerCards[1].value);

        // Animate cards appearing
        animateCardDealing(result.playerCards, result.dealerCards);

        if (result.gameOver) {
          setTimeout(() => finishGame(result), 1500);
        }
      } else {
        setMessage(result.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
    } finally {
      setIsAnimating(false);
    }
  };

  const hit = async () => {
    if (gameState !== 'playing' || isAnimating) return;
    setIsAnimating(true);
    setDoubleDownAvailable(false);

    try {
      const response = await fetch('/api/games/blackjack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'hit' }),
      });

      const result = await response.json();
      if (response.ok) {
        setPlayerCards(result.playerCards);
        setPlayerTotal(result.playerTotal);
        animateNewCard('player');
        animatePlayerTotal(result.playerTotal);

        if (result.gameOver) {
          setTimeout(() => finishGame(result), 800);
        }
      } else {
        setMessage(result.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
    } finally {
      setIsAnimating(false);
    }
  };

  const stand = async () => {
    if (gameState !== 'playing' || isAnimating) return;
    setIsAnimating(true);
    setShowDealerHoleCard(true);

    try {
      const response = await fetch('/api/games/blackjack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'stand' }),
      });

      const result = await response.json();
      if (response.ok) {
        setDealerCards(result.dealerCards);
        setDealerTotal(result.dealerTotal);

        if (result.dealerCards.length > 2) {
          animateDealerCards(result.dealerCards.slice(2));
        }

        setTimeout(() => finishGame(result), 1000);
      } else {
        setMessage(result.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
    } finally {
      setIsAnimating(false);
    }
  };

  const doubleDown = async () => {
    if (gameState !== 'playing' || isAnimating || !doubleDownAvailable) return;
    setIsAnimating(true);

    try {
      const response = await fetch('/api/games/blackjack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'double' }),
      });

      const result = await response.json();
      if (response.ok) {
        setBetAmount(prev => prev * 2);
        setPlayerCards(result.playerCards);
        setPlayerTotal(result.playerTotal);
        setDealerCards(result.dealerCards);
        setDealerTotal(result.dealerTotal);
        setShowDealerHoleCard(true);

        animateNewCard('player');
        setTimeout(() => finishGame(result), 1500);
      } else {
        setMessage(result.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
    } finally {
      setIsAnimating(false);
    }
  };

  const finishGame = (result) => {
    setGameState('finished');
    setGameResult(result);
    setShowDealerHoleCard(true);

    // Update balance
    onBalanceUpdate(result.newBalance);

    // Add to game history
    setGameHistory(prev => [{
      playerCards: result.playerCards,
      dealerCards: result.dealerCards,
      playerTotal: result.playerTotal,
      dealerTotal: result.dealerTotal,
      result: result.result,
      winAmount: result.winAmount || 0,
      betAmount: parseFloat(betAmount),
      timestamp: new Date()
    }, ...prev.slice(0, 9)]);

    // Animate card borders based on result
    animateCardBorders(result.result);
  };

  const newGame = () => {
    setGameState('betting');
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerTotal(0);
    setDealerTotal(0);
    setGameResult(null);
    setMessage('');
    setShowDealerHoleCard(false);
    setDoubleDownAvailable(false);
    setCanSplit(false);
    setBetAmount(0.14);
  };

  // Animation functions
  const animateCardDealing = (playerCards, dealerCards) => {
    playerCards.forEach((_, index) => {
      setTimeout(() => {
        if (playerCardsRef.current) {
          const cardElement = playerCardsRef.current.children[index];
          if (cardElement) {
            gsap.fromTo(cardElement,
              { scale: 0, opacity: 0, rotationY: 180 },
              { scale: 1, opacity: 1, rotationY: 0, duration: 0.6, ease: "back.out(1.7)" }
            );
          }
        }
      }, index * 200);
    });

    dealerCards.forEach((_, index) => {
      setTimeout(() => {
        if (dealerCardsRef.current) {
          const cardElement = dealerCardsRef.current.children[index];
          if (cardElement) {
            gsap.fromTo(cardElement,
              { scale: 0, opacity: 0, rotationY: 180 },
              { scale: 1, opacity: 1, rotationY: 0, duration: 0.6, ease: "back.out(1.7)" }
            );
          }
        }
      }, (index + playerCards.length) * 200);
    });
  };

  const animateNewCard = (target) => {
    const ref = target === 'player' ? playerCardsRef : dealerCardsRef;
    if (ref.current) {
      const lastCard = ref.current.lastElementChild;
      if (lastCard) {
        gsap.fromTo(lastCard,
          { scale: 0, opacity: 0, rotationY: 180 },
          { scale: 1, opacity: 1, rotationY: 0, duration: 0.6, ease: "back.out(1.7)" }
        );
      }
    }
  };

  const animateDealerCards = (newCards) => {
    newCards.forEach((_, index) => {
      setTimeout(() => {
        if (dealerCardsRef.current) {
          const cardIndex = dealerCards.length - newCards.length + index;
          const cardElement = dealerCardsRef.current.children[cardIndex];
          if (cardElement) {
            gsap.fromTo(cardElement,
              { scale: 0, opacity: 0, rotationY: 180 },
              { scale: 1, opacity: 1, rotationY: 0, duration: 0.6, ease: "back.out(1.7)" }
            );
          }
        }
      }, index * 300);
    });
  };

  const animatePlayerTotal = (newTotal) => {
    if (playerTotalRef.current) {
      gsap.fromTo(playerTotalRef.current,
        { scale: 1.2, color: '#10b981' },
        { scale: 1, color: '#ffffff', duration: 0.3, ease: "power2.out" }
      );
    }
  };

  const animateCardBorders = (result) => {
    if (playerCardsRef.current) {
      const cards = playerCardsRef.current.children;
      const borderColor = result === 'win' || result === 'blackjack' ? '#10b981' : 
                         result === 'push' ? '#f59e0b' : '#ef4444';
      
      for (let card of cards) {
        gsap.to(card, {
          borderColor: borderColor,
          boxShadow: `0 0 20px ${borderColor}40`,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    }
  };

  // Bet adjustment functions
  const halveBet = () => {
    setBetAmount(prev => Math.max(0.01, prev / 2));
  };

  const doubleBet = () => {
    setBetAmount(prev => Math.min(user.balance, prev * 2));
  };

  // Get dealer value display
  const getDealerValueDisplay = () => {
    if (!dealerCards.length) return '';
    if (!showDealerHoleCard && dealerCards.length > 0) {
      // Only show first card value with ace possibilities
      const firstCard = dealerCards[0];
      if (firstCard.value === 'A') {
        return '1, 11';
      } else if (['J', 'Q', 'K'].includes(firstCard.value)) {
        return '10';
      } else {
        return firstCard.value;
      }
    }
    return dealerTotal.toString();
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Control Panel */}
      <div className="w-64 bg-gray-800 p-6 flex flex-col space-y-6">
        {/* Manual Toggle */}
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <span className="text-white font-medium">Manual</span>
        </div>

        {/* Bet Amount Section */}
        <div className="space-y-3">
          <div className="text-white text-sm font-medium">Bet Amount</div>
          <div className="text-white text-lg font-bold">${betAmount.toFixed(2)}</div>
          
          {/* Bet Input and Controls */}
          <div className="space-y-2">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              min="0.01"
              max={user.balance}
              step="0.01"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              disabled={gameState === 'playing'}
            />
            <div className="flex space-x-2">
              <button
                onClick={halveBet}
                disabled={gameState === 'playing'}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ½
              </button>
              <button
                onClick={doubleBet}
                disabled={gameState === 'playing'}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                2×
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={hit}
            disabled={gameState !== 'playing' || isAnimating}
            className="h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
          >
            👋 Hit
          </button>
          <button
            onClick={stand}
            disabled={gameState !== 'playing' || isAnimating}
            className="h-12 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
          >
            ✋ Stand
          </button>
          <button
            onClick={() => {}} // Split functionality placeholder
            disabled={!canSplit || gameState !== 'playing' || isAnimating}
            className="h-12 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
          >
            💝 Split
          </button>
          <button
            onClick={doubleDown}
            disabled={!doubleDownAvailable || gameState !== 'playing' || isAnimating}
            className="h-12 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
          >
            ⬆️ Double
          </button>
        </div>

        {/* Main Bet Button */}
        <button
          onClick={gameState === 'betting' ? dealInitialCards : newGame}
          disabled={isAnimating || (gameState === 'betting' && (betAmount <= 0 || betAmount > user.balance))}
          className="w-full h-14 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {gameState === 'betting' ? (isAnimating ? 'Dealing...' : 'Bet') : 'New Game'}
        </button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        {/* Dealer Section */}
        <div className="text-center space-y-4">
          {/* Dealer Value Bubble */}
          {dealerCards.length > 0 && (
            <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              {getDealerValueDisplay()}
            </div>
          )}
          
          {/* Dealer Cards */}
          <div ref={dealerCardsRef} className="flex justify-center space-x-2">
            {dealerCards.map((card, index) => (
              <div
                key={index}
                className="transform transition-transform duration-200"
                style={{ transform: `translateX(${index * -5}px) rotate(${(index - dealerCards.length/2) * 2}deg)` }}
              >
                {index === 1 && !showDealerHoleCard ? (
                  <div className="w-20 h-28 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center border-2 border-blue-400">
                    <div className="text-white text-center">
                      <div className="text-xs font-bold">STAKE</div>
                    </div>
                  </div>
                ) : (
                  <div className={`w-20 h-28 rounded-lg flex flex-col items-center justify-between p-2 border-3 ${
                    card.suit === '♥' || card.suit === '♦' 
                      ? 'bg-white text-red-500 border-red-200' 
                      : 'bg-white text-black border-gray-300'
                  }`}>
                    <div className="text-sm font-bold">{card.value}</div>
                    <div className="text-2xl">{card.suit}</div>
                    <div className="text-sm font-bold transform rotate-180">{card.value}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Game Info Banners */}
        {gameState !== 'betting' && (
          <div className="space-y-2">
            <div className="bg-black text-white px-6 py-2 rounded text-sm font-bold text-center">
              BLACKJACK PAYS 3 TO 2
            </div>
            <div className="bg-black text-white px-6 py-2 rounded text-sm font-bold text-center">
              INSURANCE PAYS 2 TO 1
            </div>
          </div>
        )}

        {/* Player Section */}
        <div className="text-center space-y-4">
          {/* Player Cards */}
          <div ref={playerCardsRef} className="flex justify-center space-x-2">
            {playerCards.map((card, index) => (
              <div
                key={index}
                className="transform transition-all duration-200"
                style={{ 
                  transform: `translateX(${index * -10}px) rotate(${(index - playerCards.length/2) * 3}deg)`,
                  zIndex: index
                }}
              >
                <div className={`w-20 h-28 rounded-lg flex flex-col items-center justify-between p-2 border-4 transition-all duration-500 ${
                  card.suit === '♥' || card.suit === '♦' 
                    ? 'bg-white text-red-500' 
                    : 'bg-white text-black'
                } ${
                  gameResult?.result === 'win' || gameResult?.result === 'blackjack' ? 'border-green-500 shadow-green-500/50' :
                  gameResult?.result === 'bust' || gameResult?.result === 'lose' ? 'border-red-500 shadow-red-500/50' :
                  gameResult?.result === 'push' ? 'border-yellow-500 shadow-yellow-500/50' :
                  'border-gray-300'
                } shadow-lg`}>
                  <div className="text-sm font-bold">{card.value}</div>
                  <div className="text-2xl">{card.suit}</div>
                  <div className="text-sm font-bold transform rotate-180">{card.value}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Player Total Badge */}
          {playerCards.length > 0 && (
            <div 
              ref={playerTotalRef}
              className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
                playerTotal > 21 ? 'bg-red-600 text-white' :
                playerTotal === 21 ? 'bg-green-600 text-white' :
                'bg-gray-700 text-white'
              }`}
            >
              {playerTotal}
            </div>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className={`text-center p-4 rounded-lg text-lg font-medium ${
            gameResult?.result === 'win' || gameResult?.result === 'blackjack' 
              ? 'bg-green-500/20 text-green-400' 
              : gameResult?.result === 'push'
              ? 'bg-yellow-500/20 text-yellow-400'
              : gameResult?.result
              ? 'bg-red-500/20 text-red-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

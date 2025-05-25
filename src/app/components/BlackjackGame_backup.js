'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function BlackjackGame({ user, onBalanceUpdate }) {
  const [betAmount, setBetAmount] = useState(1);
  const [gameState, setGameState] = useState('betting'); // 'betting', 'playing', 'finished'
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const [message, setMessage] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [showDealerHoleCard, setShowDealerHoleCard] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [doubleDownAvailable, setDoubleDownAvailable] = useState(false);

  const cardContainerRef = useRef(null);
  const playerCardsRef = useRef(null);
  const dealerCardsRef = useRef(null);
  const resultRef = useRef(null);
  const confettiRef = useRef(null);

  // Card suits and values
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf([cardContainerRef.current, playerCardsRef.current, dealerCardsRef.current, resultRef.current]);
    };
  }, []);

  // Create a new deck
  const createDeck = () => {
    const deck = [];
    suits.forEach(suit => {
      values.forEach(value => {
        deck.push({ suit, value });
      });
    });
    return shuffleDeck(deck);
  };

  // Shuffle deck
  const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  // Get card value for blackjack
  const getCardValue = (card) => {
    if (card.value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value);
  };

  // Calculate hand total with ace handling
  const calculateTotal = (cards) => {
    let total = 0;
    let aces = 0;

    cards.forEach(card => {
      const value = getCardValue(card);
      total += value;
      if (card.value === 'A') aces++;
    });

    // Handle aces (convert from 11 to 1 if needed)
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  };

  // Deal initial cards
  const dealInitialCards = async () => {
    if (betAmount > user.balance) {
      setMessage('Insufficient balance!');
      return;
    }

    if (betAmount <= 0) {
      setMessage('Please enter a valid bet amount!');
      return;
    }

    setIsAnimating(true);
    setMessage('');
    setGameResult(null);
    setShowDealerHoleCard(false);

    try {
      const response = await fetch('/api/games/blackjack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

        // Animate card dealing
        animateCardDealing(result.playerCards, result.dealerCards);

        // Check for immediate blackjack
        if (result.gameOver) {
          setTimeout(() => {
            finishGame(result);
          }, 1500);
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

  // Player hits
  const hit = async () => {
    if (gameState !== 'playing' || isAnimating) return;

    setIsAnimating(true);
    setDoubleDownAvailable(false);

    try {
      const response = await fetch('/api/games/blackjack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'hit'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPlayerCards(result.playerCards);
        setPlayerTotal(result.playerTotal);

        // Animate new card
        animateNewCard('player');

        if (result.gameOver) {
          setTimeout(() => {
            finishGame(result);
          }, 800);
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

  // Player stands
  const stand = async () => {
    if (gameState !== 'playing' || isAnimating) return;

    setIsAnimating(true);
    setShowDealerHoleCard(true);

    try {
      const response = await fetch('/api/games/blackjack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'stand'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setDealerCards(result.dealerCards);
        setDealerTotal(result.dealerTotal);

        // Animate dealer cards if needed
        if (result.dealerCards.length > 2) {
          animateDealerCards(result.dealerCards.slice(2));
        }

        setTimeout(() => {
          finishGame(result);
        }, 1000);
      } else {
        setMessage(result.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
    } finally {
      setIsAnimating(false);
    }
  };

  // Double down
  const doubleDown = async () => {
    if (gameState !== 'playing' || isAnimating || !doubleDownAvailable) return;

    setIsAnimating(true);
    setBetAmount(prev => prev * 2);

    try {
      const response = await fetch('/api/games/blackjack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'double'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPlayerCards(result.playerCards);
        setPlayerTotal(result.playerTotal);
        setDealerCards(result.dealerCards);
        setDealerTotal(result.dealerTotal);
        setShowDealerHoleCard(true);

        // Animate new card and dealer reveal
        animateNewCard('player');

        setTimeout(() => {
          finishGame(result);
        }, 1500);
      } else {
        setMessage(result.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
    } finally {
      setIsAnimating(false);
    }
  };

  // Finish game and update UI
  const finishGame = (result) => {
    setGameState('finished');
    setGameResult(result);
    setWinAmount(result.winAmount || 0);
    setShowDealerHoleCard(true);

    // Set message based on result
    if (result.result === 'blackjack') {
      setMessage(`🎉 BLACKJACK! You won $${result.winAmount.toFixed(2)}!`);
    } else if (result.result === 'win') {
      setMessage(`🎉 You won $${result.winAmount.toFixed(2)}!`);
    } else if (result.result === 'push') {
      setMessage('🤝 Push! Your bet is returned.');
    } else {
      setMessage(`😔 You lost $${betAmount}. Better luck next time!`);
    }

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

    // Win animation
    if (result.result === 'win' || result.result === 'blackjack') {
      if (resultRef.current) {
        gsap.fromTo(resultRef.current, 
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }
        );
      }

      // Confetti for blackjack
      if (result.result === 'blackjack') {
        setTimeout(() => createConfetti(), 500);
      }
    }
  };

  // Start new game
  const newGame = () => {
    setGameState('betting');
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerTotal(0);
    setDealerTotal(0);
    setGameResult(null);
    setMessage('');
    setWinAmount(0);
    setShowDealerHoleCard(false);
    setDoubleDownAvailable(false);
    setBetAmount(Math.min(betAmount, user.balance));
  };

  // Animation functions
  const animateCardDealing = (playerCards, dealerCards) => {
    // Animate player cards
    playerCards.forEach((_, index) => {
      setTimeout(() => {
        if (playerCardsRef.current) {
          const cardElement = playerCardsRef.current.children[index];
          if (cardElement) {
            gsap.fromTo(cardElement,
              { y: -100, opacity: 0, rotationX: 180 },
              { y: 0, opacity: 1, rotationX: 0, duration: 0.6, ease: "back.out(1.7)" }
            );
          }
        }
      }, index * 300);
    });

    // Animate dealer cards
    dealerCards.forEach((_, index) => {
      setTimeout(() => {
        if (dealerCardsRef.current) {
          const cardElement = dealerCardsRef.current.children[index];
          if (cardElement) {
            gsap.fromTo(cardElement,
              { y: -100, opacity: 0, rotationX: 180 },
              { y: 0, opacity: 1, rotationX: 0, duration: 0.6, ease: "back.out(1.7)" }
            );
          }
        }
      }, (index + playerCards.length) * 300);
    });
  };

  const animateNewCard = (target) => {
    const ref = target === 'player' ? playerCardsRef : dealerCardsRef;
    if (ref.current) {
      const lastCard = ref.current.lastElementChild;
      if (lastCard) {
        gsap.fromTo(lastCard,
          { y: -100, opacity: 0, rotationX: 180 },
          { y: 0, opacity: 1, rotationX: 0, duration: 0.6, ease: "back.out(1.7)" }
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
              { y: -100, opacity: 0, rotationX: 180 },
              { y: 0, opacity: 1, rotationX: 0, duration: 0.6, ease: "back.out(1.7)" }
            );
          }
        }
      }, index * 400);
    });
  };

  const createConfetti = () => {
    // Simple confetti effect
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][Math.floor(Math.random() * 5)]};
        top: -10px;
        left: ${Math.random() * 100}vw;
        z-index: 1000;
        pointer-events: none;
      `;
      document.body.appendChild(confetti);

      gsap.to(confetti, {
        y: window.innerHeight + 10,
        x: Math.random() * 200 - 100,
        rotation: Math.random() * 360,
        duration: Math.random() * 2 + 2,
        ease: "power2.in",
        onComplete: () => {
          document.body.removeChild(confetti);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">♠ Blackjack ♥</h2>
          <div className="text-right">
            <p className="text-secondary text-sm">Balance</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              ${parseFloat(user.balance).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Betting Section */}
        {gameState === 'betting' && (
          <div className="space-y-4">
            <div>
              <label className="block text-secondary text-sm mb-2">Bet Amount</label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0.01"
                  max={user.balance}
                  step="0.01"
                  className="input flex-1"
                  placeholder="Enter bet amount"
                />
                <button
                  onClick={() => setBetAmount(Math.floor(user.balance / 4))}
                  className="btn-secondary text-sm"
                >
                  1/4
                </button>
                <button
                  onClick={() => setBetAmount(Math.floor(user.balance / 2))}
                  className="btn-secondary text-sm"
                >
                  1/2
                </button>
                <button
                  onClick={() => setBetAmount(user.balance)}
                  className="btn-secondary text-sm"
                >
                  Max
                </button>
              </div>
            </div>

            <button
              onClick={dealInitialCards}
              disabled={isAnimating || betAmount <= 0 || betAmount > user.balance}
              className="btn-primary w-full"
            >
              {isAnimating ? 'Dealing...' : 'Deal Cards'}
            </button>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div ref={resultRef} className={`mt-4 p-4 rounded-lg text-center font-medium ${
            gameResult?.result === 'win' || gameResult?.result === 'blackjack' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : gameResult?.result === 'push'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : gameResult?.result
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Game Area */}
      {gameState !== 'betting' && (
        <div ref={cardContainerRef} className="space-y-6">
          {/* Dealer Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Dealer</h3>
              <div className="text-right">
                <p className="text-secondary text-sm">Total</p>
                <p className="text-xl font-bold text-white">
                  {showDealerHoleCard ? dealerTotal : '?'}
                </p>
              </div>
            </div>
            <div ref={dealerCardsRef} className="flex flex-wrap gap-3">
              {dealerCards.map((card, index) => (
                <div
                  key={index}
                  className={`card-item ${index === 1 && !showDealerHoleCard ? 'card-back' : ''}`}
                >
                  {index === 1 && !showDealerHoleCard ? (
                    <div className="w-16 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-2xl">?</span>
                    </div>
                  ) : (
                    <div className={`w-16 h-24 rounded-lg flex flex-col items-center justify-center text-sm font-bold border-2 ${
                      card.suit === '♥' || card.suit === '♦' 
                        ? 'bg-white text-red-500 border-red-200' 
                        : 'bg-white text-black border-gray-200'
                    }`}>
                      <span className="text-xs">{card.value}</span>
                      <span className="text-lg">{card.suit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Player Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Player</h3>
              <div className="text-right">
                <p className="text-secondary text-sm">Total</p>
                <p className={`text-xl font-bold ${playerTotal > 21 ? 'text-red-400' : 'text-white'}`}>
                  {playerTotal}
                </p>
              </div>
            </div>
            <div ref={playerCardsRef} className="flex flex-wrap gap-3 mb-4">
              {playerCards.map((card, index) => (
                <div
                  key={index}
                  className={`w-16 h-24 rounded-lg flex flex-col items-center justify-center text-sm font-bold border-2 ${
                    card.suit === '♥' || card.suit === '♦' 
                      ? 'bg-white text-red-500 border-red-200' 
                      : 'bg-white text-black border-gray-200'
                  }`}
                >
                  <span className="text-xs">{card.value}</span>
                  <span className="text-lg">{card.suit}</span>
                </div>
              ))}
            </div>

            {/* Game Actions */}
            {gameState === 'playing' && (
              <div className="flex gap-3">
                <button
                  onClick={hit}
                  disabled={isAnimating}
                  className="btn-primary flex-1"
                >
                  Hit
                </button>
                <button
                  onClick={stand}
                  disabled={isAnimating}
                  className="btn-secondary flex-1"
                >
                  Stand
                </button>
                {doubleDownAvailable && (
                  <button
                    onClick={doubleDown}
                    disabled={isAnimating || betAmount * 2 > user.balance}
                    className="btn-accent flex-1"
                  >
                    Double
                  </button>
                )}
              </div>
            )}

            {gameState === 'finished' && (
              <button
                onClick={newGame}
                className="btn-primary w-full"
              >
                New Game
              </button>
            )}
          </div>
        </div>
      )}

      {/* Game Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Game Info</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-secondary">Current Bet</p>
            <p className="text-white font-medium">${betAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-secondary">Potential Win</p>
            <p className="text-white font-medium">
              ${gameState === 'playing' && playerTotal === 21 && playerCards.length === 2 
                ? (betAmount * 1.5).toFixed(2) 
                : betAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Game History */}
      {gameHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Games</h3>
          <div className="space-y-3">
            {gameHistory.map((game, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <p className="text-white">
                      Player: {game.playerTotal} | Dealer: {game.dealerTotal}
                    </p>
                    <p className="text-secondary text-xs">
                      {game.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    game.result === 'win' || game.result === 'blackjack' ? 'text-green-400' :
                    game.result === 'push' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {game.result === 'win' || game.result === 'blackjack' ? '+' : 
                     game.result === 'push' ? '±' : '-'}${
                      game.result === 'push' ? '0.00' : 
                      game.result === 'win' || game.result === 'blackjack' ? 
                      game.winAmount.toFixed(2) : game.betAmount.toFixed(2)
                    }
                  </p>
                  <p className="text-secondary text-xs capitalize">{game.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

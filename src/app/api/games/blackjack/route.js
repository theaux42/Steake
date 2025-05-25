import { NextResponse } from 'next/server';
import { userOperations, gameOperations, transactionOperations } from '../../../../../lib/database.js';

// Game session storage (in production, use Redis or database)
const gameSessions = new Map();

export async function POST(request) {
  try {
    const { userId, betAmount, action } = await request.json();
    
    // Validate input
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user
    const user = userOperations.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const sessionKey = `blackjack_${userId}`;

    switch (action) {
      case 'deal':
        return handleDeal(userId, betAmount, user, sessionKey);
      case 'hit':
        return handleHit(userId, sessionKey);
      case 'stand':
        return handleStand(userId, sessionKey);
      case 'double':
        return handleDouble(userId, sessionKey);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Blackjack API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDeal(userId, betAmount, user, sessionKey) {
  // Validate bet amount
  if (!betAmount || betAmount <= 0) {
    return NextResponse.json(
      { error: 'Bet amount must be greater than 0' },
      { status: 400 }
    );
  }

  if (parseFloat(user.balance) < betAmount) {
    return NextResponse.json(
      { error: 'Insufficient balance' },
      { status: 400 }
    );
  }

  // Create new deck and shuffle
  const deck = createAndShuffleDeck();
  
  // Deal initial cards
  const playerCards = [deck.pop(), deck.pop()];
  const dealerCards = [deck.pop(), deck.pop()];
  
  const playerTotal = calculateHandValue(playerCards);
  const dealerTotal = calculateHandValue(dealerCards);
  
  // Store game session
  const gameSession = {
    userId,
    betAmount,
    deck,
    playerCards,
    dealerCards,
    playerTotal,
    dealerTotal,
    gameStarted: new Date()
  };
  
  gameSessions.set(sessionKey, gameSession);
  
  // Check for immediate blackjack or bust
  let gameOver = false;
  let result = null;
  
  if (playerTotal === 21) {
    if (dealerTotal === 21) {
      // Both have blackjack - push
      result = await finishGame(sessionKey, 'push');
      gameOver = true;
    } else {
      // Player blackjack
      result = await finishGame(sessionKey, 'blackjack');
      gameOver = true;
    }
  }
  
  return NextResponse.json({
    playerCards,
    dealerCards,
    playerTotal,
    dealerTotal: gameOver ? dealerTotal : calculateHandValue([dealerCards[0]]), // Hide hole card
    gameOver,
    ...result
  });
}

async function handleHit(userId, sessionKey) {
  const gameSession = gameSessions.get(sessionKey);
  if (!gameSession || gameSession.userId !== userId) {
    return NextResponse.json(
      { error: 'No active game session' },
      { status: 400 }
    );
  }
  
  // Deal card to player
  const newCard = gameSession.deck.pop();
  gameSession.playerCards.push(newCard);
  gameSession.playerTotal = calculateHandValue(gameSession.playerCards);
  
  let gameOver = false;
  let result = null;
  
  // Check for bust
  if (gameSession.playerTotal > 21) {
    result = await finishGame(sessionKey, 'bust');
    gameOver = true;
  }
  
  return NextResponse.json({
    playerCards: gameSession.playerCards,
    playerTotal: gameSession.playerTotal,
    gameOver,
    ...result
  });
}

async function handleStand(userId, sessionKey) {
  const gameSession = gameSessions.get(sessionKey);
  if (!gameSession || gameSession.userId !== userId) {
    return NextResponse.json(
      { error: 'No active game session' },
      { status: 400 }
    );
  }
  
  // Dealer plays - must hit on 16 and below, stand on 17 and above
  while (gameSession.dealerTotal < 17) {
    const newCard = gameSession.deck.pop();
    gameSession.dealerCards.push(newCard);
    gameSession.dealerTotal = calculateHandValue(gameSession.dealerCards);
  }
  
  // Determine winner
  let resultType;
  if (gameSession.dealerTotal > 21) {
    resultType = 'win'; // Dealer bust
  } else if (gameSession.playerTotal > gameSession.dealerTotal) {
    resultType = 'win';
  } else if (gameSession.playerTotal < gameSession.dealerTotal) {
    resultType = 'lose';
  } else {
    resultType = 'push';
  }
  
  const result = await finishGame(sessionKey, resultType);
  
  return NextResponse.json({
    dealerCards: gameSession.dealerCards,
    dealerTotal: gameSession.dealerTotal,
    gameOver: true,
    ...result
  });
}

async function handleDouble(userId, sessionKey) {
  const gameSession = gameSessions.get(sessionKey);
  if (!gameSession || gameSession.userId !== userId) {
    return NextResponse.json(
      { error: 'No active game session' },
      { status: 400 }
    );
  }
  
  // Check if user can afford to double
  const user = userOperations.findById(userId);
  if (parseFloat(user.balance) < gameSession.betAmount) {
    return NextResponse.json(
      { error: 'Insufficient balance to double down' },
      { status: 400 }
    );
  }
  
  // Double the bet
  gameSession.betAmount *= 2;
  
  // Deal one card to player
  const newCard = gameSession.deck.pop();
  gameSession.playerCards.push(newCard);
  gameSession.playerTotal = calculateHandValue(gameSession.playerCards);
  
  let resultType;
  
  // Check if player busted
  if (gameSession.playerTotal > 21) {
    resultType = 'bust';
  } else {
    // Dealer plays
    while (gameSession.dealerTotal < 17) {
      const dealerCard = gameSession.deck.pop();
      gameSession.dealerCards.push(dealerCard);
      gameSession.dealerTotal = calculateHandValue(gameSession.dealerCards);
    }
    
    // Determine winner
    if (gameSession.dealerTotal > 21) {
      resultType = 'win'; // Dealer bust
    } else if (gameSession.playerTotal > gameSession.dealerTotal) {
      resultType = 'win';
    } else if (gameSession.playerTotal < gameSession.dealerTotal) {
      resultType = 'lose';
    } else {
      resultType = 'push';
    }
  }
  
  const result = await finishGame(sessionKey, resultType);
  
  return NextResponse.json({
    playerCards: gameSession.playerCards,
    dealerCards: gameSession.dealerCards,
    playerTotal: gameSession.playerTotal,
    dealerTotal: gameSession.dealerTotal,
    gameOver: true,
    ...result
  });
}

async function finishGame(sessionKey, resultType) {
  const gameSession = gameSessions.get(sessionKey);
  if (!gameSession) {
    throw new Error('Game session not found');
  }
  
  const { userId, betAmount, playerCards, dealerCards, playerTotal, dealerTotal } = gameSession;
  
  let winAmount = 0;
  let netGain = -betAmount; // Default to losing the bet
  
  switch (resultType) {
    case 'blackjack':
      winAmount = betAmount * 2.5; // 3:2 payout for blackjack
      netGain = winAmount - betAmount;
      break;
    case 'win':
      winAmount = betAmount * 2; // 1:1 payout
      netGain = winAmount - betAmount;
      break;
    case 'push':
      winAmount = betAmount; // Return original bet
      netGain = 0;
      break;
    case 'lose':
    case 'bust':
      winAmount = 0;
      netGain = -betAmount;
      break;
  }
  
  // Update user balance
  const user = userOperations.findById(userId);
  const newBalance = parseFloat(user.balance) + netGain;
  userOperations.updateBalance(userId, newBalance);
  
  // Create game record
  const gameResult = {
    playerCards,
    dealerCards,
    playerTotal,
    dealerTotal,
    result: resultType
  };
  
  gameOperations.create({
    userId,
    gameType: 'blackjack',
    betAmount,
    winAmount,
    result: JSON.stringify(gameResult)
  });
  
  // Create transaction records
  transactionOperations.create({
    userId,
    type: 'bet',
    amount: -betAmount,
    description: `Blackjack bet`,
    gameType: 'blackjack'
  });
  
  if (winAmount > 0) {
    transactionOperations.create({
      userId,
      type: 'win',
      amount: winAmount,
      description: `Blackjack ${resultType}`,
      gameType: 'blackjack'
    });
  }
  
  // Clean up session
  gameSessions.delete(sessionKey);
  
  return {
    result: resultType,
    winAmount,
    newBalance,
    playerCards,
    dealerCards,
    playerTotal,
    dealerTotal
  };
}

function createAndShuffleDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const deck = [];
  suits.forEach(suit => {
    values.forEach(value => {
      deck.push({ suit, value });
    });
  });
  
  // Shuffle deck using Fisher-Yates algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function calculateHandValue(cards) {
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
}
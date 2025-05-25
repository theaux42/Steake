import { NextResponse } from 'next/server';
import { userOperations, gameOperations, transactionOperations } from '../../../../../lib/database.js';

export async function POST(request) {
  try {
    const { userId, betAmount, action, minesCount, gameData } = await request.json();

    // Validate input
    if (!userId || !betAmount || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (betAmount <= 0) {
      return NextResponse.json(
        { error: 'Bet amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get user and check balance
    const user = userOperations.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'start') {
      // Validate mines count
      if (!minesCount || minesCount < 1 || minesCount > 24) {
        return NextResponse.json(
          { error: 'Mines count must be between 1 and 24' },
          { status: 400 }
        );
      }

      if (parseFloat(user.balance) < betAmount) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      }

      // Generate mine positions
      const minePositions = new Set();
      while (minePositions.size < minesCount) {
        minePositions.add(Math.floor(Math.random() * 25));
      }

      // Deduct bet from balance
      const newBalance = parseFloat(user.balance) - betAmount;
      userOperations.updateBalance(userId, newBalance);

      // Create bet transaction
      transactionOperations.create({
        userId,
        type: 'bet',
        amount: -betAmount,
        description: `Mines game bet - ${minesCount} mines`
      });

      return NextResponse.json({
        success: true,
        minePositions: Array.from(minePositions),
        newBalance,
        gameId: Date.now() // Simple game ID for tracking
      });

    } else if (action === 'cashout') {
      // Validate game data
      if (!gameData || !gameData.gemsFound || !gameData.minesCount || !gameData.multiplier) {
        return NextResponse.json(
          { error: 'Invalid game data' },
          { status: 400 }
        );
      }

      const { gemsFound, multiplier } = gameData;
      const winAmount = betAmount * multiplier;
      const newBalance = parseFloat(user.balance) + winAmount;

      // Update user balance
      userOperations.updateBalance(userId, newBalance);

      // Create game record
      const gameResult = {
        gemsFound,
        minesCount: gameData.minesCount,
        multiplier,
        result: 'cashout'
      };

      gameOperations.create({
        userId,
        gameType: 'mines',
        betAmount,
        winAmount,
        result: JSON.stringify(gameResult)
      });

      // Create win transaction
      transactionOperations.create({
        userId,
        type: 'win',
        amount: winAmount,
        description: `Mines game cashout - ${gemsFound} gems found`
      });

      return NextResponse.json({
        success: true,
        winAmount,
        newBalance,
        result: 'cashout'
      });

    } else if (action === 'explode') {
      // Handle mine hit - game over
      if (!gameData || gameData.gemsFound === undefined) {
        return NextResponse.json(
          { error: 'Invalid game data' },
          { status: 400 }
        );
      }

      const { gemsFound } = gameData;

      // Create game record (loss)
      const gameResult = {
        gemsFound,
        minesCount: gameData.minesCount || minesCount,
        multiplier: 0,
        result: 'mine_hit'
      };

      gameOperations.create({
        userId,
        gameType: 'mines',
        betAmount,
        winAmount: 0,
        result: JSON.stringify(gameResult)
      });

      return NextResponse.json({
        success: true,
        result: 'mine_hit',
        newBalance: user.balance // Balance was already deducted on start
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Mines game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

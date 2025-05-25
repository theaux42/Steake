import { NextResponse } from 'next/server';
import { userOperations, gameOperations, transactionOperations } from '../../../../../lib/database.js';

export async function POST(request) {
  try {
    const { userId, betAmount, prediction, targetNumber } = await request.json();

    // Validate input
    if (!userId || !betAmount || !prediction || !targetNumber) {
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

    if (!['higher', 'lower'].includes(prediction)) {
      return NextResponse.json(
        { error: 'Invalid prediction type' },
        { status: 400 }
      );
    }

    if (targetNumber < 1 || targetNumber > 99) {
      return NextResponse.json(
        { error: 'Target number must be between 1 and 99' },
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

    if (parseFloat(user.balance) < betAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Roll the dice (1-100)
    const diceValue = Math.floor(Math.random() * 100) + 1;
    
    // Determine if player won
    let won = false;
    let multiplier = 1;

    // Calculate multiplier based on probability (with 2% house edge)
    const winChance = prediction === 'higher' ? (100 - targetNumber) / 100 : targetNumber / 100;
    multiplier = Math.max(1.1, (0.98 / winChance));

    switch (prediction) {
      case 'higher':
        won = diceValue > targetNumber;
        break;
      case 'lower':
        won = diceValue < targetNumber;
        break;
    }

    const winAmount = won ? betAmount * multiplier : 0;
    const netGain = winAmount - betAmount;
    const newBalance = parseFloat(user.balance) + netGain;

    // Update user balance
    userOperations.updateBalance(userId, newBalance);

    // Create game record
    const gameResult = {
      diceValue,
      prediction,
      targetNumber,
      won,
      multiplier
    };

    gameOperations.create({
      userId,
      gameType: 'dice',
      betAmount,
      winAmount,
      result: JSON.stringify(gameResult)
    });

    // Create transaction records
    // Bet transaction (deduct)
    transactionOperations.create({
      userId,
      type: 'bet',
      amount: -betAmount,
      description: `Dice game bet - ${prediction} than ${targetNumber}`
    });

    // Win transaction (if won)
    if (won) {
      transactionOperations.create({
        userId,
        type: 'win',
        amount: winAmount,
        description: `Dice game win - rolled ${diceValue}`
      });
    }

    return NextResponse.json({
      success: true,
      diceValue,
      won,
      winAmount,
      newBalance,
      gameResult: {
        prediction,
        targetNumber,
        multiplier,
        won
      }
    });

  } catch (error) {
    console.error('Dice game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

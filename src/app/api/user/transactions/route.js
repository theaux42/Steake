import { NextResponse } from 'next/server';
import { transactionOperations, gameOperations } from '../../../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get transactions and games for the user
    const transactions = transactionOperations.getByUserId(userId);
    const games = gameOperations.getByUserId(userId);

    return NextResponse.json({
      success: true,
      transactions,
      games
    });

  } catch (error) {
    console.error('Transaction history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

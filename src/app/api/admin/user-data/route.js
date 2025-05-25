import { NextResponse } from 'next/server';
import { userOperations, transactionOperations, gameOperations } from '../../../../../lib/database.js';
import { getSession } from '../../../../../lib/session.js';

export async function GET(request) {
  try {
    const session = await getSession();
    
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    const user = userOperations.findByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user transactions
    const transactions = transactionOperations.getByUserId(user.id);
    
    // Get user games
    const games = gameOperations.getByUserId(user.id);
    
    // Get user P&L
    const pnl = gameOperations.getUserPnL(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        created_at: user.created_at
      },
      transactions,
      games,
      pnl: {
        totalPnL: pnl.total_pnl || 0,
        totalGames: pnl.total_games || 0,
        totalWagered: pnl.total_wagered || 0,
        totalWinnings: pnl.total_winnings || 0
      }
    });

  } catch (error) {
    console.error('Get user data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

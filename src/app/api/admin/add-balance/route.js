import { NextResponse } from 'next/server';
import { userOperations, transactionOperations } from '../../../../../lib/database.js';
import { getSession } from '../../../../../lib/session.js';

export async function POST(request) {
  try {
    const session = await getSession();
    
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { username, amount } = await request.json();

    if (!username || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Username and valid amount are required' },
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

    const newBalance = parseFloat(user.balance) + parseFloat(amount);
    userOperations.updateBalance(user.id, newBalance);

    // Record transaction
    transactionOperations.create({
      userId: user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      description: `Admin deposit by ${session.username}`
    });

    return NextResponse.json({
      message: 'Balance updated successfully',
      newBalance: newBalance
    });

  } catch (error) {
    console.error('Add balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

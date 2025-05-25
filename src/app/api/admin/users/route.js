import { NextResponse } from 'next/server';
import { userOperations } from '../../../../../lib/database.js';
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

    const users = userOperations.getAllUsers();

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

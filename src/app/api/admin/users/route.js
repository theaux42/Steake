import { NextResponse } from 'next/server';
import { userOperations } from '../../../../../lib/database.js';
import { cookies } from 'next/headers';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('steake-session');
  
  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

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

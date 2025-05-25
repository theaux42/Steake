import { NextResponse } from 'next/server';
import { userOperations } from '../../../../../lib/database.js';
import { getSession, clearSessionCookie, createSessionCookie } from '../../../../../lib/session.js';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { authenticated: false, error: 'No valid session found' },
        { status: 401 }
      );
    }

    // Verify the user still exists in the database and get fresh data
    const user = userOperations.findById(session.userId);
    
    if (!user) {
      // User was deleted, clear the session
      const response = NextResponse.json(
        { authenticated: false, error: 'User not found' },
        { status: 401 }
      );
      
      const sessionCookie = clearSessionCookie();
      response.cookies.set('steake-token', sessionCookie.value, sessionCookie.options);
      
      return response;
    }

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = user;
    
    // Create response with user data
    const response = NextResponse.json({
      authenticated: true,
      message: 'Session valid',
      user: {
        id: userWithoutPassword.id,
        username: userWithoutPassword.username,
        email: userWithoutPassword.email,
        balance: userWithoutPassword.balance,
        isAdmin: userWithoutPassword.is_admin
      }
    });

    // Refresh the JWT token to extend expiration
    const sessionCookie = createSessionCookie(user);
    response.cookies.set('steake-token', sessionCookie.value, sessionCookie.options);
    
    return response;
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

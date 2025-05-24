import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../../lib/auth.js';
import { createSessionCookie } from '../../../../../lib/session.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token and response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        isAdmin: user.is_admin
      }
    });

    // Set JWT token cookie
    const sessionCookie = createSessionCookie(user);
    response.cookies.set('steake-token', sessionCookie.value, sessionCookie.options);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

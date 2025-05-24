import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../../lib/auth.js';

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

    // Create session (simplified - in production you'd use proper session management)
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

    // Set a simple session cookie
    response.cookies.set('steake-session', JSON.stringify({
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

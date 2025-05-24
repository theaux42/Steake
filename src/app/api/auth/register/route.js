import { NextResponse } from 'next/server';
import { registerUser, validateAge } from '../../../../../lib/auth.js';
import { createSessionCookie } from '../../../../../lib/session.js';

export async function POST(request) {
  try {
    const { username, email, password, birthDate } = await request.json();

    // Validation
    if (!username || !email || !password || !birthDate) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (!validateAge(birthDate)) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old to register' },
        { status: 400 }
      );
    }

    const user = await registerUser({
      username,
      email,
      password,
      birthDate
    });

    // Create JWT token and response
    const response = NextResponse.json({
      message: 'Registration successful',
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
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

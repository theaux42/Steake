import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ message: 'Logout successful' });
  
  // Clear the session cookie
  response.cookies.set('steake-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  });

  return response;
}

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../../lib/session.js';

export async function POST(request) {
  const response = NextResponse.json({ message: 'Logout successful' });
  
  // Clear the JWT token cookie
  const sessionCookie = clearSessionCookie();
  response.cookies.set('steake-token', sessionCookie.value, sessionCookie.options);

  return response;
}

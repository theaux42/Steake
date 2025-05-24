import { NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt.js';

export function middleware(request) {
  // Only apply to API routes that need authentication
  const protectedRoutes = [
    '/api/admin',
    '/api/user', 
    '/api/game',
    '/api/balance'
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get the JWT token from cookies
  const token = request.cookies.get('steake-token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify the JWT token
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Add user info to request headers for use in API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', decoded.userId.toString());
  requestHeaders.set('x-user-username', decoded.username);
  requestHeaders.set('x-user-admin', decoded.isAdmin.toString());

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/user/:path*',
    '/api/game/:path*',
    '/api/balance/:path*'
  ]
};

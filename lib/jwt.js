import jwt from 'jsonwebtoken';

// Use a strong secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this-immediately';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    isAdmin: user.is_admin,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'steake-casino',
    audience: 'steake-users'
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'steake-casino',
      audience: 'steake-users'
    });
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
}

/**
 * Create a secure JWT cookie configuration
 * @param {string} token - JWT token
 * @returns {Object} Cookie configuration
 */
export function createTokenCookie(token) {
  return {
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/'
    }
  };
}

/**
 * Create a cookie configuration to clear the JWT token
 * @returns {Object} Cookie configuration to clear token
 */
export function clearTokenCookie() {
  return {
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    }
  };
}

/**
 * Refresh a JWT token (generate a new one with the same payload but extended expiration)
 * @param {string} token - Current JWT token
 * @returns {string|null} New JWT token or null if current token is invalid
 */
export function refreshToken(token) {
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  // Create new token with fresh expiration
  const payload = {
    userId: decoded.userId,
    username: decoded.username,
    isAdmin: decoded.isAdmin,
    email: decoded.email
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'steake-casino',
    audience: 'steake-users'
  });
}

/**
 * Extract authenticated user info from middleware headers
 * @param {Request} request - Next.js request object
 * @returns {Object|null} User info or null if not authenticated
 */
export function getAuthenticatedUser(request) {
  const userId = request.headers.get('x-user-id');
  const username = request.headers.get('x-user-username');
  const isAdmin = request.headers.get('x-user-admin');

  if (!userId || !username) {
    return null;
  }

  return {
    userId: parseInt(userId),
    username,
    isAdmin: isAdmin === 'true'
  };
}

/**
 * Middleware helper to verify admin access
 * @param {Request} request - Next.js request object
 * @returns {boolean} True if user is admin
 */
export function isAdminUser(request) {
  const user = getAuthenticatedUser(request);
  return user?.isAdmin || false;
}

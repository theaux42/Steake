import { cookies } from 'next/headers';
import { verifyToken, generateToken, createTokenCookie, clearTokenCookie } from './jwt.js';

export async function getSession() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('steake-token');
  
  if (!tokenCookie) {
    return null;
  }

  try {
    const decoded = verifyToken(tokenCookie.value);
    return decoded;
  } catch {
    return null;
  }
}

export function createSessionCookie(user) {
  const token = generateToken(user);
  return createTokenCookie(token);
}

export function clearSessionCookie() {
  return clearTokenCookie();
}

import bcrypt from 'bcryptjs';
import { userOperations } from './database.js';

export async function authenticateUser(username, password) {
  try {
    const user = userOperations.findByUsername(username);
    if (!user) {
      return null;
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    // Remove password hash from returned user object
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function registerUser(userData) {
  try {
    const { username, email, password, birthDate } = userData;

    // Check if user already exists
    const existingUser = userOperations.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = userOperations.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Create new user
    const result = userOperations.create({
      username,
      email,
      password,
      birthDate
    });

    if (result.lastInsertRowid) {
      const newUser = userOperations.findById(result.lastInsertRowid);
      const { password_hash, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    }

    throw new Error('Failed to create user');
  } catch (error) {
    throw error;
  }
}

export function validateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
}

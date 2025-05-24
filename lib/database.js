import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'steake.db');
const db = new Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      balance DECIMAL(10, 2) DEFAULT 0.00,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'bet', 'win'
      amount DECIMAL(10, 2) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Games table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_type TEXT NOT NULL,
      bet_amount DECIMAL(10, 2) NOT NULL,
      win_amount DECIMAL(10, 2) DEFAULT 0.00,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create admin user if it doesn't exist
  createAdminUser();
}

function createAdminUser() {
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, birth_date, balance, is_admin)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run('admin', 'admin@steake.com', hashedPassword, '1990-01-01', 10000.00, 1);
    console.log('Admin user created: username=admin, password=admin123');
  }
}

// User operations
const userOperations = {
  create: (userData) => {
    const { username, email, password, birthDate } = userData;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, birth_date)
      VALUES (?, ?, ?, ?)
    `);
    
    return stmt.run(username, email, hashedPassword, birthDate);
  },

  findByUsername: (username) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  findByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  updateBalance: (userId, newBalance) => {
    const stmt = db.prepare('UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(newBalance, userId);
  },

  getAllUsers: () => {
    return db.prepare('SELECT id, username, email, balance, created_at FROM users WHERE is_admin = 0').all();
  }
};

// Transaction operations
const transactionOperations = {
  create: (transactionData) => {
    const { userId, type, amount, description } = transactionData;
    const stmt = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description)
      VALUES (?, ?, ?, ?)
    `);
    
    return stmt.run(userId, type, amount, description);
  },

  getByUserId: (userId) => {
    return db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  getAll: () => {
    return db.prepare(`
      SELECT t.*, u.username 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `).all();
  }
};

// Game operations
const gameOperations = {
  create: (gameData) => {
    const { userId, gameType, betAmount, winAmount, result } = gameData;
    const stmt = db.prepare(`
      INSERT INTO games (user_id, game_type, bet_amount, win_amount, result)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    return stmt.run(userId, gameType, betAmount, winAmount || 0, result);
  },

  getByUserId: (userId) => {
    return db.prepare('SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  getAll: () => {
    return db.prepare(`
      SELECT g.*, u.username 
      FROM games g 
      JOIN users u ON g.user_id = u.id 
      ORDER BY g.created_at DESC
    `).all();
  },

  getUserPnL: (userId) => {
    const result = db.prepare(`
      SELECT 
        SUM(win_amount - bet_amount) as total_pnl,
        COUNT(*) as total_games,
        SUM(bet_amount) as total_wagered,
        SUM(win_amount) as total_winnings
      FROM games 
      WHERE user_id = ?
    `).get(userId);
    
    return result;
  }
};

// Initialize database on import
initializeDatabase();

export {
  db,
  userOperations,
  transactionOperations,
  gameOperations
};

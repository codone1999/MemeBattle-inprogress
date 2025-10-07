import bcrypt from 'bcrypt';
import { getDatabase } from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

export const authService = {
  /**
   * Register a new user
   */
  async register({ username, password, email }) {
    const db = await getDatabase();

    // Check if username already exists
    const existingUser = await db.get(
      'SELECT uid FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await db.get(
        'SELECT uid FROM users WHERE email = ?',
        [email]
      );

      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Generate unique UID
    let uid;
    let uidExists = true;
    while (uidExists) {
      uid = Math.floor(1000 + Math.random() * 9000);
      const check = await db.get('SELECT uid FROM users WHERE uid = ?', [uid]);
      uidExists = !!check;
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await db.run(
      `INSERT INTO users (uid, username, password, email, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [uid, username, hashedPassword, email || null]
    );

    // Generate unique inventory ID
    let idinventory;
    let invExists = true;
    while (invExists) {
      idinventory = Math.floor(1000 + Math.random() * 9000);
      const check = await db.get(
        'SELECT idinventory FROM inventories WHERE idinventory = ?',
        [idinventory]
      );
      invExists = !!check;
    }

    // Create inventory with starter cards and character
    const starterCards = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
    const starterCharacter = [111];

    await db.run(
      `INSERT INTO inventories (idinventory, uid, cardid, deckid, characterid, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [
        idinventory,
        uid,
        JSON.stringify(starterCards),
        JSON.stringify([]),
        JSON.stringify(starterCharacter)
      ]
    );

    // Fetch created user (without password)
    const user = await db.get(
      `SELECT uid, username, email, wins, losses, draws, elo_rating, 
              total_games, created_at 
       FROM users WHERE uid = ?`,
      [uid]
    );

    // Generate JWT token
    const token = generateToken({ 
      uid: user.uid, 
      username: user.username 
    });

    return { user, token };
  },

  /**
   * Login user
   */
  async login({ username, password }) {
    const db = await getDatabase();

    // Get user with password
    const user = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    // Update online status and last login
    await db.run(
      `UPDATE users 
       SET is_online = 1, last_login = datetime('now') 
       WHERE uid = ?`,
      [user.uid]
    );

    // Generate token
    const token = generateToken({ 
      uid: user.uid, 
      username: user.username 
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return { 
      user: userWithoutPassword, 
      token 
    };
  },

  /**
   * Logout user
   */
  async logout(uid) {
    const db = await getDatabase();
    
    await db.run(
      'UPDATE users SET is_online = 0 WHERE uid = ?',
      [uid]
    );

    return { message: 'Logout successful' };
  },

  /**
   * Verify user session
   */
  async verifySession(uid) {
    const db = await getDatabase();
    
    const user = await db.get(
      `SELECT uid, username, email, wins, losses, draws, elo_rating, 
              total_games, is_online, last_login, created_at 
       FROM users WHERE uid = ?`,
      [uid]
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
};
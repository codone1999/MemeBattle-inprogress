import argon2 from 'argon2';
import { getDatabase } from '../config/database.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export const authService = {
  /**
   * Register a new user with Argon2 password hashing
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

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id, // Use Argon2id (recommended)
      memoryCost: 65536, // 64 MB
      timeCost: 3, // 3 iterations
      parallelism: 4 // 4 parallel threads
    });

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

    // Starter pack: 10 cards and 1 character
    const starterCards = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
    const starterCharacter = [111]; // Adolf Kitler

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

    // Fetch user inventory
    const inventory = await db.get(
      'SELECT * FROM inventories WHERE uid = ?',
      [uid]
    );

    // Generate tokens
    const accessToken = generateAccessToken({ 
      uid: user.uid, 
      username: user.username 
    });

    const refreshToken = generateRefreshToken({ 
      uid: user.uid, 
      username: user.username 
    });

    return { 
      user, 
      inventory: {
        ...inventory,
        cardid: JSON.parse(inventory.cardid),
        deckid: JSON.parse(inventory.deckid),
        characterid: JSON.parse(inventory.characterid)
      },
      accessToken,
      refreshToken
    };
  },

  /**
   * Login user with Argon2 verification
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

    // Verify password with Argon2
    const isValidPassword = await argon2.verify(user.password, password);
    
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

    // Fetch user inventory
    const inventory = await db.get(
      'SELECT * FROM inventories WHERE uid = ?',
      [user.uid]
    );

    // Generate tokens
    const accessToken = generateAccessToken({ 
      uid: user.uid, 
      username: user.username 
    });

    const refreshToken = generateRefreshToken({ 
      uid: user.uid, 
      username: user.username 
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return { 
      user: userWithoutPassword,
      inventory: inventory ? {
        ...inventory,
        cardid: JSON.parse(inventory.cardid || '[]'),
        deckid: JSON.parse(inventory.deckid || '[]'),
        characterid: JSON.parse(inventory.characterid || '[]')
      } : null,
      accessToken,
      refreshToken
    };
  },

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      const db = await getDatabase();
      const user = await db.get(
        'SELECT uid, username FROM users WHERE uid = ?',
        [decoded.uid]
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        uid: user.uid,
        username: user.username
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
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
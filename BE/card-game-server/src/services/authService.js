import argon2 from 'argon2';
import { UserRepository } from '../repositories/UserRepository.js';
import { InventoryRepository } from '../repositories/InventoryRepository.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

const userRepo = new UserRepository();
const inventoryRepo = new InventoryRepository();

export const authService = {
  async register({ username, password, email }) {
    // Check existing username
    const existingUser = await userRepo.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check existing email
    if (email) {
      const existingEmail = await userRepo.findByEmail(email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Generate unique UID
    let uid;
    let uidExists = true;
    while (uidExists) {
      uid = Math.floor(1000 + Math.random() * 9000);
      uidExists = await userRepo.exists('uid = ?', [uid]);
    }

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    });

    // Create user
    await userRepo.create({
      uid,
      username,
      password: hashedPassword,
      email: email || null,
      created_at: new Date().toISOString()
    });

    // Generate unique inventory ID
    let idinventory;
    let invExists = true;
    while (invExists) {
      idinventory = Math.floor(1000 + Math.random() * 9000);
      invExists = await inventoryRepo.exists('idinventory = ?', [idinventory]);
    }

    // Starter pack
    const starterCards = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
    const starterCharacter = [111];

    await inventoryRepo.create({
      idinventory,
      uid,
      cardid: JSON.stringify(starterCards),
      deckid: JSON.stringify([]),
      characterid: JSON.stringify(starterCharacter),
      created_at: new Date().toISOString()
    });

    // Fetch created user
    const user = await userRepo.getUserWithInventory(uid);
    const inventory = await inventoryRepo.findByUserId(uid);

    // Generate tokens
    const accessToken = generateAccessToken({ uid, username });
    const refreshToken = generateRefreshToken({ uid, username });

    return { 
      user: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        elo_rating: user.elo_rating,
        total_games: user.total_games,
        created_at: user.created_at
      },
      inventory,
      accessToken,
      refreshToken
    };
  },

  async login({ username, password }) {
    // Get user
    const user = await userRepo.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    // Update online status
    await userRepo.updateOnlineStatus(user.uid, true);

    // Get inventory
    const inventory = await inventoryRepo.findByUserId(user.uid);

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
      inventory,
      accessToken,
      refreshToken
    };
  },

  async refreshAccessToken(refreshToken) {
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await userRepo.findById(decoded.uid);

      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = generateAccessToken({
        uid: user.uid,
        username: user.username
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  },

  async logout(uid) {
    await userRepo.updateOnlineStatus(uid, false);
    return { message: 'Logout successful' };
  },

  async verifySession(uid) {
    const user = await userRepo.getUserWithInventory(uid);
    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

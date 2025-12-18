const redis = require('redis');

/**
 * Redis Client Configuration (v4)
 * Used for storing active game states
 * Redis v4 has native Promise support - no need to promisify!
 */

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection attempts exhausted');
        return new Error('Redis retry attempts exhausted');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`Reconnecting to Redis... (attempt ${retries}, delay ${delay}ms)`);
      return delay;
    }
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0')
});

// Event handlers
redisClient.on('connect', () => {
  console.log('Redis client connecting...');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('end', () => {
  console.log('Redis client disconnected');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

/**
 * Redis v4 wrapper with consistent API
 * All methods return Promises natively
 */
const redisAsync = {
  // String operations
  get: async (key) => await redisClient.get(key),
  set: async (key, value) => await redisClient.set(key, value),
  setex: async (key, seconds, value) => await redisClient.setEx(key, seconds, value),
  del: async (key) => await redisClient.del(key),
  
  // Key operations
  exists: async (key) => await redisClient.exists(key),
  keys: async (pattern) => await redisClient.keys(pattern),
  ttl: async (key) => await redisClient.ttl(key),
  expire: async (key, seconds) => await redisClient.expire(key, seconds),
  
  // Hash operations
  hget: async (key, field) => await redisClient.hGet(key, field),
  hset: async (key, field, value) => await redisClient.hSet(key, field, value),
  hdel: async (key, field) => await redisClient.hDel(key, field),
  hgetall: async (key) => await redisClient.hGetAll(key),
  
  // Sorted set operations
  zadd: async (key, score, member) => await redisClient.zAdd(key, { score, value: member }),
  zrange: async (key, start, stop) => await redisClient.zRange(key, start, stop),
  zrem: async (key, member) => await redisClient.zRem(key, member),
  
  // List operations (for gacha history)
  lpush: async (key, value) => await redisClient.lPush(key, value),
  lrange: async (key, start, stop) => await redisClient.lRange(key, start, stop),
  ltrim: async (key, start, stop) => await redisClient.lTrim(key, start, stop),
  llen: async (key) => await redisClient.lLen(key)
};

/**
 * Helper functions for game state management
 */
const GameStateHelper = {
  /**
   * Store game state
   * @param {string} gameId - Game ID
   * @param {Object} gameState - Game state object
   * @param {number} ttl - Time to live in seconds (default 2 hours)
   */
  async setGameState(gameId, gameState, ttl = 7200) {
    const key = `game:${gameId}`;
    await redisAsync.setex(key, ttl, JSON.stringify(gameState));
  },

  /**
   * Get game state
   * @param {string} gameId - Game ID
   * @returns {Promise<Object|null>} - Game state or null
   */
  async getGameState(gameId) {
    const key = `game:${gameId}`;
    const data = await redisAsync.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Delete game state
   * @param {string} gameId - Game ID
   */
  async deleteGameState(gameId) {
    const key = `game:${gameId}`;
    await redisAsync.del(key);
  },

  /**
   * Check if game exists
   * @param {string} gameId - Game ID
   * @returns {Promise<boolean>}
   */
  async gameExists(gameId) {
    const key = `game:${gameId}`;
    const exists = await redisAsync.exists(key);
    return exists === 1;
  },

  /**
   * Get all active games
   * @returns {Promise<Array<string>>} - Array of game IDs
   */
  async getAllActiveGames() {
    const keys = await redisAsync.keys('game:*');
    return keys.map(key => key.replace('game:', ''));
  },

  /**
   * Extend game TTL
   * @param {string} gameId - Game ID
   * @param {number} ttl - New TTL in seconds
   */
  async extendGameTTL(gameId, ttl = 7200) {
    const key = `game:${gameId}`;
    await redisAsync.expire(key, ttl);
  },

  /**
   * Store user's current game
   * @param {string} userId - User ID
   * @param {string} gameId - Game ID
   */
  async setUserGame(userId, gameId) {
    const key = `user:game:${userId}`;
    await redisAsync.setex(key, 7200, gameId);
  },

  /**
   * Get user's current game
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} - Game ID or null
   */
  async getUserGame(userId) {
    const key = `user:game:${userId}`;
    return await redisAsync.get(key);
  },

  /**
   * Delete user's current game
   * @param {string} userId - User ID
   */
  async deleteUserGame(userId) {
    const key = `user:game:${userId}`;
    await redisAsync.del(key);
  },

  /**
   * Store game room mapping (for socket rooms)
   * @param {string} gameId - Game ID
   * @param {Array<string>} userIds - Array of user IDs
   */
  async setGameRoom(gameId, userIds) {
    const key = `gameroom:${gameId}`;
    await redisAsync.setex(key, 7200, JSON.stringify(userIds));
  },

  /**
   * Get game room users
   * @param {string} gameId - Game ID
   * @returns {Promise<Array<string>>} - Array of user IDs
   */
  async getGameRoom(gameId) {
    const key = `gameroom:${gameId}`;
    const data = await redisAsync.get(key);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Delete game room
   * @param {string} gameId - Game ID
   */
  async deleteGameRoom(gameId) {
    const key = `gameroom:${gameId}`;
    await redisAsync.del(key);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  try {
    await redisClient.quit();
    console.log('Redis connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error closing Redis:', err);
    process.exit(1);
  }
});

module.exports = redisAsync;
module.exports.client = redisClient;
module.exports.GameStateHelper = GameStateHelper;
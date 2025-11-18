const redis = require('redis');

/**
 * Redis Client Configuration
 * Used for storing active game states
 */

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('❌ Redis connection refused');
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('❌ Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('❌ Redis connection attempts exhausted');
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

// Event handlers
redisClient.on('connect', () => {
  console.log('🔗 Redis client connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisClient.on('end', () => {
  console.log('🔌 Redis client disconnected');
});

// Promisify Redis methods for async/await
const { promisify } = require('util');

const redisAsync = {
  get: promisify(redisClient.get).bind(redisClient),
  set: promisify(redisClient.set).bind(redisClient),
  setex: promisify(redisClient.setex).bind(redisClient),
  del: promisify(redisClient.del).bind(redisClient),
  exists: promisify(redisClient.exists).bind(redisClient),
  keys: promisify(redisClient.keys).bind(redisClient),
  ttl: promisify(redisClient.ttl).bind(redisClient),
  expire: promisify(redisClient.expire).bind(redisClient),
  hget: promisify(redisClient.hget).bind(redisClient),
  hset: promisify(redisClient.hset).bind(redisClient),
  hdel: promisify(redisClient.hdel).bind(redisClient),
  hgetall: promisify(redisClient.hgetall).bind(redisClient),
  zadd: promisify(redisClient.zadd).bind(redisClient),
  zrange: promisify(redisClient.zrange).bind(redisClient),
  zrem: promisify(redisClient.zrem).bind(redisClient)
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
process.on('SIGINT', () => {
  console.log('🔌 Closing Redis connection...');
  redisClient.quit(() => {
    console.log('✅ Redis connection closed');
    process.exit(0);
  });
});

module.exports = redisAsync;
module.exports.client = redisClient;
module.exports.GameStateHelper = GameStateHelper;
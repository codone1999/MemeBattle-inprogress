import { BaseRepository } from "./BaseRepository.js";
export class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'uid');
    // Longer cache for user data (rarely changes)
    this.cacheTimeout = 10000; // 10 seconds
  }

  /**
   * Find user by username (cached)
   */
  async findByUsername(username) {
    const cacheKey = `user:username:${username}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const user = await this.findOne('username = ?', [username]);
    
    if (user) {
      this.setCache(cacheKey, user);
      this.setCache(`${this.tableName}:${user.uid}`, user);
    }

    return user;
  }

  /**
   * Find user by email (cached)
   */
  async findByEmail(email) {
    return await this.findOne('email = ?', [email]);
  }

  /**
   * Find all online users (cached for 3 seconds)
   */
  async findOnlineUsers() {
    const cacheKey = 'users:online:all';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const users = await this.findAll('is_online = 1', [], 'username ASC');
    
    // Shorter cache for online status
    this.cache.set(cacheKey, {
      data: users,
      timestamp: Date.now()
    });
    
    // Override timeout to 3 seconds for online users
    setTimeout(() => this.cache.delete(cacheKey), 3000);

    return users;
  }

  /**
   * Update online status
   */
  async updateOnlineStatus(uid, isOnline) {
    await this.update(uid, {
      is_online: isOnline ? 1 : 0,
      last_login: new Date().toISOString()
    });

    // Clear online users cache
    this.clearCache('users:online:all');
  }

  /**
   * Update user stats (wins, losses, elo)
   */
  async updateStats(uid, { wins, losses, draws, elo_rating, total_games }) {
    const data = {};
    if (wins !== undefined) data.wins = wins;
    if (losses !== undefined) data.losses = losses;
    if (draws !== undefined) data.draws = draws;
    if (elo_rating !== undefined) data.elo_rating = elo_rating;
    if (total_games !== undefined) data.total_games = total_games;
    
    if (Object.keys(data).length > 0) {
      await this.update(uid, data);
    }
  }

  /**
   * Get user with inventory (single optimized query)
   */
  async getUserWithInventory(uid) {
    const cacheKey = `user:inventory:${uid}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const result = await this.queryOne(`
      SELECT 
        u.uid, u.username, u.email, u.wins, u.losses, u.draws, 
        u.elo_rating, u.total_games, u.is_online, u.created_at,
        u.last_login, u.profile_picture,
        i.idinventory, i.cardid, i.deckid, i.characterid, i.selected_character
      FROM users u
      LEFT JOIN inventories i ON u.uid = i.uid
      WHERE u.uid = ?
    `, [uid]);

    if (result) {
      // Parse JSON fields
      if (result.cardid) result.cardid = JSON.parse(result.cardid);
      if (result.deckid) result.deckid = JSON.parse(result.deckid);
      if (result.characterid) result.characterid = JSON.parse(result.characterid);
      
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Get leaderboard (top players by ELO)
   */
  async getLeaderboard(limit = 100) {
    const cacheKey = `users:leaderboard:${limit}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const results = await db.all(`
      SELECT uid, username, elo_rating, wins, losses, draws, total_games
      FROM users
      WHERE total_games > 0
      ORDER BY elo_rating DESC, wins DESC
      LIMIT ?
    `, [limit]);

    this.setCache(cacheKey, results, true);
    return results;
  }

  /**
   * Search users by username (for friend search)
   */
  async searchByUsername(searchTerm, limit = 20) {
    const cacheKey = `users:search:${searchTerm}:${limit}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const results = await db.all(`
      SELECT uid, username, elo_rating, is_online
      FROM users
      WHERE username LIKE ?
      ORDER BY username ASC
      LIMIT ?
    `, [`%${searchTerm}%`, limit]);

    this.setCache(cacheKey, results, true);
    return results;
  }
}
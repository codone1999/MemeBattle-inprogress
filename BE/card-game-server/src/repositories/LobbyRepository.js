import { BaseRepository } from "./BaseRepository.js";
export class LobbyRepository extends BaseRepository {
  constructor() {
    super('lobbies', 'lobby_id');
    // Lobbies change frequently, short cache
    this.cacheTimeout = 2000; // 2 seconds
  }

  /**
   * Find waiting lobbies with host info
   */
  async findWaitingLobbies() {
    const cacheKey = 'lobbies:waiting:all';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const results = await this.query(`
      SELECT 
        l.*,
        u.username as host_username,
        u.elo_rating as host_elo,
        CASE WHEN l.guest_user_id IS NOT NULL THEN 1 ELSE 0 END as has_guest
      FROM lobbies l
      LEFT JOIN users u ON l.host_user_id = u.uid
      WHERE l.status = 'waiting'
      ORDER BY l.created_at DESC
    `);

    // Short cache for active lobbies
    this.cache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });
    
    setTimeout(() => this.cache.delete(cacheKey), 2000);

    return results;
  }

  /**
   * Find lobby with user details (single query)
   */
  async findLobbyWithUsers(lobbyId) {
    const cacheKey = `lobby:full:${lobbyId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const result = await this.queryOne(`
      SELECT l.*, 
             h.username as host_username,
             h.elo_rating as host_elo,
             g.username as guest_username,
             g.elo_rating as guest_elo
      FROM lobbies l
      LEFT JOIN users h ON l.host_user_id = h.uid
      LEFT JOIN users g ON l.guest_user_id = g.uid
      WHERE l.lobby_id = ?
    `, [lobbyId]);

    if (result) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Find user's active lobby
   */
  async findUserActiveLobby(userId) {
    const cacheKey = `lobby:user:${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const result = await this.queryOne(`
      SELECT l.*, 
             h.username as host_username,
             g.username as guest_username
      FROM lobbies l
      LEFT JOIN users h ON l.host_user_id = h.uid
      LEFT JOIN users g ON l.guest_user_id = g.uid
      WHERE (l.host_user_id = ? OR l.guest_user_id = ?) 
        AND l.status = 'waiting'
      LIMIT 1
    `, [userId, userId]);

    if (result) {
      // Short cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      setTimeout(() => this.cache.delete(cacheKey), 2000);
    }

    return result;
  }

  /**
   * Check which users are in lobbies (batch check)
   */
  async checkUsersInLobby(userIds) {
    if (!userIds || userIds.length === 0) return {};

    const cacheKey = `lobby:users:${userIds.sort().join(',')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const placeholders = userIds.map(() => '?').join(',');
    
    this.metrics.totalQueries++;
    const users = await this.query(`
      SELECT DISTINCT 
        CASE 
          WHEN l.host_user_id IN (${placeholders}) THEN l.host_user_id
          WHEN l.guest_user_id IN (${placeholders}) THEN l.guest_user_id
        END as user_id,
        l.lobby_id,
        l.lobby_name
      FROM lobbies l
      WHERE (l.host_user_id IN (${placeholders}) OR l.guest_user_id IN (${placeholders}))
        AND l.status = 'waiting'
    `, [...userIds, ...userIds]);
    
    const result = users.reduce((acc, user) => {
      if (user.user_id) {
        acc[user.user_id] = {
          lobby_id: user.lobby_id,
          lobby_name: user.lobby_name
        };
      }
      return acc;
    }, {});

    // Short cache
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    setTimeout(() => this.cache.delete(cacheKey), 2000);

    return result;
  }

  /**
   * Create lobby
   */
  async createLobby(data) {
    const db = await this.getDb();
    
    this.metrics.totalQueries++;
    await db.run(
      `INSERT INTO lobbies (
        lobby_id, lobby_name, host_user_id, status, max_players, 
        is_private, password, game_mode, created_at
      ) VALUES (?, ?, ?, 'waiting', 2, ?, ?, ?, datetime('now'))`,
      [
        data.lobby_id,
        data.lobby_name,
        data.host_user_id,
        data.is_private ? 1 : 0,
        data.password || null,
        data.game_mode || 'normal'
      ]
    );

    this.clearCache('lobbies:waiting:all');
    return data.lobby_id;
  }

  /**
   * Update lobby (with selective cache clearing)
   */
  async updateLobby(lobbyId, data) {
    await this.update(lobbyId, data);
    
    // Clear relevant caches
    this.clearCache(`lobby:full:${lobbyId}`);
    this.clearCache('lobbies:waiting:all');
    
    // If updating guest, clear user's lobby cache
    if (data.guest_user_id !== undefined) {
      this.clearCache(`lobby:user:${data.guest_user_id}`);
    }
  }

  /**
   * Delete lobby (with cache cleanup)
   */
  async deleteLobby(lobbyId) {
    const lobby = await this.findById(lobbyId);
    
    await this.delete(lobbyId);
    
    // Clear all related caches
    this.clearCache(`lobby:full:${lobbyId}`);
    this.clearCache('lobbies:waiting:all');
    
    if (lobby) {
      this.clearCache(`lobby:user:${lobby.host_user_id}`);
      if (lobby.guest_user_id) {
        this.clearCache(`lobby:user:${lobby.guest_user_id}`);
      }
    }
  }
}

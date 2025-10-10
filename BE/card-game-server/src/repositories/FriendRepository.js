import { BaseRepository } from "./BaseRepository.js";
export class FriendRepository extends BaseRepository {
  constructor() {
    super('friends', 'id');
  }

  /**
   * Get user's friends list with online status
   */
  async getFriendsList(uid) {
    const cacheKey = `friends:list:${uid}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const friends = await this.query(`
      SELECT 
        u.uid, 
        u.username, 
        u.is_online, 
        u.last_login, 
        u.elo_rating,
        u.wins,
        u.losses,
        i.selected_character
      FROM friends f
      JOIN users u ON (f.friend_id = u.uid)
      LEFT JOIN inventories i ON (u.uid = i.uid)
      WHERE f.user_id = ?
      ORDER BY u.is_online DESC, u.username ASC
    `, [uid]);

    this.setCache(cacheKey, friends);
    return friends;
  }

  /**
   * Check if two users are friends
   */
  async areFriends(uid1, uid2) {
    const cacheKey = `friends:check:${uid1}:${uid2}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached !== null) return cached;

    const exists = await this.exists('user_id = ? AND friend_id = ?', [uid1, uid2]);
    
    this.setCache(cacheKey, exists, true);
    return exists;
  }

  /**
   * Add friendship (both directions in transaction)
   */
  async addFriendship(uid1, uid2) {
    await this.transaction(async (db) => {
      await db.run(
        'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
        [uid1, uid2]
      );
      await db.run(
        'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
        [uid2, uid1]
      );
    });

    // Clear both users' friend lists
    this.clearCache(`friends:list:${uid1}`);
    this.clearCache(`friends:list:${uid2}`);
    this.clearCache(`friends:check:${uid1}:${uid2}`);
    this.clearCache(`friends:check:${uid2}:${uid1}`);
  }

  /**
   * Remove friendship (both directions)
   */
  async removeFriendship(uid1, uid2) {
    const db = await this.getDb();
    
    this.metrics.totalQueries++;
    await db.run(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [uid1, uid2, uid2, uid1]
    );

    // Clear both users' caches
    this.clearCache(`friends:list:${uid1}`);
    this.clearCache(`friends:list:${uid2}`);
    this.clearCache(`friends:check:${uid1}:${uid2}`);
    this.clearCache(`friends:check:${uid2}:${uid1}`);
  }

  /**
   * Get mutual friends between two users
   */
  async getMutualFriends(uid1, uid2) {
    const cacheKey = `friends:mutual:${uid1}:${uid2}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const mutualFriends = await this.query(`
      SELECT DISTINCT u.uid, u.username, u.elo_rating
      FROM friends f1
      JOIN friends f2 ON f1.friend_id = f2.friend_id
      JOIN users u ON f1.friend_id = u.uid
      WHERE f1.user_id = ? AND f2.user_id = ?
    `, [uid1, uid2]);

    this.setCache(cacheKey, mutualFriends, true);
    return mutualFriends;
  }

  /**
   * Get friend count
   */
  async getFriendCount(uid) {
    return await this.count('user_id = ?', [uid]);
  }
}

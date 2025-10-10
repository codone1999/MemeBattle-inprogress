import { BaseRepository } from "./BaseRepository.js";
export class FriendRequestRepository extends BaseRepository {
  constructor() {
    super('friend_requests', 'id');
    this.cacheTimeout = 3000; // 3 seconds for requests
  }

  /**
   * Get pending friend requests for user
   */
  async getPendingRequests(uid) {
    const cacheKey = `friend_requests:pending:${uid}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const requests = await this.query(`
      SELECT fr.id, fr.from_user_id, fr.created_at,
             u.username, u.elo_rating, u.is_online
      FROM friend_requests fr
      JOIN users u ON (fr.from_user_id = u.uid)
      WHERE fr.to_user_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [uid]);

    // Short cache for pending requests
    this.cache.set(cacheKey, {
      data: requests,
      timestamp: Date.now()
    });
    setTimeout(() => this.cache.delete(cacheKey), 3000);

    return requests;
  }

  /**
   * Get sent friend requests
   */
  async getSentRequests(uid) {
    const cacheKey = `friend_requests:sent:${uid}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const requests = await this.query(`
      SELECT fr.id, fr.to_user_id, fr.created_at,
             u.username, u.elo_rating
      FROM friend_requests fr
      JOIN users u ON (fr.to_user_id = u.uid)
      WHERE fr.from_user_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [uid]);

    this.setCache(cacheKey, requests);
    return requests;
  }

  /**
   * Find pending request between users
   */
  async findPendingRequest(fromUid, toUid) {
    return await this.findOne(
      'from_user_id = ? AND to_user_id = ? AND status = ?',
      [fromUid, toUid, 'pending']
    );
  }

  /**
   * Create friend request
   */
  async createRequest(fromUid, toUid) {
    const db = await this.getDb();
    
    this.metrics.totalQueries++;
    await db.run(
      `INSERT INTO friend_requests (from_user_id, to_user_id, status, created_at) 
       VALUES (?, ?, 'pending', datetime('now'))`,
      [fromUid, toUid]
    );

    // Clear pending requests cache
    this.clearCache(`friend_requests:pending:${toUid}`);
    this.clearCache(`friend_requests:sent:${fromUid}`);
  }

  /**
   * Update request status
   */
  async updateStatus(requestId, status) {
    const request = await this.findById(requestId);
    
    await this.update(requestId, { status });

    if (request) {
      this.clearCache(`friend_requests:pending:${request.to_user_id}`);
      this.clearCache(`friend_requests:sent:${request.from_user_id}`);
    }
  }

  /**
   * Delete request
   */
  async deleteRequest(requestId) {
    const request = await this.findById(requestId);
    
    await this.delete(requestId);

    if (request) {
      this.clearCache(`friend_requests:pending:${request.to_user_id}`);
      this.clearCache(`friend_requests:sent:${request.from_user_id}`);
    }
  }
}
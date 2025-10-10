import { getDatabase } from "../config/database.js";

/**
 * Base Repository with advanced caching and batch operations
 * Provides performance optimization for SQLite operations
 */
export class BaseRepository {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    
    // Multi-layer cache system
    this.cache = new Map();
    this.queryCache = new Map();
    
    // Cache configuration
    this.cacheTimeout = 5000; // 5 seconds for data cache
    this.queryCacheTimeout = 10000; // 10 seconds for query results
    
    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalQueries: 0
    };
  }

  /**
   * Get database connection
   */
  async getDb() {
    return await getDatabase();
  }

  /**
   * Clear cache for specific key or all
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
      this.queryCache.delete(key);
    } else {
      this.cache.clear();
      this.queryCache.clear();
    }
  }

  /**
   * Get from cache with timeout
   */
  getFromCache(key, useQueryCache = false) {
    const cacheSource = useQueryCache ? this.queryCache : this.cache;
    const timeout = useQueryCache ? this.queryCacheTimeout : this.cacheTimeout;
    
    const cached = cacheSource.get(key);
    if (cached && Date.now() - cached.timestamp < timeout) {
      this.metrics.cacheHits++;
      return cached.data;
    }
    
    cacheSource.delete(key);
    this.metrics.cacheMisses++;
    return null;
  }

  /**
   * Set cache with timestamp
   */
  setCache(key, data, useQueryCache = false) {
    const cacheSource = useQueryCache ? this.queryCache : this.cache;
    cacheSource.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = totalRequests > 0 
      ? ((this.metrics.cacheHits / totalRequests) * 100).toFixed(2) 
      : 0;

    return {
      table: this.tableName,
      cacheSize: this.cache.size,
      queryCacheSize: this.queryCache.size,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      hitRate: `${hitRate}%`,
      totalQueries: this.metrics.totalQueries
    };
  }

  /**
   * Find one by primary key with caching
   */
  async findById(id) {
    const cacheKey = `${this.tableName}:${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const result = await db.get(
      `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
      [id]
    );

    if (result) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Find one by condition
   */
  async findOne(where, params = []) {
    const cacheKey = `${this.tableName}:one:${where}:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const result = await db.get(
      `SELECT * FROM ${this.tableName} WHERE ${where}`,
      params
    );

    if (result) {
      this.setCache(cacheKey, result, true);
    }

    return result;
  }

  /**
   * Find all with optional conditions
   */
  async findAll(where = '1=1', params = [], orderBy = null) {
    const cacheKey = `${this.tableName}:all:${where}:${orderBy}:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const query = `SELECT * FROM ${this.tableName} WHERE ${where}${
      orderBy ? ` ORDER BY ${orderBy}` : ''
    }`;
    const results = await db.all(query, params);

    this.setCache(cacheKey, results, true);
    return results;
  }

  /**
   * Find by IDs in batch (optimized with IN clause)
   */
  async findByIds(ids) {
    if (!ids || ids.length === 0) return [];

    const cacheKey = `${this.tableName}:batch:${ids.sort().join(',')}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const placeholders = ids.map(() => '?').join(',');
    const results = await db.all(
      `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} IN (${placeholders})`,
      ids
    );

    this.setCache(cacheKey, results, true);
    return results;
  }

  /**
   * Insert one record
   */
  async create(data) {
    const db = await this.getDb();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');

    this.metrics.totalQueries++;
    const result = await db.run(
      `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`,
      values
    );

    this.clearCache();
    return result.lastID;
  }

  /**
   * Update one record
   */
  async update(id, data) {
    const db = await this.getDb();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');

    this.metrics.totalQueries++;
    await db.run(
      `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`,
      [...values, id]
    );

    this.clearCache(`${this.tableName}:${id}`);
  }

  /**
   * Delete one record
   */
  async delete(id) {
    const db = await this.getDb();
    
    this.metrics.totalQueries++;
    await db.run(
      `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
      [id]
    );

    this.clearCache();
  }

  /**
   * Count records with optional condition
   */
  async count(where = '1=1', params = []) {
    const cacheKey = `${this.tableName}:count:${where}:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached !== null) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const result = await db.get(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${where}`,
      params
    );

    this.setCache(cacheKey, result.count, true);
    return result.count;
  }

  /**
   * Check if record exists
   */
  async exists(where, params = []) {
    const count = await this.count(where, params);
    return count > 0;
  }

  /**
   * Execute raw query (multiple results)
   */
  async query(sql, params = []) {
    const cacheKey = `query:${sql}:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const results = await db.all(sql, params);

    this.setCache(cacheKey, results, true);
    return results;
  }

  /**
   * Execute raw query (single result)
   */
  async queryOne(sql, params = []) {
    const cacheKey = `queryOne:${sql}:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const result = await db.get(sql, params);

    this.setCache(cacheKey, result, true);
    return result;
  }

  /**
   * Batch insert (optimized for multiple inserts)
   */
  async batchInsert(dataArray) {
    if (!dataArray || dataArray.length === 0) return [];

    const db = await this.getDb();
    const keys = Object.keys(dataArray[0]);
    const placeholders = keys.map(() => '?').join(',');
    
    const stmt = await db.prepare(
      `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`
    );

    const ids = [];
    this.metrics.totalQueries += dataArray.length;
    
    for (const data of dataArray) {
      const values = keys.map(key => data[key]);
      const result = await stmt.run(values);
      ids.push(result.lastID);
    }

    await stmt.finalize();
    this.clearCache();
    
    return ids;
  }

  /**
   * Transaction wrapper
   */
  async transaction(callback) {
    const db = await this.getDb();
    
    try {
      await db.run('BEGIN TRANSACTION');
      const result = await callback(db);
      await db.run('COMMIT');
      this.clearCache();
      return result;
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Bulk update (optimized)
   */
  async bulkUpdate(updates) {
    if (!updates || updates.length === 0) return;

    await this.transaction(async (db) => {
      for (const { id, data } of updates) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(', ');

        await db.run(
          `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`,
          [...values, id]
        );
      }
    });
  }
}
const Map = require('../models/Map.model');

/**
 * Map Repository
 * Handles all database operations for maps
 */
class MapRepository {
  /**
   * Get all maps
   * @returns {Promise<Array>} - Array of maps
   */
  async findAll() {
    return await Map.find()
      .select('name image themeColor gridSize difficulty')
      .sort({ difficulty: 1, name: 1 })
      .lean();
  }

  /**
   * Get map by ID
   * @param {string} mapId - Map ID
   * @returns {Promise<Object|null>} - Map or null
   */
  async findById(mapId) {
    return await Map.findById(mapId).lean();
  }

  /**
   * Get maps by difficulty
   * @param {string} difficulty - Difficulty level
   * @returns {Promise<Array>} - Array of maps
   */
  async findByDifficulty(difficulty) {
    return await Map.find({ difficulty })
      .select('name image themeColor gridSize')
      .sort({ name: 1 })
      .lean();
  }

  /**
   * Count total maps
   * @returns {Promise<number>} - Count
   */
  async count() {
    return await Map.countDocuments();
  }
}

module.exports = MapRepository;

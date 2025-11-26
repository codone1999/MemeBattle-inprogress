const MapRepository = require('../repositories/Map.repository');

/**
 * Map Service
 * Contains business logic for map operations
 */
class MapService {
  constructor() {
    this.mapRepository = new MapRepository();
  }

  /**
   * Get all available maps
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Maps data
   */
  async getAllMaps(query = {}) {
    const { difficulty } = query;

    let maps;
    if (difficulty) {
      maps = await this.mapRepository.findByDifficulty(difficulty);
    } else {
      maps = await this.mapRepository.findAll();
    }

    return {
      maps,
      total: maps.length
    };
  }

  /**
   * Get map by ID
   * @param {string} mapId - Map ID
   * @returns {Promise<Object>} - Map details
   */
  async getMapById(mapId) {
    const map = await this.mapRepository.findById(mapId);

    if (!map) {
      throw new Error('Map not found');
    }

    return map;
  }
}

module.exports = MapService;

import { BaseRepository } from "./BaseRepository.js";
export class MapRepository extends BaseRepository {
  constructor() {
    super('maps', 'mapid');
    // Maps never change, long cache
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Get all maps (heavily cached)
   */
  async getAllMaps() {
    const cacheKey = 'maps:all';
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    const maps = await this.findAll('1=1', [], 'name ASC');
    
    this.setCache(cacheKey, maps, true);
    return maps;
  }

  /**
   * Find map by ID
   */
  async findByMapId(mapid) {
    const cacheKey = `map:${mapid}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    const map = await this.findOne('mapid = ?', [mapid]);
    
    if (map) {
      this.setCache(cacheKey, map, true);
    }

    return map;
  }

  /**
   * Get random map
   */
  async getRandomMap() {
    const maps = await this.getAllMaps();
    if (maps.length === 0) return null;
    
    return maps[Math.floor(Math.random() * maps.length)];
  }
}

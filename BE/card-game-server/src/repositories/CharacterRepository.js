import { BaseRepository } from "./BaseRepository.js";
export class CharacterRepository extends BaseRepository {
  constructor() {
    super('characters', 'idcharacter');
    // Characters rarely change
    this.cacheTimeout = 60000; // 1 minute
  }

  /**
   * Get characters by IDs
   */
  async getCharactersByIds(characterIds) {
    if (!characterIds || characterIds.length === 0) return [];

    const cacheKey = `characters:batch:${characterIds.sort().join(',')}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    const characters = await this.findByIds(characterIds);
    this.setCache(cacheKey, characters, true);
    return characters;
  }

  /**
   * Get all characters (heavily cached)
   */
  async getAllCharacters() {
    const cacheKey = 'characters:all';
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    const characters = await this.findAll('1=1', [], 'idcharacter ASC');
    this.setCache(cacheKey, characters, true);
    return characters;
  }
}

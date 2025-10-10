import { BaseRepository } from "./BaseRepository.js";
export class CardRepository extends BaseRepository {
  constructor() {
    super('cards', 'idcard');
    // Cards rarely change, use longer cache
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Find cards by rarity
   */
  async findByRarity(rarity) {
    const cacheKey = `cards:rarity:${rarity}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    const cards = await this.findAll('cardRarity = ?', [rarity], 'Power DESC, cardname ASC');
    const parsed = this._parseCards(cards);

    this.setCache(cacheKey, parsed, true);
    return parsed;
  }

  /**
   * Get cards by IDs (batch operation)
   */
  async getCardsByIds(cardIds) {
    if (!cardIds || cardIds.length === 0) return [];

    // Check cache first
    const cacheKey = `cards:batch:${cardIds.sort().join(',')}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    const cards = await this.findByIds(cardIds);
    const parsed = this._parseCards(cards);

    this.setCache(cacheKey, parsed, true);
    return parsed;
  }

  /**
   * Get all cards (cached heavily)
   */
  async getAllCards() {
    const cacheKey = 'cards:all';
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    const cards = await this.findAll('1=1', [], 'cardRarity, Power DESC');
    const parsed = this._parseCards(cards);

    this.setCache(cacheKey, parsed, true);
    return parsed;
  }

  /**
   * Parse card JSON fields
   */
  _parseCards(cards) {
    return cards.map(card => ({
      ...card,
      pawnLocations: JSON.parse(card.pawnLocations || '[]'),
      Ability: card.Ability === 1
    }));
  }

  /**
   * Get cards by power range
   */
  async getCardsByPowerRange(minPower, maxPower) {
    const cacheKey = `cards:power:${minPower}-${maxPower}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const cards = await db.all(`
      SELECT * FROM cards
      WHERE Power BETWEEN ? AND ?
      ORDER BY Power DESC
    `, [minPower, maxPower]);

    const parsed = this._parseCards(cards);
    this.setCache(cacheKey, parsed, true);
    return parsed;
  }
}
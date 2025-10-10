import { BaseRepository } from "./BaseRepository.js";
export class DeckRepository extends BaseRepository {
  constructor() {
    super('decks', 'deckid');
  }

  /**
   * Find decks by user ID
   */
  async findByUserId(userId) {
    const cacheKey = `decks:user:${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const decks = await this.findAll('user_id = ?', [userId], 'created_at DESC');
    const parsed = decks.map(deck => ({
      ...deck,
      cardid: JSON.parse(deck.cardid || '[]')
    }));

    this.setCache(cacheKey, parsed);
    return parsed;
  }

  /**
   * Find user's deck by deck ID
   */
  async findUserDeck(deckid, userId) {
    const cacheKey = `deck:${deckid}:user:${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const deck = await this.findOne('deckid = ? AND user_id = ?', [deckid, userId]);
    
    if (deck) {
      const parsed = {
        ...deck,
        cardid: JSON.parse(deck.cardid || '[]')
      };
      this.setCache(cacheKey, parsed);
      return parsed;
    }
    
    return null;
  }

  /**
   * Create new deck
   */
  async createDeck(data) {
    const db = await this.getDb();
    
    this.metrics.totalQueries++;
    await db.run(
      `INSERT INTO decks (deckid, user_id, cardid, deck_name, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [data.deckid, data.user_id, JSON.stringify(data.cardid), data.deck_name]
    );

    this.clearCache(`decks:user:${data.user_id}`);
    return data.deckid;
  }

  /**
   * Update deck
   */
  async updateDeck(deckid, userId, data) {
    const db = await this.getDb();
    const updates = [];
    const values = [];

    if (data.deck_name) {
      updates.push('deck_name = ?');
      values.push(data.deck_name);
    }
    if (data.cardid) {
      updates.push('cardid = ?');
      values.push(JSON.stringify(data.cardid));
    }

    if (updates.length === 0) return;

    values.push(deckid, userId);

    this.metrics.totalQueries++;
    await db.run(
      `UPDATE decks SET ${updates.join(', ')} WHERE deckid = ? AND user_id = ?`,
      values
    );

    this.clearCache(`decks:user:${userId}`);
    this.clearCache(`deck:${deckid}:user:${userId}`);
  }

  /**
   * Delete deck
   */
  async deleteDeck(deckid, userId) {
    const db = await this.getDb();
    
    this.metrics.totalQueries++;
    await db.run('DELETE FROM decks WHERE deckid = ? AND user_id = ?', [deckid, userId]);
    
    this.clearCache(`decks:user:${userId}`);
    this.clearCache(`deck:${deckid}:user:${userId}`);
  }

  /**
   * Get deck with full card details
   */
  async getDeckWithCards(deckid, userId) {
    const cacheKey = `deck:full:${deckid}:${userId}`;
    const cached = this.getFromCache(cacheKey, true);
    if (cached) return cached;

    this.metrics.totalQueries++;
    const db = await this.getDb();
    const deck = await db.get(
      'SELECT * FROM decks WHERE deckid = ? AND user_id = ?',
      [deckid, userId]
    );

    if (!deck) return null;

    const cardIds = JSON.parse(deck.cardid || '[]');
    if (cardIds.length === 0) {
      return { ...deck, cards: [] };
    }

    const placeholders = cardIds.map(() => '?').join(',');
    const cards = await db.all(
      `SELECT * FROM cards WHERE idcard IN (${placeholders})`,
      cardIds
    );

    const result = {
      ...deck,
      cardid: cardIds,
      cards: cards.map(card => ({
        ...card,
        pawnLocations: JSON.parse(card.pawnLocations || '[]'),
        Ability: card.Ability === 1
      }))
    };

    this.setCache(cacheKey, result, true);
    return result;
  }
}

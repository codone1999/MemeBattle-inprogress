import { BaseRepository } from "./BaseRepository.js";
export class InventoryRepository extends BaseRepository {
  constructor() {
    super('inventories', 'idinventory');
  }

  /**
   * Find inventory by user ID with JSON parsing
   */
  async findByUserId(uid) {
    const cacheKey = `inventory:uid:${uid}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const result = await this.findOne('uid = ?', [uid]);
    
    if (result) {
      const parsed = {
        ...result,
        cardid: JSON.parse(result.cardid || '[]'),
        deckid: JSON.parse(result.deckid || '[]'),
        characterid: JSON.parse(result.characterid || '[]')
      };
      
      this.setCache(cacheKey, parsed);
      return parsed;
    }
    
    return null;
  }

  /**
   * Update inventory (handles JSON serialization)
   */
  async updateInventory(uid, { cardid, deckid, characterid, selected_character }) {
    const db = await this.getDb();
    const updates = [];
    const values = [];

    if (cardid !== undefined) {
      updates.push('cardid = ?');
      values.push(JSON.stringify(cardid));
    }
    if (deckid !== undefined) {
      updates.push('deckid = ?');
      values.push(JSON.stringify(deckid));
    }
    if (characterid !== undefined) {
      updates.push('characterid = ?');
      values.push(JSON.stringify(characterid));
    }
    if (selected_character !== undefined) {
      updates.push('selected_character = ?');
      values.push(selected_character);
    }

    if (updates.length === 0) return;

    values.push(uid);

    this.metrics.totalQueries++;
    await db.run(
      `UPDATE inventories SET ${updates.join(', ')} WHERE uid = ?`,
      values
    );

    this.clearCache(`inventory:uid:${uid}`);
    this.clearCache(`user:inventory:${uid}`);
  }

  /**
   * Add cards to inventory
   */
  async addCards(uid, cardIds) {
    const inventory = await this.findByUserId(uid);
    const updatedCards = [...new Set([...inventory.cardid, ...cardIds])];
    
    await this.updateInventory(uid, { cardid: updatedCards });
  }

  /**
   * Add deck to inventory
   */
  async addDeck(uid, deckId) {
    const inventory = await this.findByUserId(uid);
    const updatedDecks = [...inventory.deckid, deckId];
    
    await this.updateInventory(uid, { deckid: updatedDecks });
  }

  /**
   * Remove deck from inventory
   */
  async removeDeck(uid, deckId) {
    const inventory = await this.findByUserId(uid);
    const updatedDecks = inventory.deckid.filter(id => id !== deckId);
    
    await this.updateInventory(uid, { deckid: updatedDecks });
  }

  /**
   * Add character to inventory
   */
  async addCharacter(uid, characterId) {
    const inventory = await this.findByUserId(uid);
    const updatedCharacters = [...new Set([...inventory.characterid, characterId])];
    
    await this.updateInventory(uid, { characterid: updatedCharacters });
  }
}
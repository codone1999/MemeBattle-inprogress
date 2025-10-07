import { getDatabase } from '../config/database.js';

export const userService = {
  /**
   * Get user profile
   */
  async getUserProfile(uid) {
    const db = await getDatabase();
    
    const user = await db.get(
      `SELECT uid, username, email, wins, losses, draws, elo_rating, 
              total_games, is_online, created_at, last_login 
       FROM users WHERE uid = ?`,
      [uid]
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  /**
   * Get user inventory
   */
  async getUserInventory(uid) {
    const db = await getDatabase();
    
    const inventory = await db.get(
      'SELECT * FROM inventories WHERE uid = ?',
      [uid]
    );

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Parse JSON fields
    return {
      idinventory: inventory.idinventory,
      uid: inventory.uid,
      cardid: JSON.parse(inventory.cardid || '[]'),
      deckid: JSON.parse(inventory.deckid || '[]'),
      characterid: JSON.parse(inventory.characterid || '[]'),
      created_at: inventory.created_at
    };
  },

  /**
   * Update inventory (add card after gacha)
   */
  async updateInventory(uid, { cardid, deckid, characterid }) {
    const db = await getDatabase();
    
    const inventory = await this.getUserInventory(uid);

    // Merge new items with existing
    const updatedCardId = cardid ? [...new Set([...inventory.cardid, ...cardid])] : inventory.cardid;
    const updatedDeckId = deckid ? [...new Set([...inventory.deckid, ...deckid])] : inventory.deckid;
    const updatedCharacterId = characterid ? [...new Set([...inventory.characterid, ...characterid])] : inventory.characterid;

    await db.run(
      `UPDATE inventories 
       SET cardid = ?, deckid = ?, characterid = ? 
       WHERE uid = ?`,
      [
        JSON.stringify(updatedCardId),
        JSON.stringify(updatedDeckId),
        JSON.stringify(updatedCharacterId),
        uid
      ]
    );

    return this.getUserInventory(uid);
  },

  /**
   * Get all cards
   */
  async getAllCards() {
    const db = await getDatabase();
    
    const cards = await db.all('SELECT * FROM cards ORDER BY cardRarity, idcard');
    
    return cards.map(card => ({
      ...card,
      pawnLocations: JSON.parse(card.pawnLocations || '[]'),
      Ability: card.Ability === 1
    }));
  },

  /**
   * Get all characters
   */
  async getAllCharacters() {
    const db = await getDatabase();
    return db.all('SELECT * FROM characters ORDER BY idcharacter');
  },

  /**
   * Get all maps
   */
  async getAllMaps() {
    const db = await getDatabase();
    return db.all('SELECT * FROM maps ORDER BY name');
  }
};
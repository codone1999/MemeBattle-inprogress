import { getDatabase } from '../config/database.js';

export const inventoryService = {
  /**
   * Get user's decks
   */
  async getUserDecks(uid) {
    const db = await getDatabase();
    
    const decks = await db.all(
      'SELECT * FROM decks WHERE user_id = ? ORDER BY created_at DESC',
      [uid]
    );

    return decks.map(deck => ({
      ...deck,
      cardid: JSON.parse(deck.cardid || '[]')
    }));
  },

  /**
   * Create new deck
   */
  async createDeck(uid, { deckName, cardIds }) {
    const db = await getDatabase();

    // Validate deck size (max 15 cards)
    if (cardIds.length > 15) {
      throw new Error('Deck cannot have more than 15 cards');
    }

    if (cardIds.length === 0) {
      throw new Error('Deck must have at least 1 card');
    }

    // Generate unique deck ID
    let deckid;
    let deckExists = true;
    while (deckExists) {
      deckid = Math.floor(1000 + Math.random() * 9000);
      const check = await db.get('SELECT deckid FROM decks WHERE deckid = ?', [deckid]);
      deckExists = !!check;
    }

    // Create deck
    await db.run(
      `INSERT INTO decks (deckid, user_id, cardid, deck_name, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [deckid, uid, JSON.stringify(cardIds), deckName || `Deck ${deckid}`]
    );

    // Update user inventory to include this deck
    const inventory = await db.get('SELECT * FROM inventories WHERE uid = ?', [uid]);
    const currentDeckIds = JSON.parse(inventory.deckid || '[]');
    currentDeckIds.push(deckid);

    await db.run(
      'UPDATE inventories SET deckid = ? WHERE uid = ?',
      [JSON.stringify(currentDeckIds), uid]
    );

    return {
      deckid,
      user_id: uid,
      cardid: cardIds,
      deck_name: deckName || `Deck ${deckid}`
    };
  },

  /**
   * Update existing deck
   */
  async updateDeck(uid, deckid, { deckName, cardIds }) {
    const db = await getDatabase();

    // Check if deck belongs to user
    const deck = await db.get(
      'SELECT * FROM decks WHERE deckid = ? AND user_id = ?',
      [deckid, uid]
    );

    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    // Validate deck size
    if (cardIds && cardIds.length > 15) {
      throw new Error('Deck cannot have more than 15 cards');
    }

    const updateFields = [];
    const updateValues = [];

    if (deckName) {
      updateFields.push('deck_name = ?');
      updateValues.push(deckName);
    }

    if (cardIds) {
      updateFields.push('cardid = ?');
      updateValues.push(JSON.stringify(cardIds));
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateValues.push(deckid, uid);

    await db.run(
      `UPDATE decks SET ${updateFields.join(', ')} WHERE deckid = ? AND user_id = ?`,
      updateValues
    );

    const updatedDeck = await db.get(
      'SELECT * FROM decks WHERE deckid = ?',
      [deckid]
    );

    return {
      ...updatedDeck,
      cardid: JSON.parse(updatedDeck.cardid || '[]')
    };
  },

  /**
   * Delete deck
   */
  async deleteDeck(uid, deckid) {
    const db = await getDatabase();

    // Check if deck belongs to user
    const deck = await db.get(
      'SELECT * FROM decks WHERE deckid = ? AND user_id = ?',
      [deckid, uid]
    );

    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    // Remove deck
    await db.run('DELETE FROM decks WHERE deckid = ?', [deckid]);

    // Update user inventory
    const inventory = await db.get('SELECT * FROM inventories WHERE uid = ?', [uid]);
    const currentDeckIds = JSON.parse(inventory.deckid || '[]');
    const updatedDeckIds = currentDeckIds.filter(id => id !== deckid);

    await db.run(
      'UPDATE inventories SET deckid = ? WHERE uid = ?',
      [JSON.stringify(updatedDeckIds), uid]
    );

    return { message: 'Deck deleted successfully' };
  }
};
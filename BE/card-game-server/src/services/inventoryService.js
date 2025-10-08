import { getDatabase } from '../config/database.js';

export const inventoryService = {
  /**
 * Get user's decks with full details
 */
async getUserDecks(uid) {
  const db = await getDatabase();
  
  // Get user's inventory to find deck IDs
  const inventory = await db.get(
    'SELECT deckid FROM inventories WHERE uid = ?',
    [uid]
  );

  if (!inventory || !inventory.deckid) {
    return [];
  }

  const deckIds = JSON.parse(inventory.deckid);
  
  if (deckIds.length === 0) {
    return [];
  }

  // FIX: Build query correctly
  const placeholders = deckIds.map(() => '?').join(',');
  
  // IMPORTANT: user_id parameter must come AFTER all the deckid placeholders
  const decks = await db.all(
    `SELECT * FROM decks WHERE deckid IN (${placeholders}) AND user_id = ?`,
    [...deckIds, uid]  // This order is correct: [deck1, deck2, deck3, uid]
  );

  // Add debug logging
  console.log('📦 getUserDecks - Found decks:', decks.length, 'for user:', uid);
  console.log('📦 Deck IDs from inventory:', deckIds);
  console.log('📦 Fetched decks:', decks.map(d => d.deckid));

  return decks.map(deck => ({
    id: deck.id,
    deckid: deck.deckid,
    deck_name: deck.deck_name || `Deck ${deck.deckid}`,
    cardid: JSON.parse(deck.cardid || '[]'),
    user_id: deck.user_id,
    created_at: deck.created_at
  }));
},

  /**
   * Get cards in user's inventory
   */
  async getUserCards(uid) {
    const db = await getDatabase();
    
    // Get user's card IDs from inventory
    const inventory = await db.get(
      'SELECT cardid FROM inventories WHERE uid = ?',
      [uid]
    );

    if (!inventory || !inventory.cardid) {
      return [];
    }

    const cardIds = JSON.parse(inventory.cardid);
    
    if (cardIds.length === 0) {
      return [];
    }

    // Get card details
    const placeholders = cardIds.map(() => '?').join(',');
    const cards = await db.all(
      `SELECT * FROM cards WHERE idcard IN (${placeholders})`,
      cardIds
    );

    return cards.map(card => ({
      ...card,
      pawnLocations: JSON.parse(card.pawnLocations || '[]'),
      Ability: card.Ability === 1
    }));
  },

  /**
   * Get user's characters
   */
  async getUserCharacters(uid) {
    const db = await getDatabase();
    
    // Get user's character IDs from inventory
    const inventory = await db.get(
      'SELECT characterid FROM inventories WHERE uid = ?',
      [uid]
    );

    if (!inventory || !inventory.characterid) {
      return [];
    }

    const characterIds = JSON.parse(inventory.characterid);
    
    if (characterIds.length === 0) {
      return [];
    }

    // Get character details
    const placeholders = characterIds.map(() => '?').join(',');
    const characters = await db.all(
      `SELECT * FROM characters WHERE idcharacter IN (${placeholders})`,
      characterIds
    );

    return characters;
  },

  /**
   * Get cards NOT in a specific deck
   */
  async getAvailableCards(uid, deckid = null) {
    const db = await getDatabase();
    
    // Get all user's cards
    const userCards = await this.getUserCards(uid);
    
    if (!deckid) {
      return userCards;
    }

    // Get cards in the specified deck
    const deck = await db.get(
      'SELECT cardid FROM decks WHERE deckid = ? AND user_id = ?',
      [deckid, uid]
    );

    if (!deck) {
      return userCards;
    }

    const deckCardIds = JSON.parse(deck.cardid || '[]');
    
    // Filter out cards that are in the deck
    return userCards.filter(card => !deckCardIds.includes(card.idcard));
  },

  /**
   * Get cards in a specific deck
   */
  async getDeckCards(uid, deckid) {
    const db = await getDatabase();
    
    // Verify deck belongs to user
    const deck = await db.get(
      'SELECT cardid FROM decks WHERE deckid = ? AND user_id = ?',
      [deckid, uid]
    );

    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    const cardIds = JSON.parse(deck.cardid || '[]');
    
    if (cardIds.length === 0) {
      return [];
    }

    // Get card details
    const placeholders = cardIds.map(() => '?').join(',');
    const cards = await db.all(
      `SELECT * FROM cards WHERE idcard IN (${placeholders})`,
      cardIds
    );

    return cards.map(card => ({
      ...card,
      pawnLocations: JSON.parse(card.pawnLocations || '[]'),
      Ability: card.Ability === 1
    }));
  },

/**
 * Create new deck
 */
async createDeck(uid, { deckName, cardIds }) {
  const db = await getDatabase();

  // Validate deck size
  if (cardIds.length > 15) {
    throw new Error('Deck cannot have more than 15 cards');
  }

  if (cardIds.length === 0) {
    throw new Error('Deck must have at least 1 card');
  }

  // Verify user owns all cards
  const inventory = await db.get(
    'SELECT deckid, cardid FROM inventories WHERE uid = ?',
    [uid]
  );

  const userCardIds = JSON.parse(inventory.cardid || '[]');
  const invalidCards = cardIds.filter(id => !userCardIds.includes(id));

  if (invalidCards.length > 0) {
    throw new Error('You do not own some of the selected cards');
  }

  // Generate unique deck ID
  let deckid;
  let deckExists = true;
  while (deckExists) {
    deckid = Math.floor(1000 + Math.random() * 9000);
    const check = await db.get('SELECT deckid FROM decks WHERE deckid = ?', [deckid]);
    deckExists = !!check;
  }

  console.log('🆕 Creating deck:', deckid, 'for user:', uid);

  // Create deck
  await db.run(
    `INSERT INTO decks (deckid, user_id, cardid, deck_name, created_at) 
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [deckid, uid, JSON.stringify(cardIds), deckName || `Deck ${deckid}`]
  );

  // Update user inventory to include this deck
  const currentDeckIds = JSON.parse(inventory.deckid || '[]');
  currentDeckIds.push(deckid);

  console.log('📝 Updating inventory - Old deck IDs:', JSON.parse(inventory.deckid || '[]'));
  console.log('📝 Updating inventory - New deck IDs:', currentDeckIds);

  await db.run(
    'UPDATE inventories SET deckid = ? WHERE uid = ?',
    [JSON.stringify(currentDeckIds), uid]
  );

  // Verify the update
  const updatedInventory = await db.get(
    'SELECT deckid FROM inventories WHERE uid = ?',
    [uid]
  );
  console.log('✅ Inventory updated - Deck IDs:', JSON.parse(updatedInventory.deckid));

  // Return the created deck with all fields
  return {
    id: null, // Will be set by database auto-increment
    deckid,
    user_id: uid,
    cardid: cardIds,
    deck_name: deckName || `Deck ${deckid}`,
    created_at: new Date().toISOString()
  };
},

  /**
   * Update existing deck
   */
  async updateDeck(uid, deckid, { deckName, cardIds }) {
    const db = await getDatabase();

    // Verify deck belongs to user
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

    // Verify user owns all cards
    if (cardIds) {
      const inventory = await db.get(
        'SELECT cardid FROM inventories WHERE uid = ?',
        [uid]
      );

      const userCardIds = JSON.parse(inventory.cardid || '[]');
      const invalidCards = cardIds.filter(id => !userCardIds.includes(id));

      if (invalidCards.length > 0) {
        throw new Error('You do not own some of the selected cards');
      }
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

    // Verify deck belongs to user
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
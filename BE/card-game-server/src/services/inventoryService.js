import { InventoryRepository } from '../repositories/InventoryRepository.js';
import { DeckRepository } from '../repositories/DeckRepository.js';
import { CardRepository } from '../repositories/CardRepository.js';
import { CharacterRepository } from '../repositories/CharacterRepository.js';

const inventoryRepo = new InventoryRepository();
const deckRepo = new DeckRepository();
const cardRepo = new CardRepository();
const characterRepo = new CharacterRepository();

export const inventoryService = {
  async getUserDecks(uid) {
    // Get user's deck IDs from inventory
    const inventory = await inventoryRepo.findByUserId(uid);
    if (!inventory || inventory.deckid.length === 0) {
      return [];
    }

    // Get all decks in one query
    const decks = await deckRepo.findByUserId(uid);

    console.log('📦 getUserDecks - Found decks:', decks.length, 'for user:', uid);
    
    return decks.map(deck => ({
      id: deck.id,
      deckid: deck.deckid,
      deck_name: deck.deck_name || `Deck ${deck.deckid}`,
      cardid: deck.cardid,
      user_id: deck.user_id,
      created_at: deck.created_at
    }));
  },

  async getUserCards(uid) {
    const inventory = await inventoryRepo.findByUserId(uid);
    if (!inventory || inventory.cardid.length === 0) {
      return [];
    }

    return await cardRepo.getCardsByIds(inventory.cardid);
  },

  async getUserCharacters(uid) {
    const inventory = await inventoryRepo.findByUserId(uid);
    if (!inventory || inventory.characterid.length === 0) {
      return [];
    }

    return await characterRepo.getCharactersByIds(inventory.characterid);
  },

  async getAvailableCards(uid, deckid = null) {
    const userCards = await this.getUserCards(uid);
    
    if (!deckid) {
      return userCards;
    }

    // Get cards in the specified deck
    const deck = await deckRepo.findUserDeck(deckid, uid);
    if (!deck) {
      return userCards;
    }

    // Filter out cards that are in the deck
    return userCards.filter(card => !deck.cardid.includes(card.idcard));
  },

  async getDeckCards(uid, deckid) {
    // Verify deck belongs to user
    const deck = await deckRepo.findUserDeck(deckid, uid);
    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    return await cardRepo.getCardsByIds(deck.cardid);
  },

  async createDeck(uid, { deckName, cardIds }) {
    // Validate deck size
    if (cardIds.length > 15) {
      throw new Error('Deck cannot have more than 15 cards');
    }

    if (cardIds.length === 0) {
      throw new Error('Deck must have at least 1 card');
    }

    // Verify user owns all cards
    const inventory = await inventoryRepo.findByUserId(uid);
    const invalidCards = cardIds.filter(id => !inventory.cardid.includes(id));

    if (invalidCards.length > 0) {
      throw new Error('You do not own some of the selected cards');
    }

    // Generate unique deck ID
    let deckid;
    let deckExists = true;
    while (deckExists) {
      deckid = Math.floor(1000 + Math.random() * 9000);
      deckExists = await deckRepo.exists('deckid = ?', [deckid]);
    }

    console.log('🆕 Creating deck:', deckid, 'for user:', uid);

    // Create deck
    await deckRepo.createDeck({
      deckid,
      user_id: uid,
      cardid: cardIds,
      deck_name: deckName || `Deck ${deckid}`
    });

    // Update user inventory
    await inventoryRepo.addDeck(uid, deckid);

    console.log('✅ Deck created successfully');

    return {
      id: null,
      deckid,
      user_id: uid,
      cardid: cardIds,
      deck_name: deckName || `Deck ${deckid}`,
      created_at: new Date().toISOString()
    };
  },

  async updateDeck(uid, deckid, { deckName, cardIds }) {
    // Verify deck belongs to user
    const deck = await deckRepo.findUserDeck(deckid, uid);
    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    // Validate deck size
    if (cardIds && cardIds.length > 15) {
      throw new Error('Deck cannot have more than 15 cards');
    }

    // Verify user owns all cards
    if (cardIds) {
      const inventory = await inventoryRepo.findByUserId(uid);
      const invalidCards = cardIds.filter(id => !inventory.cardid.includes(id));

      if (invalidCards.length > 0) {
        throw new Error('You do not own some of the selected cards');
      }
    }

    // Update deck
    await deckRepo.updateDeck(deckid, uid, {
      deck_name: deckName,
      cardid: cardIds
    });

    // Return updated deck
    const updatedDeck = await deckRepo.findUserDeck(deckid, uid);
    return updatedDeck;
  },

  async deleteDeck(uid, deckid) {
    // Verify deck belongs to user
    const deck = await deckRepo.findUserDeck(deckid, uid);
    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    // Remove deck
    await deckRepo.deleteDeck(deckid, uid);

    // Update user inventory
    await inventoryRepo.removeDeck(uid, deckid);

    return { message: 'Deck deleted successfully' };
  }
};

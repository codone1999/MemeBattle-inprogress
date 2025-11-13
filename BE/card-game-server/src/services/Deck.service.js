const DeckRepository = require('../repositories/Deck.repository');
const InventoryRepository = require('../repositories/inventory.repository');
const Card = require('../models/Card.model');
const Character = require('../models/Character.model');

/**
 * Custom API Error
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

class DeckService {
  constructor() {
    this.deckRepository = new DeckRepository();
    this.inventoryRepository = new InventoryRepository();
  }

  /**
   * Create a new deck
   * @param {Object} deckData - Deck creation data
   * @param {string} userId - User ID creating the deck
   * @returns {Promise<Object>} - Created deck
   */
  async createDeck(deckData, userId) {
    // BR-6: Check if user has reached max deck limit (10 decks)
    const userDeckCount = await this.deckRepository.countByUserId(userId);

    if (userDeckCount >= 10) {
      throw new ApiError(400, 'Maximum deck limit reached. You can have up to 10 decks.');
    }

    // Validate character ownership and existence
    await this._validateCharacterOwnership(deckData.characterId, userId);

    // Validate card ownership and existence
    await this._validateCardOwnership(
      deckData.cards.map(c => c.cardId), 
      userId
    );

    // BR-7: If this deck is set as active, deactivate all other user decks
    if (deckData.isActive) {
      await this.deckRepository.deactivateAllUserDecks(userId);
    }

    // Assign positions to cards if not provided
    const cardsWithPositions = deckData.cards.map((card, index) => ({
      cardId: card.cardId,
      position: card.position !== undefined ? card.position : index
    }));

    // Create the deck
    const newDeck = await this.deckRepository.create({
      deckTitle: deckData.deckTitle,
      userId: userId,
      characterId: deckData.characterId,
      cards: cardsWithPositions,
      isActive: deckData.isActive || false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Return populated deck
    return await this.deckRepository.findByIdPopulated(newDeck._id);
  }

  /**
   * Get all decks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of user decks
   */
  async getUserDecks(userId) {
    return await this.deckRepository.findByUserId(userId);
  }

  /**
   * Get a specific deck by ID
   * @param {string} deckId - Deck ID
   * @param {string} userId - User ID (for ownership verification)
   * @returns {Promise<Object>} - Deck details
   */
  async getDeckById(deckId, userId) {
    const deck = await this.deckRepository.findByIdPopulated(deckId);

    if (!deck) {
      throw new ApiError(404, 'Deck not found');
    }

    // Verify ownership
    if (deck.userId.toString() !== userId.toString()) {
      throw new ApiError(403, 'Access denied. You do not own this deck.');
    }

    return deck;
  }

  /**
   * Update a deck
   * @param {string} deckId - Deck ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID (for ownership verification)
   * @returns {Promise<Object>} - Updated deck
   */
  async updateDeck(deckId, updateData, userId) {
    // Check if deck exists and user owns it
    const deck = await this.deckRepository.findById(deckId);

    if (!deck) {
      throw new ApiError(404, 'Deck not found');
    }

    if (deck.userId.toString() !== userId.toString()) {
      throw new ApiError(403, 'Access denied. You do not own this deck.');
    }

    // Validate character if being updated
    if (updateData.characterId) {
      await this._validateCharacterOwnership(updateData.characterId, userId);
    }

    // Validate cards if being updated
    if (updateData.cards) {
      await this._validateCardOwnership(
        updateData.cards.map(c => c.cardId), 
        userId
      );

      // Assign positions to cards if not provided
      updateData.cards = updateData.cards.map((card, index) => ({
        cardId: card.cardId,
        position: card.position !== undefined ? card.position : index
      }));
    }

    // BR-7: Handle active deck status
    if (updateData.isActive === true && !deck.isActive) {
      // Deactivate all other user decks
      await this.deckRepository.deactivateAllUserDecks(userId, deck._id);
    }

    // Update the deck
    await this.deckRepository.updateById(deckId, updateData);

    // Return populated deck
    return await this.deckRepository.findByIdPopulated(deckId);
  }

  /**
   * Delete a deck
   * @param {string} deckId - Deck ID
   * @param {string} userId - User ID (for ownership verification)
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteDeck(deckId, userId) {
    const deck = await this.deckRepository.findById(deckId);

    if (!deck) {
      throw new ApiError(404, 'Deck not found');
    }

    if (deck.userId.toString() !== userId.toString()) {
      throw new ApiError(403, 'Access denied. You do not own this deck.');
    }

    await this.deckRepository.deleteById(deckId);

    return {
      message: 'Deck deleted successfully',
      deletedDeckId: deckId
    };
  }

  /**
   * Set a deck as active
   * @param {string} deckId - Deck ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated deck
   */
  async setActiveDeck(deckId, userId) {
    const deck = await this.deckRepository.findById(deckId);

    if (!deck) {
      throw new ApiError(404, 'Deck not found');
    }

    if (deck.userId.toString() !== userId.toString()) {
      throw new ApiError(403, 'Access denied. You do not own this deck.');
    }

    // Deactivate all other user decks
    await this.deckRepository.deactivateAllUserDecks(userId, deck._id);

    // Activate this deck
    await this.deckRepository.updateById(deckId, { isActive: true });

    // Return populated deck
    return await this.deckRepository.findByIdPopulated(deckId);
  }

  /**
   * Get user's active deck
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Active deck or null
   */
  async getActiveDeck(userId) {
    return await this.deckRepository.findActiveDeck(userId);
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Validate that user owns the character
   * @param {string} characterId - Character ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async _validateCharacterOwnership(characterId, userId) {
    // Check if character exists
    const character = await Character.findById(characterId);
    if (!character) {
      throw new ApiError(404, `Character with ID ${characterId} not found`);
    }

    // Check if user owns the character using inventory repository
    const hasCharacter = await this.inventoryRepository.hasCharacter(userId, characterId);

    if (!hasCharacter) {
      throw new ApiError(403, `You do not own character: ${character.name}`);
    }

    return true;
  }

  /**
   * Validate that user owns all the cards
   * @param {Array<string>} cardIds - Array of card IDs
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async _validateCardOwnership(cardIds, userId) {
    // Check if all cards exist
    const cards = await Card.find({ _id: { $in: cardIds } });

    if (cards.length !== cardIds.length) {
      const foundCardIds = cards.map(c => c._id.toString());
      const missingCardIds = cardIds.filter(id => !foundCardIds.includes(id.toString()));
      throw new ApiError(404, `Cards not found: ${missingCardIds.join(', ')}`);
    }

    // Check if user owns all the cards using inventory repository
    const missingCards = [];
    
    for (const cardId of cardIds) {
      const hasCard = await this.inventoryRepository.hasCard(userId, cardId);
      
      if (!hasCard) {
        const card = cards.find(c => c._id.toString() === cardId.toString());
        missingCards.push(card ? card.name : cardId);
      }
    }

    if (missingCards.length > 0) {
      throw new ApiError(
        403, 
        `You do not own the following cards: ${missingCards.join(', ')}`
      );
    }

    return true;
  }
}

module.exports = DeckService;
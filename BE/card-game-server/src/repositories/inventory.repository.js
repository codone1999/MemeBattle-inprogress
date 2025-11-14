const Inventory = require('../models/Inventory.model');
const mongoose = require('mongoose');

class InventoryRepository {
  /**
   * Create a new inventory for user
   * @param {string} userId - User ID
   * @param {Array} cards - Initial cards
   * @param {Array} characters - Initial characters
   * @returns {Promise<Object>} - Created inventory
   */
  async create(userId, cards = [], characters = []) {
    const inventory = new Inventory({
      userId,
      cards,
      characters
    });
    return await inventory.save();
  }

  /**
   * Find inventory by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Inventory or null
   */
  async findByUserId(userId) {
    return await Inventory.findOne({ userId })
      .populate('cards.cardId')
      .populate('characters.characterId');
  }

  /**
   * Add card to inventory
   * @param {string} userId - User ID
   * @param {string} cardId - Card ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object|null>} - Updated inventory
   */
  async addCard(userId, cardId, quantity = 1) {
    // Check if card already exists in inventory
    const inventory = await Inventory.findOne({ userId });
    
    if (!inventory) {
      return null;
    }

    const existingCard = inventory.cards.find(c => c.cardId.toString() === cardId.toString());

    if (existingCard) {
      // Increase quantity if card exists
      return await Inventory.findOneAndUpdate(
        { userId, 'cards.cardId': cardId },
        { $inc: { 'cards.$.quantity': quantity } },
        { new: true }
      ).populate('cards.cardId').populate('characters.characterId');
    } else {
      // Add new card if doesn't exist
      return await Inventory.findOneAndUpdate(
        { userId },
        { 
          $push: { 
            cards: { 
              cardId, 
              quantity,
              acquiredAt: new Date()
            } 
          } 
        },
        { new: true }
      ).populate('cards.cardId').populate('characters.characterId');
    }
  }

  /**
   * Add multiple cards to inventory
   * @param {string} userId - User ID
   * @param {Array} cards - Array of {cardId, quantity}
   * @returns {Promise<Object|null>} - Updated inventory
   */
  async addCards(userId, cards) {
    const inventory = await Inventory.findOne({ userId });
    
    if (!inventory) {
      return null;
    }

    for (const card of cards) {
      await this.addCard(userId, card.cardId, card.quantity || 1);
    }

    return await this.findByUserId(userId);
  }

  /**
   * Add character to inventory
   * @param {string} userId - User ID
   * @param {string} characterId - Character ID
   * @returns {Promise<Object|null>} - Updated inventory
   */
  async addCharacter(userId, characterId) {
    // Check if character already exists
    const inventory = await Inventory.findOne({ userId });
    
    if (!inventory) {
      return null;
    }

    const hasCharacter = inventory.characters.some(
      c => c.characterId.toString() === characterId.toString()
    );

    if (hasCharacter) {
      return inventory; // Already owns this character
    }

    return await Inventory.findOneAndUpdate(
      { userId },
      { 
        $push: { 
          characters: { 
            characterId,
            acquiredAt: new Date()
          } 
        } 
      },
      { new: true }
    ).populate('cards.cardId').populate('characters.characterId');
  }

  /**
   * Add multiple characters to inventory
   * @param {string} userId - User ID
   * @param {Array} characterIds - Array of character IDs
   * @returns {Promise<Object|null>} - Updated inventory
   */
  async addCharacters(userId, characterIds) {
    for (const characterId of characterIds) {
      await this.addCharacter(userId, characterId);
    }

    return await this.findByUserId(userId);
  }

  /**
   * Remove card from inventory
   * @param {string} userId - User ID
   * @param {string} cardId - Card ID
   * @param {number} quantity - Quantity to remove
   * @returns {Promise<Object|null>} - Updated inventory
   */
  async removeCard(userId, cardId, quantity = 1) {
    const inventory = await Inventory.findOne({ userId });
    
    if (!inventory) {
      return null;
    }

    const card = inventory.cards.find(c => c.cardId.toString() === cardId.toString());

    if (!card) {
      return inventory; // Card doesn't exist
    }

    if (card.quantity <= quantity) {
      // Remove card completely if quantity becomes 0 or less
      return await Inventory.findOneAndUpdate(
        { userId },
        { $pull: { cards: { cardId } } },
        { new: true }
      ).populate('cards.cardId').populate('characters.characterId');
    } else {
      // Decrease quantity
      return await Inventory.findOneAndUpdate(
        { userId, 'cards.cardId': cardId },
        { $inc: { 'cards.$.quantity': -quantity } },
        { new: true }
      ).populate('cards.cardId').populate('characters.characterId');
    }
  }

  /**
   * Get user's card count
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Total card count
   */
  async getCardCount(userId) {
    const inventory = await Inventory.findOne({ userId });
    
    if (!inventory) {
      return 0;
    }

    return inventory.cards.reduce((sum, card) => sum + card.quantity, 0);
  }

  /**
   * Get user's character count
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Total character count
   */
  async getCharacterCount(userId) {
    const inventory = await Inventory.findOne({ userId });
    
    if (!inventory) {
      return 0;
    }

    return inventory.characters.length;
  }

  /**
   * Check if user has card
   * @param {string} userId - User ID
   * @param {string} cardId - Card ID
   * @returns {Promise<boolean>} - True if user has card
   */
  async hasCard(userId, cardId) {
    const inventory = await Inventory.findOne({ 
      userId,
      'cards.cardId': cardId
    });
    return !!inventory;
  }

  /**
   * Check if user has character
   * @param {string} userId - User ID
   * @param {string} characterId - Character ID
   * @returns {Promise<boolean>} - True if user has character
   */
  async hasCharacter(userId, characterId) {
    const inventory = await Inventory.findOne({ 
      userId,
      'characters.characterId': characterId
    });
    return !!inventory;
  }
}

module.exports = InventoryRepository;
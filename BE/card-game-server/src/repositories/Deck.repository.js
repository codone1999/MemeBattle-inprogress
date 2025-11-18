const Deck = require('../models/Deck.model');

/**
 * Deck Repository
 * Handles all database operations for decks
 */
class DeckRepository {
  /**
   * Create a new deck
   * @param {Object} deckData - Deck data
   * @returns {Promise<Object>} - Created deck
   */
  async create(deckData) {
    const deck = new Deck(deckData);
    return await deck.save();
  }

  /**
   * Find deck by ID
   * @param {string} deckId - Deck ID
   * @returns {Promise<Object|null>} - Deck or null
   */
  async findById(deckId) {
    return await Deck.findById(deckId);
  }

  /**
   * Find deck by ID with population
   * @param {string} deckId - Deck ID
   * @returns {Promise<Object|null>} - Populated deck or null
   */
  async findByIdPopulated(deckId) {
    return await Deck.findById(deckId)
      // Character population removed
      .populate('cards.cardId', 'name power rarity cardType cardImage cardInfo pawnRequirement pawnLocations ability');
  }

  /**
   * Find all decks by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of decks
   */
  async findByUserId(userId) {
    return await Deck.find({ userId })
      // Character population removed
      .populate('cards.cardId', 'name power rarity cardType cardImage')
      .sort({ isActive: -1, createdAt: -1 });
  }

  /**
   * Find active deck for user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Active deck or null
   */
  async findActiveDeck(userId) {
    return await Deck.findOne({ userId, isActive: true })
      // Character population removed
      .populate('cards.cardId', 'name power rarity cardType cardImage pawnRequirement');
  }

  /**
   * Update deck by ID
   * @param {string} deckId - Deck ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated deck
   */
  async updateById(deckId, updateData) {
    return await Deck.findByIdAndUpdate(
      deckId,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete deck by ID
   * @param {string} deckId - Deck ID
   * @returns {Promise<Object|null>} - Deleted deck
   */
  async deleteById(deckId) {
    return await Deck.findByIdAndDelete(deckId);
  }

  /**
   * Count decks by user ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of decks
   */
  async countByUserId(userId) {
    return await Deck.countDocuments({ userId });
  }

  /**
   * Deactivate all user decks except specified one
   * @param {string} userId - User ID
   * @param {string} excludeDeckId - Deck ID to exclude (optional)
   * @returns {Promise<Object>} - Update result
   */
  async deactivateAllUserDecks(userId, excludeDeckId = null) {
    const filter = { userId, isActive: true };
    
    if (excludeDeckId) {
      filter._id = { $ne: excludeDeckId };
    }

    return await Deck.updateMany(
      filter,
      { $set: { isActive: false, updatedAt: new Date() } }
    );
  }

  /**
   * Check if user owns a deck
   * @param {string} deckId - Deck ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if user owns deck
   */
  async isOwner(deckId, userId) {
    const deck = await Deck.findOne({ _id: deckId, userId });
    return !!deck;
  }

  /**
   * Check if deck exists
   * @param {string} deckId - Deck ID
   * @returns {Promise<boolean>} - True if deck exists
   */
  async exists(deckId) {
    const count = await Deck.countDocuments({ _id: deckId });
    return count > 0;
  }

  /**
   * Get all decks with filters
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of decks
   */
  async findAll(filter = {}, options = {}) {
    let query = Deck.find(filter);

    if (options.populate) {
      query = query
        // Character population removed
        .populate('cards.cardId', 'name power rarity cardType');
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    return await query;
  }
}

module.exports = DeckRepository;
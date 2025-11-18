const Card = require('../models/Card.model');

/**
 * Card Repository
 * Handles database operations for cards
 */
class CardRepository {
  /**
   * Find card by ID
   * @param {string} cardId - Card ID
   * @returns {Promise<Object|null>} - Card or null
   */
  async findById(cardId) {
    return await Card.findById(cardId).lean();
  }

  /**
   * Find multiple cards by IDs
   * @param {Array<string>} cardIds - Array of card IDs
   * @returns {Promise<Array>} - Array of cards
   */
  async findByIds(cardIds) {
    return await Card.find({
      _id: { $in: cardIds }
    }).lean();
  }

  /**
   * Find all cards
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Cards and pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      rarity,
      cardType,
      sortBy = 'name'
    } = options;

    const query = {};
    if (rarity) query.rarity = rarity;
    if (cardType) query.cardType = cardType;

    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
      Card.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),
      Card.countDocuments(query)
    ]);

    return {
      cards,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find cards by rarity
   * @param {string} rarity - Card rarity
   * @returns {Promise<Array>} - Array of cards
   */
  async findByRarity(rarity) {
    return await Card.find({ rarity }).lean();
  }

  /**
   * Find cards by type
   * @param {string} cardType - Card type (standard, buff, debuff)
   * @returns {Promise<Array>} - Array of cards
   */
  async findByType(cardType) {
    return await Card.find({ cardType }).lean();
  }

  /**
   * Find cards by pawn requirement
   * @param {number} pawnRequirement - Pawn requirement
   * @returns {Promise<Array>} - Array of cards
   */
  async findByPawnRequirement(pawnRequirement) {
    return await Card.find({ pawnRequirement }).lean();
  }

  /**
   * Search cards by name
   * @param {string} searchTerm - Search term
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} - Array of cards
   */
  async searchByName(searchTerm, limit = 20) {
    return await Card.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
      .limit(limit)
      .lean();
  }

  /**
   * Get random cards
   * @param {number} count - Number of cards to get
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} - Random cards
   */
  async getRandomCards(count, filters = {}) {
    return await Card.aggregate([
      { $match: filters },
      { $sample: { size: count } }
    ]);
  }

  /**
   * Count cards by filters
   * @param {Object} filters - Query filters
   * @returns {Promise<number>} - Count
   */
  async count(filters = {}) {
    return await Card.countDocuments(filters);
  }

  /**
   * Check if card exists
   * @param {string} cardId - Card ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(cardId) {
    const count = await Card.countDocuments({ _id: cardId });
    return count > 0;
  }

  /**
   * Create a new card (admin)
   * @param {Object} cardData - Card data
   * @returns {Promise<Object>} - Created card
   */
  async create(cardData) {
    const card = new Card(cardData);
    return await card.save();
  }

  /**
   * Update card by ID (admin)
   * @param {string} cardId - Card ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated card
   */
  async updateById(cardId, updateData) {
    return await Card.findByIdAndUpdate(
      cardId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete card by ID (admin)
   * @param {string} cardId - Card ID
   * @returns {Promise<Object|null>} - Deleted card
   */
  async deleteById(cardId) {
    return await Card.findByIdAndDelete(cardId);
  }

  /**
   * Get cards grouped by rarity
   * @returns {Promise<Object>} - Cards grouped by rarity
   */
  async getGroupedByRarity() {
    return await Card.aggregate([
      {
        $group: {
          _id: '$rarity',
          cards: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
  }

  /**
   * Get cards grouped by type
   * @returns {Promise<Object>} - Cards grouped by type
   */
  async getGroupedByType() {
    return await Card.aggregate([
      {
        $group: {
          _id: '$cardType',
          cards: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
  }
}

module.exports = CardRepository;
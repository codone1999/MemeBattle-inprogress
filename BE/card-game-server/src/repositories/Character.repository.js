const Character = require('../models/Character.model');

/**
 * Character Repository
 * Handles database operations for characters
 */
class CharacterRepository {
  /**
   * Find character by ID
   * @param {string} characterId - Character ID
   * @returns {Promise<Object|null>} - Character or null
   */
  async findById(characterId) {
    return await Character.findById(characterId).lean();
  }

  /**
   * Find multiple characters by IDs
   * @param {Array<string>} characterIds - Array of character IDs
   * @returns {Promise<Array>} - Array of characters
   */
  async findByIds(characterIds) {
    return await Character.find({
      _id: { $in: characterIds }
    }).lean();
  }

  /**
   * Find all characters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Characters and pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      rarity,
      sortBy = 'name'
    } = options;

    const query = {};
    if (rarity) query.rarity = rarity;

    const skip = (page - 1) * limit;

    const [characters, total] = await Promise.all([
      Character.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),
      Character.countDocuments(query)
    ]);

    return {
      characters,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find characters by rarity
   * @param {string} rarity - Character rarity
   * @returns {Promise<Array>} - Array of characters
   */
  async findByRarity(rarity) {
    return await Character.find({ rarity }).lean();
  }

  /**
   * Search characters by name
   * @param {string} searchTerm - Search term
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} - Array of characters
   */
  async searchByName(searchTerm, limit = 20) {
    return await Character.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
      .limit(limit)
      .lean();
  }

  /**
   * Get random characters
   * @param {number} count - Number of characters to get
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} - Random characters
   */
  async getRandomCharacters(count, filters = {}) {
    return await Character.aggregate([
      { $match: filters },
      { $sample: { size: count } }
    ]);
  }

  /**
   * Count characters by filters
   * @param {Object} filters - Query filters
   * @returns {Promise<number>} - Count
   */
  async count(filters = {}) {
    return await Character.countDocuments(filters);
  }

  /**
   * Check if character exists
   * @param {string} characterId - Character ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(characterId) {
    const count = await Character.countDocuments({ _id: characterId });
    return count > 0;
  }

  /**
   * Create a new character (admin)
   * @param {Object} characterData - Character data
   * @returns {Promise<Object>} - Created character
   */
  async create(characterData) {
    const character = new Character(characterData);
    return await character.save();
  }

  /**
   * Update character by ID (admin)
   * @param {string} characterId - Character ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated character
   */
  async updateById(characterId, updateData) {
    return await Character.findByIdAndUpdate(
      characterId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete character by ID (admin)
   * @param {string} characterId - Character ID
   * @returns {Promise<Object|null>} - Deleted character
   */
  async deleteById(characterId) {
    return await Character.findByIdAndDelete(characterId);
  }

  /**
   * Get characters grouped by rarity
   * @returns {Promise<Object>} - Characters grouped by rarity
   */
  async getGroupedByRarity() {
    return await Character.aggregate([
      {
        $group: {
          _id: '$rarity',
          characters: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
  }

  /**
   * Get popular characters (most used in games)
   * @param {number} limit - Number of characters to return
   * @returns {Promise<Array>} - Popular characters
   */
  async getPopularCharacters(limit = 10) {
    const Game = require('../models/Game.model');
    
    return await Game.aggregate([
      { $unwind: '$players' },
      {
        $group: {
          _id: '$players.characterId',
          usageCount: { $sum: 1 }
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'characters',
          localField: '_id',
          foreignField: '_id',
          as: 'character'
        }
      },
      { $unwind: '$character' },
      {
        $project: {
          _id: '$character._id',
          name: '$character.name',
          characterPic: '$character.characterPic',
          rarity: '$character.rarity',
          usageCount: 1
        }
      }
    ]);
  }
}

module.exports = CharacterRepository;
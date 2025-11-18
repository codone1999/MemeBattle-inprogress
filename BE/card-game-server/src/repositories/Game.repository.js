const Game = require('../models/Game.model');
const mongoose = require('mongoose');

/**
 * Game Repository
 * Handles database operations for completed games
 */
class GameRepository {
  /**
   * Create a new game record
   * @param {Object} gameData - Game data
   * @returns {Promise<Object>} - Created game
   */
  async create(gameData) {
    const game = new Game(gameData);
    return await game.save();
  }

  /**
   * Find game by ID
   * @param {string} gameId - Game ID
   * @returns {Promise<Object|null>} - Game or null
   */
  async findById(gameId) {
    return await Game.findById(gameId)
      .populate('players.userId', 'username displayName profilePic')
      .populate('players.deckId', 'deckTitle')
      .populate('players.characterId', 'name characterPic')
      .populate('mapId', 'name image')
      .populate('winner', 'username displayName profilePic');
  }

  /**
   * Find games by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Games and pagination
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status = 'completed'
    } = options;

    const skip = (page - 1) * limit;

    const query = {
      'players.userId': userId,
      status
    };

    const [games, total] = await Promise.all([
      Game.find(query)
        .populate('players.userId', 'username displayName profilePic')
        .populate('winner', 'username displayName')
        .populate('mapId', 'name')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Game.countDocuments(query)
    ]);

    return {
      games,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user's recent games
   * @param {string} userId - User ID
   * @param {number} limit - Number of games to return
   * @returns {Promise<Array>} - Recent games
   */
  async getRecentGames(userId, limit = 10) {
    return await Game.find({
      'players.userId': userId,
      status: 'completed'
    })
      .populate('players.userId', 'username displayName profilePic')
      .populate('winner', 'username displayName')
      .populate('mapId', 'name')
      .sort({ completedAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get game statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Statistics
   */
  async getUserStats(userId) {
    const stats = await Game.aggregate([
      {
        $match: {
          'players.userId': mongoose.Types.ObjectId(userId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [
                { $eq: ['$winner', mongoose.Types.ObjectId(userId)] },
                1,
                0
              ]
            }
          },
          totalScore: {
            $sum: {
              $reduce: {
                input: '$players',
                initialValue: 0,
                in: {
                  $cond: [
                    { $eq: ['$$this.userId', mongoose.Types.ObjectId(userId)] },
                    '$$this.finalScore',
                    '$$value'
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averageScore: 0
      };
    }

    const result = stats[0];
    return {
      totalGames: result.totalGames,
      wins: result.wins,
      losses: result.totalGames - result.wins,
      winRate: result.totalGames > 0 
        ? ((result.wins / result.totalGames) * 100).toFixed(2) 
        : 0,
      averageScore: result.totalGames > 0 
        ? (result.totalScore / result.totalGames).toFixed(2) 
        : 0
    };
  }

  /**
   * Get leaderboard
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Top players
   */
  async getLeaderboard(options = {}) {
    const { limit = 100 } = options;

    return await Game.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $unwind: '$players'
      },
      {
        $group: {
          _id: '$players.userId',
          totalGames: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ['$winner', '$players.userId'] }, 1, 0]
            }
          },
          totalScore: { $sum: '$players.finalScore' }
        }
      },
      {
        $project: {
          userId: '$_id',
          totalGames: 1,
          wins: 1,
          winRate: {
            $multiply: [
              { $divide: ['$wins', '$totalGames'] },
              100
            ]
          },
          averageScore: { $divide: ['$totalScore', '$totalGames'] }
        }
      },
      {
        $sort: { winRate: -1, wins: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: 1,
          username: '$user.username',
          displayName: '$user.displayName',
          profilePic: '$user.profilePic',
          totalGames: 1,
          wins: 1,
          winRate: 1,
          averageScore: 1
        }
      }
    ]);
  }

  /**
   * Count total games
   * @param {Object} filters - Query filters
   * @returns {Promise<number>} - Count
   */
  async count(filters = {}) {
    return await Game.countDocuments(filters);
  }

  /**
   * Update game by ID
   * @param {string} gameId - Game ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated game
   */
  async updateById(gameId, updateData) {
    return await Game.findByIdAndUpdate(
      gameId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete game by ID
   * @param {string} gameId - Game ID
   * @returns {Promise<Object|null>} - Deleted game
   */
  async deleteById(gameId) {
    return await Game.findByIdAndDelete(gameId);
  }

  /**
   * Get game history between two players
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {number} limit - Number of games
   * @returns {Promise<Array>} - Games between players
   */
  async getGamesBetweenPlayers(userId1, userId2, limit = 10) {
    return await Game.find({
      'players.userId': { $all: [userId1, userId2] },
      status: 'completed'
    })
      .populate('players.userId', 'username displayName profilePic')
      .populate('winner', 'username displayName')
      .populate('mapId', 'name')
      .sort({ completedAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = GameRepository;
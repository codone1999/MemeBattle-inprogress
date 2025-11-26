const GameLobby = require('../models/Gamelobby.model');
const mongoose = require('mongoose');
require('../models/Map.model')

/**
 * Lobby Repository
 * Handles all database operations for game lobbies
 */
class LobbyRepository {
async create(lobbyData) {
    const lobby = new GameLobby(lobbyData);
    return await lobby.save();
  }

  async findById(lobbyId) {
    return await GameLobby.findById(lobbyId);
  }

  async findByIdPopulated(lobbyId) {
    return await GameLobby.findById(lobbyId)
      .populate('hostUserId', 'uid username displayName profilePic isOnline')
      .populate('mapId', 'name image gridSize difficulty themeColor')
      .populate({
        path: 'players.userId',
        select: 'uid username displayName profilePic isOnline'
      })
      .populate({
        path: 'players.deckId',
        select: 'deckTitle cards', // REMOVED characterId from deck select
      })
      .populate({
        path: 'players.characterId', // Direct populate of the manually selected character
        select: 'name characterPic rarity'
      });
  }

  /**
   * Get all public lobbies (waiting status, not full)
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options (pagination, etc)
   * @returns {Promise<Object>} - Lobbies and pagination info
   */
  async findPublicLobbies(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      status = 'waiting',
      showFull = false
    } = options;

    const query = {
      isPrivate: false,
      status: status,
      ...filters
    };

    // Don't show full lobbies unless requested
    if (!showFull) {
      query.$expr = { $lt: [{ $size: '$players' }, '$maxPlayers'] };
    }

    const skip = (page - 1) * limit;

    const [lobbies, total] = await Promise.all([
      GameLobby.find(query)
        .populate('hostUserId', 'username displayName profilePic')
        .populate('mapId', 'name image difficulty')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GameLobby.countDocuments(query)
    ]);

    return {
      lobbies,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find lobbies by user ID (host or player)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of lobbies
   */
  async findByUserId(userId) {
    return await GameLobby.find({
      $or: [
        { hostUserId: userId },
        { 'players.userId': userId }
      ],
      status: { $in: ['waiting', 'ready', 'started'] }
    })
      .populate('hostUserId', 'username displayName')
      .populate('mapId', 'name')
      .sort({ createdAt: -1 });
  }

  /**
   * Find active lobby for user (where they're currently in)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Active lobby or null
   */
  async findActiveByUserId(userId) {
    return await GameLobby.findOne({
      'players.userId': userId,
      status: { $in: ['waiting', 'ready', 'started'] }
    }).populate('hostUserId', 'username displayName profilePic');
  }

  /**
   * Update lobby by ID
   * @param {string} lobbyId - Lobby ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated lobby
   */
  async updateById(lobbyId, updateData) {
    return await GameLobby.findByIdAndUpdate(
      lobbyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Add player to lobby
   * @param {string} lobbyId - Lobby ID
   * @param {Object} playerData - Player data {userId, deckId}
   * @returns {Promise<Object|null>} - Updated lobby
   */
  async addPlayer(lobbyId, playerData) {
    return await GameLobby.findByIdAndUpdate(
      lobbyId,
      {
        $push: {
          players: {
            userId: playerData.userId,
            deckId: playerData.deckId || null,
            isReady: false,
            joinedAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  /**
   * Remove player from lobby
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Updated lobby
   */
  async removePlayer(lobbyId, userId) {
    return await GameLobby.findByIdAndUpdate(
      lobbyId,
      { $pull: { players: { userId } } },
      { new: true }
    );
  }

  /**
   * Update player's deck in lobby
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @param {string} deckId - Deck ID
   * @returns {Promise<Object|null>} - Updated lobby
   */
  async updatePlayerDeck(lobbyId, userId, deckId) {
    return await GameLobby.findOneAndUpdate(
      { _id: lobbyId, 'players.userId': userId },
      {
        $set: {
          'players.$.deckId': deckId
        }
      },
      { new: true }
    );
  }

  /**
   * Update player's character in lobby
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @param {string} characterId - Character ID
   * @returns {Promise<Object|null>} - Updated lobby
   */
  async updatePlayerCharacter(lobbyId, userId, characterId) {
    return await GameLobby.findOneAndUpdate(
      { _id: lobbyId, 'players.userId': userId },
      {
        $set: {
          'players.$.characterId': characterId
        }
      },
      { new: true }
    );
  }

  /**
   * Update player ready status
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @param {boolean} isReady - Ready status
   * @returns {Promise<Object|null>} - Updated lobby
   */
  async updatePlayerReady(lobbyId, userId, isReady) {
    return await GameLobby.findOneAndUpdate(
      { _id: lobbyId, 'players.userId': userId },
      {
        $set: { 'players.$.isReady': isReady }
      },
      { new: true }
    );
  }

  /**
   * Update lobby status
   * @param {string} lobbyId - Lobby ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} - Updated lobby
   */
  async updateStatus(lobbyId, status) {
    const updateData = { status };
    
    if (status === 'started') {
      updateData.startedAt = new Date();
    }

    return await GameLobby.findByIdAndUpdate(
      lobbyId,
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Transfer host to another player
   * @param {string} lobbyId - Lobby ID
   * @param {string} newHostUserId - New host user ID
   * @returns {Promise<Object|null>} - Updated lobby
   */
  async transferHost(lobbyId, newHostUserId) {
    return await GameLobby.findByIdAndUpdate(
      lobbyId,
      { $set: { hostUserId: newHostUserId } },
      { new: true }
    );
  }

  /**
   * Delete lobby by ID
   * @param {string} lobbyId - Lobby ID
   * @returns {Promise<Object|null>} - Deleted lobby
   */
  async deleteById(lobbyId) {
    return await GameLobby.findByIdAndDelete(lobbyId);
  }

  /**
   * Check if lobby exists
   * @param {string} lobbyId - Lobby ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(lobbyId) {
    const count = await GameLobby.countDocuments({ _id: lobbyId });
    return count > 0;
  }

  /**
   * Count lobbies by filters
   * @param {Object} filters - Query filters
   * @returns {Promise<number>} - Count
   */
  async count(filters = {}) {
    return await GameLobby.countDocuments(filters);
  }

  /**
   * Clean up expired or cancelled lobbies
   * @returns {Promise<Object>} - Delete result
   */
  async cleanupOldLobbies() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    return await GameLobby.deleteMany({
      $or: [
        { status: 'cancelled' },
        {
          status: 'waiting',
          createdAt: { $lt: thirtyMinutesAgo }
        }
      ]
    });
  }

  /**
   * Find lobbies that need cleanup (for cron jobs)
   * @returns {Promise<Array>} - Array of lobby IDs
   */
  async findExpiredLobbies() {
    const now = new Date();
    
    return await GameLobby.find({
      status: { $in: ['waiting', 'ready'] },
      expiresAt: { $lt: now }
    }).select('_id').lean();
  }
}

module.exports = LobbyRepository;
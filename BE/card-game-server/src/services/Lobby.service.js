const LobbyRepository = require('../repositories/Lobby.repository');
const UserRepository = require('../repositories/user.repository');
const DeckRepository = require('../repositories/Deck.repository');
const InventoryRepository = require('../repositories/inventory.repository');
const { LobbyResponseDto, LobbyListItemDto } = require('../dto/Lobby.dto');

/**
 * Lobby Service
 * Contains business logic for lobby operations
 */
class LobbyService {
  constructor() {
    this.lobbyRepository = new LobbyRepository();
    this.userRepository = new UserRepository();
    this.deckRepository = new DeckRepository();
    this.inventoryRepository = new InventoryRepository();
  }

  /**
   * Create a new lobby
   * @param {string} userId - Host user ID
   * @param {Object} createData - Lobby creation data
   * @returns {Promise<Object>} - Created lobby
   */
    async createLobby(userId, createData) {
    const existingLobby = await this.lobbyRepository.findActiveByUserId(userId);
    if (existingLobby) {
      throw new Error('You are already in an active lobby. Please leave it first.');
    }

    // Try to pre-fill Deck if they have an active one, but NOT Character
    let activeDeck = await this.deckRepository.findActiveDeck(userId);
    const deckId = activeDeck?._id || null;
    
    // Character must be selected manually in the lobby
    const characterId = null;

    const lobbyData = {
      hostUserId: userId,
      hostDeckId: deckId,
      hostCharacterId: characterId,
      lobbyName: createData.lobbyName,
      mapId: createData.mapId,
      isPrivate: createData.isPrivate || false,
      password: createData.isPrivate ? createData.password : null,
      gameSettings: {
        turnTimeLimit: createData.gameSettings?.turnTimeLimit || 60,
        allowSpectators: createData.gameSettings?.allowSpectators || false
      },
      status: 'waiting',
      players: [{
        userId: userId,
        deckId: deckId,
        characterId: characterId, // Explicitly null
        isReady: false, // Always false on creation until they confirm selections
        joinedAt: new Date()
      }]
    };

    const lobby = await this.lobbyRepository.create(lobbyData);
    const populatedLobby = await this.lobbyRepository.findByIdPopulated(lobby._id);
    
    return new LobbyResponseDto(populatedLobby);
  }

  /**
   * Get public lobbies with pagination
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Lobbies and pagination
   */
  async getPublicLobbies(query = {}) {
    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      status: query.status || 'waiting',
      showFull: query.showFull === 'true'
    };

    const result = await this.lobbyRepository.findPublicLobbies({}, options);

    return {
      lobbies: result.lobbies.map(lobby => new LobbyListItemDto(lobby)),
      pagination: result.pagination
    };
  }

  /**
   * Get lobby by ID
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - Current user ID (optional, for permission checks)
   * @returns {Promise<Object>} - Lobby details
   */
  async getLobbyById(lobbyId, userId = null) {
    const lobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    // Check if lobby is private and user is not a member
    if (lobby.isPrivate && userId) {
      const isMember = lobby.players.some(
        p => p.userId._id.toString() === userId.toString()
      );
      
      if (!isMember) {
        throw new Error('This lobby is private');
      }
    }

    return new LobbyResponseDto(lobby);
  }

  /**
   * Join a lobby
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @param {string} password - Password (for private lobbies)
   * @returns {Promise<Object>} - Updated lobby
   */
  async joinLobby(lobbyId, userId, password = null) {
    const lobby = await this.lobbyRepository.findById(lobbyId);

    if (!lobby) throw new Error('Lobby not found');

    const existingLobby = await this.lobbyRepository.findActiveByUserId(userId);
    if (existingLobby && existingLobby._id.toString() !== lobbyId) {
      throw new Error('You are already in another lobby');
    }

    if (lobby.hasPlayer(userId)) throw new Error('You are already in this lobby');
    if (lobby.status !== 'waiting') throw new Error('Cannot join - game started or closed');
    if (lobby.isFull) throw new Error('Lobby is full');

    if (lobby.isPrivate) {
      if (!password) throw new Error('Password required');
      if (lobby.password !== password) throw new Error('Incorrect password');
    }

    // Attempt to pre-select deck, but NEVER character
    let activeDeck = await this.deckRepository.findActiveDeck(userId);
    const deckId = activeDeck?._id || null;
    const characterId = null; 

    await this.lobbyRepository.addPlayer(lobbyId, {
      userId,
      deckId,
      characterId
    });

    const updatedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    return new LobbyResponseDto(updatedLobby);
  }

  /**
   * Leave a lobby
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Updated lobby or null if deleted
   */
  async leaveLobby(lobbyId, userId) {
     // ... same implementation as before ...
     const lobby = await this.lobbyRepository.findById(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (!lobby.hasPlayer(userId)) {
      throw new Error('You are not in this lobby');
    }

    // If host is leaving and there are other players, transfer host
    if (lobby.isHost(userId) && lobby.players.length > 1) {
      const newHost = lobby.players.find(
        p => p.userId.toString() !== userId.toString()
      );
      
      if (newHost) {
        await this.lobbyRepository.transferHost(lobbyId, newHost.userId);
      }
    }

    // Remove player
    await this.lobbyRepository.removePlayer(lobbyId, userId);

    // If lobby is empty, delete it
    const updatedLobby = await this.lobbyRepository.findById(lobbyId);
    if (!updatedLobby || updatedLobby.players.length === 0) {
      await this.lobbyRepository.deleteById(lobbyId);
      return null;
    }

    const populatedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    return new LobbyResponseDto(populatedLobby);
  }

  /**
   * Select deck in lobby
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @param {string} deckId - Deck ID
   * @returns {Promise<Object>} - Updated lobby
   */
  async selectDeck(lobbyId, userId, deckId) {
    const lobby = await this.lobbyRepository.findById(lobbyId);
    if (!lobby) throw new Error('Lobby not found');
    if (!lobby.hasPlayer(userId)) throw new Error('You are not in this lobby');
    if (lobby.status === 'started') throw new Error('Cannot change deck - game started');
    if (lobby.status === 'cancelled') throw new Error('Cannot change deck - lobby cancelled');

    // Verify ownership
    const deck = await this.deckRepository.findById(deckId);
    if (!deck || deck.userId.toString() !== userId.toString()) {
      throw new Error('Invalid deck or you do not own this deck');
    }

    // Verify deck validity
    if (!deck.cards || deck.cards.length < 15) { // Assuming 15 is min for QB
      throw new Error('Deck must have at least 15 cards');
    }

    // Update player's deck ONLY
    await this.lobbyRepository.updatePlayerDeck(lobbyId, userId, deckId);

    // Sync Host deck if applicable
    if (lobby.isHost(userId)) {
      await this.lobbyRepository.updateById(lobbyId, { hostDeckId: deckId });
    }

    // Re-fetch to check readiness (Deck + Character required)
    const updatedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    
    // Check readiness logic
    await this.checkAndSetReadiness(updatedLobby, userId, lobbyId);

    const finalLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    return new LobbyResponseDto(finalLobby);
  }

  /**
   * Select character in lobby
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @param {string} characterId - Character ID
   * @returns {Promise<Object>} - Updated lobby
   */
  async selectCharacter(lobbyId, userId, characterId) {
    const lobby = await this.lobbyRepository.findById(lobbyId);
    if (!lobby) throw new Error('Lobby not found');
    if (!lobby.hasPlayer(userId)) throw new Error('You are not in this lobby');
    if (lobby.status === 'started') throw new Error('Cannot change character - game started');
    if (lobby.status === 'cancelled') throw new Error('Cannot change character - lobby cancelled');

    // Verify ownership
    const hasCharacter = await this.inventoryRepository.hasCharacter(userId, characterId);
    if (!hasCharacter) {
      throw new Error('You do not own this character');
    }

    // Update player's character
    await this.lobbyRepository.updatePlayerCharacter(lobbyId, userId, characterId);

    // Sync Host character if applicable
    if (lobby.isHost(userId)) {
      await this.lobbyRepository.updateById(lobbyId, { hostCharacterId: characterId });
    }

    // Re-fetch to check readiness
    const updatedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    
    // Check readiness logic
    await this.checkAndSetReadiness(updatedLobby, userId, lobbyId);

    const finalLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    return new LobbyResponseDto(finalLobby);
  }
  /**
   * Helper to check lobby readiness and update lobby status
   * NOTE: Does NOT automatically set player.isReady - players must manually toggle ready
   */
  async checkAndSetReadiness(lobby, userId, lobbyId) {
    // Check if everyone is ready (all have deck + character + manually marked ready)
    const freshLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    if (freshLobby.allPlayersReady()) {
      await this.lobbyRepository.updateStatus(lobbyId, 'ready');
    } else {
      // If someone changed something and is no longer ready, revert lobby to waiting
      if (freshLobby.status === 'ready') {
        await this.lobbyRepository.updateStatus(lobbyId, 'waiting');
      }
    }
  }

  /**
   * Update lobby settings (host only)
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Settings to update
   * @returns {Promise<Object>} - Updated lobby
   */
  async updateLobbySettings(lobbyId, userId, updateData) {
     // ... same implementation ...
    const lobby = await this.lobbyRepository.findById(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (!lobby.isHost(userId)) {
      throw new Error('Only the host can update lobby settings');
    }

    // Fix stuck lobbies: if status is 'started' but no gameId, reset to 'ready'
    if (lobby.status === 'started' && !lobby.gameId) {
      console.warn(`⚠️ Detected stuck lobby ${lobbyId} - resetting status from 'started' to 'ready'`);
      await this.lobbyRepository.updateStatus(lobbyId, 'ready');
      // Refresh lobby data after fix
      const fixedLobby = await this.lobbyRepository.findById(lobbyId);
      return await this.updateLobbySettings(lobbyId, userId, updateData); // Retry after fix
    }

    // Allow settings update in 'waiting' or 'ready' status, but not 'started'
    if (lobby.status === 'started' || lobby.status === 'cancelled') {
      throw new Error('Cannot update settings - game has already started');
    }

    const allowedUpdates = {};

    if (updateData.lobbyName) {
      allowedUpdates.lobbyName = updateData.lobbyName;
    }

    if (updateData.mapId) {
      allowedUpdates.mapId = updateData.mapId;
    }

    if (updateData.gameSettings) {
      allowedUpdates.gameSettings = {
        ...lobby.gameSettings,
        ...updateData.gameSettings
      };
    }

    await this.lobbyRepository.updateById(lobbyId, allowedUpdates);

    const updatedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    return new LobbyResponseDto(updatedLobby);
  }

  async kickPlayer(lobbyId, hostUserId, playerToKickId) {
     // ... same implementation ...
    const lobby = await this.lobbyRepository.findById(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (!lobby.isHost(hostUserId)) {
      throw new Error('Only the host can kick players');
    }

    if (hostUserId === playerToKickId) {
      throw new Error('Host cannot kick themselves');
    }

    if (!lobby.hasPlayer(playerToKickId)) {
      throw new Error('Player is not in this lobby');
    }

    await this.lobbyRepository.removePlayer(lobbyId, playerToKickId);

    const updatedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    return new LobbyResponseDto(updatedLobby);
  }

  /**
   * Start game (host only, all players must be ready)
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Game start data
   */
  async startGame(lobbyId, userId) {
    const lobby = await this.lobbyRepository.findByIdPopulated(lobbyId);

    if (!lobby) throw new Error('Lobby not found');
    if (!lobby.isHost(userId)) throw new Error('Only the host can start the game');
    //if (lobby.status !== 'ready') throw new Error('Lobby is not ready (Players must select Deck and Character)');
    if (!lobby.isFull) throw new Error('Lobby must be full to start');

    // Final verification that deck and character are set
    if (!lobby.allPlayersReady()) {
      throw new Error('All players must have a Deck AND a Character selected');
    }

    await this.lobbyRepository.updateStatus(lobbyId, 'started');

    const startedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    return {
      lobby: new LobbyResponseDto(startedLobby),
      message: 'Game starting...'
    };
  }

  /**
   * Get user's current lobby
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Current lobby or null
   */
  async getUserCurrentLobby(userId) {
     // ... same implementation ...
    const lobby = await this.lobbyRepository.findActiveByUserId(userId);
    
    if (!lobby) {
      return null;
    }

    const populatedLobby = await this.lobbyRepository.findByIdPopulated(lobby._id);
    return new LobbyResponseDto(populatedLobby);
  }
  /**
   * Cancel lobby (host only)
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async cancelLobby(lobbyId, userId) {
     // ... same implementation ...
    const lobby = await this.lobbyRepository.findById(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (!lobby.isHost(userId)) {
      throw new Error('Only the host can cancel the lobby');
    }

    await this.lobbyRepository.updateStatus(lobbyId, 'cancelled');
    
    // Optionally delete immediately
    await this.lobbyRepository.deleteById(lobbyId);
  }
}


module.exports = LobbyService;
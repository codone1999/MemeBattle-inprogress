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
    // Check if user already has an active lobby
    const existingLobby = await this.lobbyRepository.findActiveByUserId(userId);
    if (existingLobby) {
      throw new Error('You are already in an active lobby. Please leave it first.');
    }

    // Get user's active deck or random deck
    let activeDeck = await this.deckRepository.findActiveDeck(userId);
    
    // If no active deck, get any deck from user's collection
    if (!activeDeck) {
      const userDecks = await this.deckRepository.findByUserId(userId);
      if (userDecks && userDecks.length > 0) {
        // Pick random deck
        activeDeck = userDecks[Math.floor(Math.random() * userDecks.length)];
      }
    }

    // Get character from the deck
    const characterId = activeDeck?.characterId || null;
    const deckId = activeDeck?._id || null;

    // Create lobby data
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
        characterId: characterId,
        isReady: deckId && characterId ? true : false,
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

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    // Check if user is already in another lobby
    const existingLobby = await this.lobbyRepository.findActiveByUserId(userId);
    if (existingLobby && existingLobby._id.toString() !== lobbyId) {
      throw new Error('You are already in another lobby');
    }

    // Check if user is already in this lobby
    if (lobby.hasPlayer(userId)) {
      throw new Error('You are already in this lobby');
    }

    // Check lobby status
    if (lobby.status !== 'waiting') {
      throw new Error('Cannot join lobby - game has already started or lobby is closed');
    }

    // Check if lobby is full
    if (lobby.isFull) {
      throw new Error('Lobby is full');
    }

    // Check password for private lobbies
    if (lobby.isPrivate) {
      if (!password) {
        throw new Error('Password required for private lobby');
      }
      if (lobby.password !== password) {
        throw new Error('Incorrect password');
      }
    }

    // Get user's active deck or random deck
    let activeDeck = await this.deckRepository.findActiveDeck(userId);
    
    if (!activeDeck) {
      const userDecks = await this.deckRepository.findByUserId(userId);
      if (userDecks && userDecks.length > 0) {
        activeDeck = userDecks[Math.floor(Math.random() * userDecks.length)];
      }
    }

    const characterId = activeDeck?.characterId || null;
    const deckId = activeDeck?._id || null;

    // Add player to lobby
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

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (!lobby.hasPlayer(userId)) {
      throw new Error('You are not in this lobby');
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Cannot change deck - game has already started');
    }

    // Verify user owns this deck
    const deck = await this.deckRepository.findById(deckId);
    if (!deck || deck.userId.toString() !== userId.toString()) {
      throw new Error('Invalid deck or you do not own this deck');
    }

    // Verify deck has required cards (minimum 30 cards for example)
    if (!deck.cards || deck.cards.length < 30) {
      throw new Error('Deck must have at least 30 cards');
    }

    // Verify deck has a character
    if (!deck.characterId) {
      throw new Error('Deck must have a character selected');
    }

    // Update player's deck
    await this.lobbyRepository.updatePlayerDeck(lobbyId, userId, deckId);

    // Auto-update character from deck
    await this.lobbyRepository.updatePlayerCharacter(lobbyId, userId, deck.characterId);

    // Update host deck if this is the host
    if (lobby.isHost(userId)) {
      await this.lobbyRepository.updateById(lobbyId, { 
        hostDeckId: deckId,
        hostCharacterId: deck.characterId
      });
    }

    const updatedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    
    // Check if all players are ready
    if (updatedLobby.allPlayersReady()) {
      await this.lobbyRepository.updateStatus(lobbyId, 'ready');
    }

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

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (!lobby.hasPlayer(userId)) {
      throw new Error('You are not in this lobby');
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Cannot change character - game has already started');
    }

    // Verify user owns this character
    const hasCharacter = await this.inventoryRepository.hasCharacter(userId, characterId);
    if (!hasCharacter) {
      throw new Error('You do not own this character');
    }

    // Update player's character
    await this.lobbyRepository.updatePlayerCharacter(lobbyId, userId, characterId);

    // Update host character if this is the host
    if (lobby.isHost(userId)) {
      await this.lobbyRepository.updateById(lobbyId, { 
        hostCharacterId: characterId
      });
    }

    const updatedLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    
    // Check if all players are ready
    if (updatedLobby.allPlayersReady()) {
      await this.lobbyRepository.updateStatus(lobbyId, 'ready');
    }

    const finalLobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    return new LobbyResponseDto(finalLobby);
  }

  /**
   * Update lobby settings (host only)
   * @param {string} lobbyId - Lobby ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Settings to update
   * @returns {Promise<Object>} - Updated lobby
   */
  async updateLobbySettings(lobbyId, userId, updateData) {
    const lobby = await this.lobbyRepository.findById(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (!lobby.isHost(userId)) {
      throw new Error('Only the host can update lobby settings');
    }

    if (lobby.status !== 'waiting') {
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

  /**
   * Kick player from lobby (host only)
   * @param {string} lobbyId - Lobby ID
   * @param {string} hostUserId - Host user ID
   * @param {string} playerToKickId - Player to kick ID
   * @returns {Promise<Object>} - Updated lobby
   */
  async kickPlayer(lobbyId, hostUserId, playerToKickId) {
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

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (!lobby.isHost(userId)) {
      throw new Error('Only the host can start the game');
    }

    if (lobby.status !== 'ready' && lobby.status !== 'waiting') {
      throw new Error('Lobby is not ready to start');
    }

    if (!lobby.isFull) {
      throw new Error('Lobby must be full to start the game');
    }

    if (!lobby.allPlayersReady()) {
      throw new Error('All players must be ready (have selected decks and characters)');
    }

    // Update lobby status to started
    await this.lobbyRepository.updateStatus(lobbyId, 'started');

    // Here you would create the game in Redis
    // const gameState = await gameService.createGame(lobby);
    
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
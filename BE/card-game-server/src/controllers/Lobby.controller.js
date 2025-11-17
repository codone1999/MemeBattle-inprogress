const LobbyService = require('../services/Lobby.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse
} = require('../utils/response.util');

/**
 * Lobby Controller
 * Handles HTTP requests for lobby operations
 */
class LobbyController {
  constructor() {
    this.lobbyService = new LobbyService();
    this.socketHandler = null; // Will be injected
    this.lobbyListBroadcaster = null; // Will be injected
  }

  /**
   * Inject socket handler (called from server initialization)
   */
  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

  /**
   * Inject lobby list broadcaster
   */
  setLobbyListBroadcaster(lobbyListBroadcaster) {
    this.lobbyListBroadcaster = lobbyListBroadcaster;
  }

  /**
   * POST /api/v1/lobbies
   * Create a new lobby
   */
  createLobby = async (req, res, next) => {
    try {
      const userId = req.userId;
      const lobbyData = req.body;

      const lobby = await this.lobbyService.createLobby(userId, lobbyData);

      // Broadcast new lobby to lobby list viewers
      if (this.lobbyListBroadcaster && !lobby.isPrivate) {
        this.lobbyListBroadcaster.broadcastLobbyCreated(lobby);
      }

      return createdResponse(res, lobby, 'Lobby created successfully');
    } catch (error) {
      if (error.message.includes('already in an active lobby')) {
        return badRequestResponse(res, error.message);
      }
      if (error.message.includes('Invalid map')) {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * GET /api/v1/lobbies/public
   * Get list of public lobbies
   */
  getPublicLobbies = async (req, res, next) => {
    try {
      const query = req.query;

      const result = await this.lobbyService.getPublicLobbies(query);

      return successResponse(
        res,
        result,
        'Public lobbies retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/lobbies/:lobbyId
   * Get lobby details by ID
   */
  getLobbyById = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;

      const lobby = await this.lobbyService.getLobbyById(lobbyId, userId);

      return successResponse(res, lobby, 'Lobby retrieved successfully');
    } catch (error) {
      if (error.message === 'Lobby not found') {
        return notFoundResponse(res, error.message);
      }
      if (error.message === 'This lobby is private') {
        return forbiddenResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * POST /api/v1/lobbies/:lobbyId/join
   * Join a lobby
   */
  joinLobby = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;
      const { password } = req.body;

      const lobby = await this.lobbyService.joinLobby(lobbyId, userId, password);

      // Get user's socket and make it join the lobby room
      if (this.socketHandler) {
        const userSocket = this.socketHandler.getSocketByUserId(userId);
        if (userSocket) {
          userSocket.join(lobbyId);
          userSocket.lobbyId = lobbyId;
        }

        // Broadcast lobby update to all players
        await this.socketHandler.broadcastLobbyUpdate(lobbyId);
      }

      // Update lobby list
      if (this.lobbyListBroadcaster) {
        this.lobbyListBroadcaster.broadcastLobbyUpdated(lobby);
      }

      return successResponse(res, lobby, 'Successfully joined lobby');
    } catch (error) {
      if (
        error.message === 'Lobby not found' ||
        error.message === 'Lobby is full' ||
        error.message.includes('already in')
      ) {
        return badRequestResponse(res, error.message);
      }
      if (
        error.message === 'Password required' ||
        error.message === 'Incorrect password'
      ) {
        return forbiddenResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * POST /api/v1/lobbies/:lobbyId/leave
   * Leave a lobby
   */
  leaveLobby = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;

      const lobby = await this.lobbyService.leaveLobby(lobbyId, userId);

      if (!lobby) {
        return successResponse(res, null, 'Lobby has been closed');
      }

      return successResponse(res, lobby, 'Successfully left lobby');
    } catch (error) {
      if (error.message === 'Lobby not found') {
        return notFoundResponse(res, error.message);
      }
      if (error.message === 'You are not in this lobby') {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * PUT /api/v1/lobbies/:lobbyId/deck
   * Select deck in lobby
   */
  selectDeck = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;
      const { deckId } = req.body;

      const lobby = await this.lobbyService.selectDeck(lobbyId, userId, deckId);

      return successResponse(res, lobby, 'Deck selected successfully');
    } catch (error) {
      if (
        error.message === 'Lobby not found' ||
        error.message === 'You are not in this lobby' ||
        error.message.includes('Invalid deck') ||
        error.message.includes('Deck must')
      ) {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * PUT /api/v1/lobbies/:lobbyId/character
   * Select character in lobby
   */
  selectCharacter = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;
      const { characterId } = req.body;

      const lobby = await this.lobbyService.selectCharacter(lobbyId, userId, characterId);

      return successResponse(res, lobby, 'Character selected successfully');
    } catch (error) {
      if (
        error.message === 'Lobby not found' ||
        error.message === 'You are not in this lobby' ||
        error.message.includes('do not own this character') ||
        error.message.includes('Cannot change character')
      ) {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * PUT /api/v1/lobbies/:lobbyId/settings
   * Update lobby settings (host only)
   */
  updateLobbySettings = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;
      const updateData = req.body;

      const lobby = await this.lobbyService.updateLobbySettings(
        lobbyId,
        userId,
        updateData
      );

      return successResponse(res, lobby, 'Lobby settings updated successfully');
    } catch (error) {
      if (error.message === 'Lobby not found') {
        return notFoundResponse(res, error.message);
      }
      if (error.message === 'Only the host can update lobby settings') {
        return forbiddenResponse(res, error.message);
      }
      if (error.message.includes('Cannot update settings')) {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * POST /api/v1/lobbies/:lobbyId/kick
   * Kick player from lobby (host only)
   */
  kickPlayer = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;
      const { playerId } = req.body;

      const lobby = await this.lobbyService.kickPlayer(lobbyId, userId, playerId);

      return successResponse(res, lobby, 'Player kicked successfully');
    } catch (error) {
      if (error.message === 'Lobby not found') {
        return notFoundResponse(res, error.message);
      }
      if (
        error.message === 'Only the host can kick players' ||
        error.message === 'Host cannot kick themselves'
      ) {
        return forbiddenResponse(res, error.message);
      }
      if (error.message === 'Player is not in this lobby') {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * POST /api/v1/lobbies/:lobbyId/start
   * Start game (host only)
   */
  startGame = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;

      const result = await this.lobbyService.startGame(lobbyId, userId);

      return successResponse(res, result, 'Game started successfully');
    } catch (error) {
      if (error.message === 'Lobby not found') {
        return notFoundResponse(res, error.message);
      }
      if (error.message === 'Only the host can start the game') {
        return forbiddenResponse(res, error.message);
      }
      if (
        error.message.includes('not ready') ||
        error.message.includes('must be full') ||
        error.message.includes('must be ready')
      ) {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  };

  /**
   * GET /api/v1/lobbies/me/current
   * Get user's current lobby
   */
  getCurrentLobby = async (req, res, next) => {
    try {
      const userId = req.userId;

      const lobby = await this.lobbyService.getUserCurrentLobby(userId);

      if (!lobby) {
        return successResponse(res, null, 'No active lobby');
      }

      return successResponse(res, lobby, 'Current lobby retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/lobbies/:lobbyId
   * Cancel/delete lobby (host only)
   */
  cancelLobby = async (req, res, next) => {
    try {
      const { lobbyId } = req.params;
      const userId = req.userId;

      await this.lobbyService.cancelLobby(lobbyId, userId);

      return successResponse(res, null, 'Lobby cancelled successfully');
    } catch (error) {
      if (error.message === 'Lobby not found') {
        return notFoundResponse(res, error.message);
      }
      if (error.message === 'Only the host can cancel the lobby') {
        return forbiddenResponse(res, error.message);
      }
      next(error);
    }
  };
}

module.exports = new LobbyController();
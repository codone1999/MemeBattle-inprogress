const GameService = require('../services/Game.service');
const GameRepository = require('../repositories/Game.repository');
const {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  forbiddenResponse
} = require('../utils/response.util');

/**
 * Game Controller
 * Handles HTTP requests for game operations
 */
class GameController {
  constructor() {
    this.gameService = new GameService();
    this.gameRepository = new GameRepository();
  }

  /**
   * GET /api/v1/games/:gameId
   * Get completed game details
   */
  getGameById = async (req, res, next) => {
    try {
      const { gameId } = req.params;
      const userId = req.userId;

      const game = await this.gameRepository.findById(gameId);

      if (!game) {
        return notFoundResponse(res, 'Game not found');
      }

      // Check if user was in this game
      if (!game.hasPlayer(userId)) {
        return forbiddenResponse(res, 'You were not in this game');
      }

      return successResponse(res, game, 'Game retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/games/me/history
   * Get user's game history
   */
  getMyGameHistory = async (req, res, next) => {
    try {
      const userId = req.userId;
      const query = req.query;

      const result = await this.gameRepository.findByUserId(userId, {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20
      });

      return successResponse(res, result, 'Game history retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/games/me/recent
   * Get user's recent games
   */
  getMyRecentGames = async (req, res, next) => {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit) || 10;

      const games = await this.gameRepository.getRecentGames(userId, limit);

      return successResponse(res, games, 'Recent games retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/games/me/stats
   * Get user's game statistics
   */
  getMyStats = async (req, res, next) => {
    try {
      const userId = req.userId;

      const stats = await this.gameRepository.getUserStats(userId);

      return successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/games/leaderboard
   * Get global leaderboard
   */
  getLeaderboard = async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 100;

      const leaderboard = await this.gameRepository.getLeaderboard({ limit });

      return successResponse(res, leaderboard, 'Leaderboard retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/games/head-to-head/:opponentId
   * Get head-to-head record with another player
   */
  getHeadToHead = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { opponentId } = req.params;

      const games = await this.gameRepository.getGamesBetweenPlayers(
        userId,
        opponentId,
        20
      );

      const Game = require('../models/Game.model');
      const record = await Game.getHeadToHead(userId, opponentId);

      return successResponse(
        res,
        { games, record },
        'Head-to-head data retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/games/active/:gameId
   * Get active game state (from Redis)
   */
  getActiveGame = async (req, res, next) => {
    try {
      const { gameId } = req.params;
      const userId = req.userId;

      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) {
        return notFoundResponse(res, 'Game not found or has ended');
      }

      // Check if user is in this game
      if (!gameState.players[userId]) {
        return forbiddenResponse(res, 'You are not in this game');
      }

      // Transform for player perspective
      const transformedState = gameState.players[userId].position === 'away'
        ? this.gameService.transformStateForAwayPlayer(gameState, userId)
        : gameState;

      return successResponse(res, transformedState, 'Active game retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/games/:gameId/forfeit
   * Forfeit an active game
   */
  forfeitGame = async (req, res, next) => {
    try {
      const { gameId } = req.params;
      const userId = req.userId;

      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) {
        return notFoundResponse(res, 'Game not found');
      }

      if (!gameState.players[userId]) {
        return forbiddenResponse(res, 'You are not in this game');
      }

      // Mark as forfeited and opponent wins
      const opponent = Object.values(gameState.players).find(
        p => p.userId !== userId
      );

      gameState.status = 'completed';
      gameState.phase = 'ended';
      gameState.winner = opponent.userId;
      opponent.coinsEarned = 2;

      // Save to MongoDB
      await this.gameService._saveCompletedGame(gameState);

      // Delete from Redis
      await this.gameService.deleteGame(gameId);

      return successResponse(res, null, 'Game forfeited');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new GameController();
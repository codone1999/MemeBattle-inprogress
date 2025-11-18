const express = require('express');
const router = express.Router();
const GameController = require('../controllers/Game.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * Game Routes
 * All routes require authentication
 */

// Get completed game by ID
router.get('/:gameId', authenticate, GameController.getGameById);

// Get user's game history
router.get('/me/history', authenticate, GameController.getMyGameHistory);

// Get user's recent games
router.get('/me/recent', authenticate, GameController.getMyRecentGames);

// Get user's statistics
router.get('/me/stats', authenticate, GameController.getMyStats);

// Get global leaderboard
router.get('/leaderboard', authenticate, GameController.getLeaderboard);

// Get head-to-head record
router.get('/head-to-head/:opponentId', authenticate, GameController.getHeadToHead);

// Get active game state (from Redis)
router.get('/active/:gameId', authenticate, GameController.getActiveGame);

// Forfeit an active game
router.post('/:gameId/forfeit', authenticate, GameController.forfeitGame);

module.exports = router;
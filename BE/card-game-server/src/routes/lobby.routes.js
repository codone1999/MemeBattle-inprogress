const express = require('express');
const router = express.Router();
const lobbyController = require('../controllers/Lobby.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, validateParams, validateQuery } = require('../middlewares/validation.middleware');
const {
  createLobbySchema,
  joinLobbySchema,
  lobbyIdParamSchema,
  updateLobbySettingsSchema,
  selectDeckSchema,
  selectCharacterSchema,
  kickPlayerSchema,
  getLobbiesQuerySchema
} = require('../dto/validation/Lobby.validation');

/**
 * All lobby routes require authentication
 */
router.use(authenticate);

/**
 * POST /api/v1/lobbies
 * Create a new lobby
 */
router.post(
  '/',
  validate(createLobbySchema),
  lobbyController.createLobby
);

/**
 * GET /api/v1/lobbies/public
 * Get list of public lobbies
 */
router.get(
  '/public',
  validateQuery(getLobbiesQuerySchema),
  lobbyController.getPublicLobbies
);

/**
 * GET /api/v1/lobbies/me/current
 * Get user's current active lobby
 */
router.get(
  '/me/current',
  lobbyController.getCurrentLobby
);

/**
 * GET /api/v1/lobbies/:lobbyId
 * Get lobby details by ID
 */
router.get(
  '/:lobbyId',
  validateParams(lobbyIdParamSchema),
  lobbyController.getLobbyById
);

/**
 * POST /api/v1/lobbies/:lobbyId/join
 * Join a lobby
 */
router.post(
  '/:lobbyId/join',
  validateParams(lobbyIdParamSchema),
  validate(joinLobbySchema),
  lobbyController.joinLobby
);

/**
 * POST /api/v1/lobbies/:lobbyId/leave
 * Leave a lobby
 */
router.post(
  '/:lobbyId/leave',
  validateParams(lobbyIdParamSchema),
  lobbyController.leaveLobby
);

/**
 * PUT /api/v1/lobbies/:lobbyId/deck
 * Select deck in lobby
 */
router.put(
  '/:lobbyId/deck',
  validateParams(lobbyIdParamSchema),
  validate(selectDeckSchema),
  lobbyController.selectDeck
);

/**
 * PUT /api/v1/lobbies/:lobbyId/character
 * Select character in lobby
 */
router.put(
  '/:lobbyId/character',
  validateParams(lobbyIdParamSchema),
  validate(selectCharacterSchema),
  lobbyController.selectCharacter
);

/**
 * PUT /api/v1/lobbies/:lobbyId/settings
 * Update lobby settings (host only)
 */
router.put(
  '/:lobbyId/settings',
  validateParams(lobbyIdParamSchema),
  validate(updateLobbySettingsSchema),
  lobbyController.updateLobbySettings
);

/**
 * POST /api/v1/lobbies/:lobbyId/kick
 * Kick player from lobby (host only)
 */
router.post(
  '/:lobbyId/kick',
  validateParams(lobbyIdParamSchema),
  validate(kickPlayerSchema),
  lobbyController.kickPlayer
);

/**
 * POST /api/v1/lobbies/:lobbyId/start
 * Start game (host only)
 */
router.post(
  '/:lobbyId/start',
  validateParams(lobbyIdParamSchema),
  lobbyController.startGame
);

/**
 * DELETE /api/v1/lobbies/:lobbyId
 * Cancel/delete lobby (host only)
 */
router.delete(
  '/:lobbyId',
  validateParams(lobbyIdParamSchema),
  lobbyController.cancelLobby
);

module.exports = router;
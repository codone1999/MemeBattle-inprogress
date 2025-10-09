import express from 'express';
import { lobbyController } from '../controllers/lobbyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// ==================== SPECIFIC ROUTES FIRST ====================
// These MUST come before /:lobbyId

// User active lobby routes
router.get('/user/active', lobbyController.getUserActiveLobby);
router.get('/user/:userId/active', lobbyController.getUserActiveLobbyById);

// Invite routes
router.post('/invite', lobbyController.sendInvite);
router.get('/invites', lobbyController.getPendingInvites);
router.post('/invites/:inviteId/accept', lobbyController.acceptInvite);
router.post('/invites/:inviteId/decline', lobbyController.declineInvite);

// Lobby list
router.get('/list', lobbyController.getLobbies);

// ==================== PARAMETERIZED ROUTES LAST ====================
// These come after specific routes

// Lobby operations
router.post('/create', lobbyController.createLobby);
router.get('/:lobbyId', lobbyController.getLobby);
router.post('/join', lobbyController.joinLobby);
router.post('/leave/:lobbyId', lobbyController.leaveLobby);
router.post('/update-selection', lobbyController.updateSelection);
router.post('/update-map', lobbyController.updateMap);
router.post('/start/:lobbyId', lobbyController.startGame);

export default router;
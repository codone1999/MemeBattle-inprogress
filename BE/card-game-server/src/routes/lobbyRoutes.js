// BE/card-game-server/src/routes/lobbyRoutes.js
import express from 'express';
import { lobbyController } from '../controllers/lobbyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { lobbyService } from '../services/lobbyService.js'; // ADD THIS

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ==================== SPECIFIC ROUTES FIRST ====================
// These MUST come before /:lobbyId

// Check users in lobbies (BATCH - NEW OPTIMIZED ROUTE)
router.post('/check-users', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'userIds array required'
      });
    }

    const users = await lobbyService.checkUsersInLobby(userIds);
    
    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Check users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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
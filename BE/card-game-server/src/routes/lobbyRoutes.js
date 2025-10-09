import express from 'express';
import { lobbyController } from '../controllers/lobbyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/create', lobbyController.createLobby);
router.get('/list', lobbyController.getLobbies);
router.get('/:lobbyId', lobbyController.getLobby);
router.post('/join', lobbyController.joinLobby);
router.post('/leave/:lobbyId', lobbyController.leaveLobby);
router.post('/update-selection', lobbyController.updateSelection);
router.post('/update-map', lobbyController.updateMap);
router.post('/start/:lobbyId', lobbyController.startGame);

// Invites
router.post('/invite', lobbyController.sendInvite);
router.get('/invites', lobbyController.getPendingInvites);
router.post('/invites/:inviteId/accept', lobbyController.acceptInvite);
router.post('/invites/:inviteId/decline', lobbyController.declineInvite);

export default router;
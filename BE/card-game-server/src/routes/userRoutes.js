import express from 'express';
import { userController } from '../controllers/userController.js';
import { inventoryController } from '../controllers/inventoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ==================== USER PROFILE ====================
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// ==================== INVENTORY ====================
router.get('/inventory', userController.getInventory);
router.put('/inventory', userController.updateInventory);

// ==================== DECKS ====================
router.get('/decks', inventoryController.getUserDecks);
router.get('/decks/:deckid/cards', inventoryController.getDeckCards);
router.post('/decks', inventoryController.createDeck);
router.put('/decks/:deckid', inventoryController.updateDeck);
router.delete('/decks/:deckid', inventoryController.deleteDeck);

// ==================== CARDS ====================
router.get('/cards', inventoryController.getUserCards);

// ==================== CHARACTERS ====================
router.get('/characters', inventoryController.getUserCharacters);
router.put('/character', userController.updateSelectedCharacter);

// ==================== GAME DATA (ALL CARDS, CHARACTERS, MAPS) ====================
router.get('/all-cards', userController.getAllCards);
router.get('/all-characters', userController.getAllCharacters);
router.get('/maps', userController.getAllMaps);

// ==================== FRIENDS ====================
router.get('/friends', userController.getFriends);
router.get('/friend-requests', userController.getFriendRequests);
router.post('/friend-request', userController.sendFriendRequest);
router.post('/friend-request/:requestId/accept', userController.acceptFriendRequest);
router.delete('/friends/:friendUid', userController.removeFriend);

export default router;
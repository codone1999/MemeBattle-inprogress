import express from 'express';
import { userController } from '../controllers/userController.js';
import { inventoryController } from '../controllers/inventoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User profile
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Inventory
router.get('/inventory', userController.getInventory);
router.put('/inventory', userController.updateInventory);

// Decks - UPDATED ROUTES
router.get('/decks', inventoryController.getUserDecks);
router.get('/decks/:deckid/cards', inventoryController.getDeckCards);
router.post('/decks', inventoryController.createDeck);
router.put('/decks/:deckid', inventoryController.updateDeck);
router.delete('/decks/:deckid', inventoryController.deleteDeck);

// Cards - NEW ROUTES
router.get('/cards', inventoryController.getUserCards); 

// Characters - NEW ROUTE
router.get('/characters', inventoryController.getUserCharacters);

// Friends
router.get('/friends', userController.getFriends);
router.get('/friend-requests', userController.getFriendRequests);
router.post('/friend-request', userController.sendFriendRequest);
router.post('/friend-request/:requestId/accept', userController.acceptFriendRequest);
router.delete('/friends/:friendUid', userController.removeFriend);

router.put('/character', userController.updateSelectedCharacter);
export default router;
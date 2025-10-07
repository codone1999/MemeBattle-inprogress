import express from 'express';
import { userController } from '../controllers/userController.js';
import { inventoryController } from '../controllers/inventoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User profile
router.get('/profile', userController.getProfile);

// Inventory
router.get('/inventory', userController.getInventory);
router.put('/inventory', userController.updateInventory);

// Decks
router.get('/decks', inventoryController.getUserDecks);
router.post('/decks', inventoryController.createDeck);
router.put('/decks/:deckid', inventoryController.updateDeck);
router.delete('/decks/:deckid', inventoryController.deleteDeck);

// Game data
router.get('/cards', userController.getAllCards);
router.get('/characters', userController.getAllCharacters);
router.get('/maps', userController.getAllMaps);

export default router;
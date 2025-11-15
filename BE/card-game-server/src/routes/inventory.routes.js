const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, validateParams } = require('../middlewares/validation.middleware');
const {
  addCardSchema,
  addCharacterSchema,
  removeCardParamsSchema,
  removeCardBodySchema
} = require('../dto/validation/inventory.validation');

// === All inventory routes are private and require authentication ===
router.use(authenticate);

/**
 * @route   GET /api/v1/inventory
 * @desc    Get the authenticated user's inventory
 * @access  Private
 */
router.get(
  '/', 
  inventoryController.getMyInventory
);

/**
 * @route   POST /api/v1/inventory/cards
 * @desc    Add a card (or stack) to the user's inventory
 * @access  Private
 */
router.post(
  '/cards', 
  validate(addCardSchema), 
  inventoryController.addCardToInventory
);
  
/**
 * @route   DELETE /api/v1/inventory/cards/:cardId
 * @desc    Remove a card (or quantity) from the user's inventory
 * @access  Private
 */
router.delete(
  '/cards/:cardId', 
  validateParams(removeCardParamsSchema), 
  validate(removeCardBodySchema), // Validates the 'quantity' in the body
  inventoryController.removeCardFromInventory
);

/**
 * @route   POST /api/v1/inventory/characters
 * @desc    Add a new character to the user's inventory
 * @access  Private
 */
router.post(
  '/characters', 
  validate(addCharacterSchema), 
  inventoryController.addCharacterToInventory
);

module.exports = router;
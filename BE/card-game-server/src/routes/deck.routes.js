const express = require('express');
const DeckController = require('../controllers/Deck.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, validateParams } = require('../middlewares/validation.middleware');
const {
  createDeckSchema,
  updateDeckSchema,
  deckIdParamSchema,
  setActiveDeckSchema
} = require('../dto/validation/Deck.validation');

const router = express.Router();
const deckController = new DeckController();

// All deck routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/decks
 * @desc    Create a new deck
 * @access  Private (requires authentication)
 * @body    { deckTitle, characterId, cards: [{ cardId, position }], isActive }
 */
router.post(
  '/',
  validate(createDeckSchema),
  deckController.createDeck
);

/**
 * @route   GET /api/v1/decks
 * @desc    Get all decks for authenticated user
 * @access  Private (requires authentication)
 */
router.get(
  '/',
  deckController.getUserDecks
);

/**
 * @route   GET /api/v1/decks/active
 * @desc    Get the currently active deck
 * @access  Private (requires authentication)
 * @note    This route must come BEFORE /:deckId to avoid route conflicts
 */
router.get(
  '/active',
  deckController.getActiveDeck
);

/**
 * @route   GET /api/v1/decks/:deckId
 * @desc    Get a specific deck by ID
 * @access  Private (requires authentication, must own deck)
 */
router.get(
  '/:deckId',
  validateParams(deckIdParamSchema),
  deckController.getDeckById
);

/**
 * @route   PUT /api/v1/decks/:deckId
 * @desc    Update a deck (title, cards, character, active status)
 * @access  Private (requires authentication, must own deck)
 * @body    { deckTitle?, characterId?, cards?, isActive? }
 */
router.put(
  '/:deckId',
  validateParams(deckIdParamSchema),
  validate(updateDeckSchema),
  deckController.updateDeck
);

/**
 * @route   PATCH /api/v1/decks/:deckId/activate
 * @desc    Set a deck as active (deactivates all other decks)
 * @access  Private (requires authentication, must own deck)
 */
router.patch(
  '/:deckId/activate',
  validateParams(deckIdParamSchema),
  deckController.setActiveDeck
);

/**
 * @route   DELETE /api/v1/decks/:deckId
 * @desc    Delete a deck
 * @access  Private (requires authentication, must own deck)
 */
router.delete(
  '/:deckId',
  validateParams(deckIdParamSchema),
  deckController.deleteDeck
);

module.exports = router;
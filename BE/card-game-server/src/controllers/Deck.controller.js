const DeckService = require('../services/Deck.service');
const { 
  successResponse, 
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse,
  internalServerErrorResponse 
} = require('../utils/response.util');
const {
  CreateDeckRequestDto,
  UpdateDeckRequestDto,
  DeckResponseDto,
  DeckListResponseDto,
  DeckDeletionResponseDto
} = require('../dto/deck.dto');
const asyncHandler = require('../utils/Asynchandler');

class DeckController {
  constructor() {
    this.deckService = new DeckService();
  }

  /**
   * @route   POST /api/v1/decks
   * @desc    Create a new deck
   * @access  Private (authenticated users only)
   */
  createDeck = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    
    // Create request DTO
    const createDeckDto = new CreateDeckRequestDto(req.body);

    try {
      const newDeck = await this.deckService.createDeck(createDeckDto, userId);
      
      // Create response DTO
      const deckResponse = new DeckResponseDto(newDeck);

      return createdResponse(
        res,
        { deck: deckResponse },
        'Deck created successfully'
      );
    } catch (error) {
      if (error.statusCode === 400) {
        return badRequestResponse(res, error.message);
      }
      if (error.statusCode === 403) {
        return forbiddenResponse(res, error.message);
      }
      if (error.statusCode === 404) {
        return notFoundResponse(res, error.message);
      }
      return internalServerErrorResponse(res, error.message);
    }
  });

  /**
   * @route   GET /api/v1/decks
   * @desc    Get all decks for authenticated user
   * @access  Private (authenticated users only)
   */
  getUserDecks = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();

    try {
      const decks = await this.deckService.getUserDecks(userId);
      
      // Create response DTO
      const deckListResponse = new DeckListResponseDto(decks);

      return successResponse(
        res,
        deckListResponse,
        'Decks retrieved successfully'
      );
    } catch (error) {
      return internalServerErrorResponse(res, error.message);
    }
  });

  /**
   * @route   GET /api/v1/decks/:deckId
   * @desc    Get a specific deck by ID
   * @access  Private (authenticated users only, must own the deck)
   */
  getDeckById = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { deckId } = req.params;

    try {
      const deck = await this.deckService.getDeckById(deckId, userId);
      
      // Create response DTO
      const deckResponse = new DeckResponseDto(deck);

      return successResponse(
        res,
        { deck: deckResponse },
        'Deck retrieved successfully'
      );
    } catch (error) {
      if (error.statusCode === 404) {
        return notFoundResponse(res, error.message);
      }
      if (error.statusCode === 403) {
        return forbiddenResponse(res, error.message);
      }
      return internalServerErrorResponse(res, error.message);
    }
  });

  /**
   * @route   PUT /api/v1/decks/:deckId
   * @desc    Update a deck (name, cards, character)
   * @access  Private (authenticated users only, must own the deck)
   */
  updateDeck = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { deckId } = req.params;
    
    // Create request DTO
    const updateDeckDto = new UpdateDeckRequestDto(req.body);

    try {
      const updatedDeck = await this.deckService.updateDeck(
        deckId, 
        updateDeckDto, 
        userId
      );
      
      // Create response DTO
      const deckResponse = new DeckResponseDto(updatedDeck);

      return successResponse(
        res,
        { deck: deckResponse },
        'Deck updated successfully'
      );
    } catch (error) {
      if (error.statusCode === 404) {
        return notFoundResponse(res, error.message);
      }
      if (error.statusCode === 403) {
        return forbiddenResponse(res, error.message);
      }
      if (error.statusCode === 400) {
        return badRequestResponse(res, error.message);
      }
      return internalServerErrorResponse(res, error.message);
    }
  });

  /**
   * @route   DELETE /api/v1/decks/:deckId
   * @desc    Delete a deck
   * @access  Private (authenticated users only, must own the deck)
   */
  deleteDeck = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { deckId } = req.params;

    try {
      await this.deckService.deleteDeck(deckId, userId);
      
      // Create response DTO
      const deletionResponse = new DeckDeletionResponseDto(deckId);

      return successResponse(
        res,
        deletionResponse,
        'Deck deleted successfully'
      );
    } catch (error) {
      if (error.statusCode === 404) {
        return notFoundResponse(res, error.message);
      }
      if (error.statusCode === 403) {
        return forbiddenResponse(res, error.message);
      }
      return internalServerErrorResponse(res, error.message);
    }
  });

  /**
   * @route   PATCH /api/v1/decks/:deckId/activate
   * @desc    Set a deck as active (only one deck can be active at a time)
   * @access  Private (authenticated users only, must own the deck)
   */
  setActiveDeck = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { deckId } = req.params;

    try {
      const activeDeck = await this.deckService.setActiveDeck(deckId, userId);
      
      // Create response DTO
      const deckResponse = new DeckResponseDto(activeDeck);

      return successResponse(
        res,
        { deck: deckResponse },
        'Deck activated successfully'
      );
    } catch (error) {
      if (error.statusCode === 404) {
        return notFoundResponse(res, error.message);
      }
      if (error.statusCode === 403) {
        return forbiddenResponse(res, error.message);
      }
      return internalServerErrorResponse(res, error.message);
    }
  });

  /**
   * @route   GET /api/v1/decks/active
   * @desc    Get the currently active deck
   * @access  Private (authenticated users only)
   */
  getActiveDeck = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();

    try {
      const activeDeck = await this.deckService.getActiveDeck(userId);

      if (!activeDeck) {
        return successResponse(
          res,
          { deck: null },
          'No active deck found'
        );
      }
      
      // Create response DTO
      const deckResponse = new DeckResponseDto(activeDeck);

      return successResponse(
        res,
        { deck: deckResponse },
        'Active deck retrieved successfully'
      );
    } catch (error) {
      return internalServerErrorResponse(res, error.message);
    }
  });
}

module.exports = DeckController;
const InventoryService = require('../services/inventory.service');
const { InventoryResponseDto } = require('../dto/inventory.dto');
const { 
  successResponse,
  createdResponse,
  notFoundResponse, 
  internalServerErrorResponse 
} = require('../utils/response.util'); 

const inventoryService = new InventoryService();

class InventoryController {

  /**
   * @desc Get current user's inventory
   * @route GET /api/v1/inventory
   * @access Private
   */
  async getMyInventory(req, res) {
    try {
      const userId = req.user._id; // From authenticate middleware
      const inventory = await inventoryService.getUserInventory(userId);

      if (!inventory) {
        return notFoundResponse(res, 'Inventory not found for this user.');
      }

      const inventoryDto = new InventoryResponseDto(inventory);
      return successResponse(res, inventoryDto);
    } catch (error) {
      console.error('Get My Inventory Error:', error); // Added console.error for logging
      return internalServerErrorResponse(res, 'Failed to get inventory');
    }
  }

  /**
   * @desc Add a card to user's inventory
   * @route POST /api/v1/inventory/cards
   * @access Private
   */
  async addCardToInventory(req, res) {
    try {
      const userId = req.user._id;
      const { cardId, quantity } = req.body;
      
      const inventory = await inventoryService.addCard(userId, cardId, quantity);

      if (!inventory) {
        return notFoundResponse(res, 'Inventory not found. Cannot add card.');
      }

      const inventoryDto = new InventoryResponseDto(inventory);
      // Use 201 Created for a successful POST
      return createdResponse(res, inventoryDto, 'Card added successfully');
    } catch (error) {
      console.error('Add Card Error:', error);
      return internalServerErrorResponse(res, 'Failed to add card');
    }
  }

  /**
   * @desc Remove a card from user's inventory
   * @route DELETE /api/v1/inventory/cards/:cardId
   * @access Private
   */
  async removeCardFromInventory(req, res) {
    try {
      const userId = req.user._id;
      const { cardId } = req.params;
      const { quantity } = req.body; // quantity to remove

      const inventory = await inventoryService.removeCard(userId, cardId, quantity);

      if (!inventory) {
        return notFoundResponse(res, 'Inventory not found or card not owned.');
      }
      
      const inventoryDto = new InventoryResponseDto(inventory);
      // Use 200 OK for a successful DELETE that returns the updated state
      return successResponse(res, inventoryDto, 'Card removed successfully');
    } catch (error) {
      console.error('Remove Card Error:', error);
      return internalServerErrorResponse(res, 'Failed to remove card');
    }
  }

  /**
   * @desc Add a character to user's inventory
   * @route POST /api/v1/inventory/characters
   * @access Private
   */
  async addCharacterToInventory(req, res) {
    try {
      const userId = req.user._id;
      const { characterId } = req.body;
      
      const inventory = await inventoryService.addCharacter(userId, characterId);

      if (!inventory) {
        return notFoundResponse(res, 'Inventory not found. Cannot add character.');
      }

      const inventoryDto = new InventoryResponseDto(inventory);
      // Use 201 Created for a successful POST
      return createdResponse(res, inventoryDto, 'Character added successfully');
    } catch (error) {
      console.error('Add Character Error:', error);
      return internalServerErrorResponse(res, 'Failed to add character');
    }
  }
}

module.exports = new InventoryController();
/**
 * Formats a card from the inventory, merging card details with inventory data.
 */
class InventoryCardDto {
  constructor(inventoryCard) {
    // inventoryCard is { cardId: { ...Card doc... }, quantity: X, acquiredAt: Y }
    const cardDetails = (inventoryCard.cardId && inventoryCard.cardId.toObject)
      ? inventoryCard.cardId.toObject()
      : (inventoryCard.cardId || {});
    
    // Clean up internal Mongoose fields
    delete cardDetails.__v;

    return {
      ...cardDetails, // All fields from the Card model
      inventoryQuantity: inventoryCard.quantity, // Specific to this inventory
      acquiredAt: inventoryCard.acquiredAt // Specific to this inventory
    };
  }
}

/**
 * Formats a character from the inventory, merging character details with inventory data.
 */
class InventoryCharacterDto {
  constructor(inventoryCharacter) {
    // inventoryCharacter is { characterId: { ...Char doc... }, acquiredAt: Y }
    const charDetails = (inventoryCharacter.characterId && inventoryCharacter.characterId.toObject)
      ? inventoryCharacter.characterId.toObject()
      : (inventoryCharacter.characterId || {});

    // Clean up internal Mongoose fields
    delete charDetails.__v;
      
    return {
      ...charDetails, // All fields from the Character model
      acquiredAt: inventoryCharacter.acquiredAt // Specific to this inventory
    };
  }
}

/**
 * Full Inventory Response DTO
 */
class InventoryResponseDto {
  constructor(inventory) {
    this._id = inventory._id;
    this.userId = inventory.userId;
    this.cards = inventory.cards.map(c => new InventoryCardDto(c));
    this.characters = inventory.characters.map(c => new InventoryCharacterDto(c));
    this.createdAt = inventory.createdAt;
    this.updatedAt = inventory.updatedAt;
  }
}

module.exports = {
  InventoryResponseDto
};
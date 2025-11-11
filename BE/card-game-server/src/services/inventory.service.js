const InventoryRepository = require('../repositories/inventory.repository');
const mongoose = require('mongoose');
const { STARTER_PACK } = require('../constants/starter-pack');

// We'll need to create Character and Card models, but for now we'll mock the data
class InventoryService {
  constructor() {
    this.inventoryRepository = new InventoryRepository();
  }

  /**
   * Create starter pack for new user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Created inventory with starter pack
   */
  async createStarterPack(userId) {
    try {
      // Get random common character
      const starterCharacter = await this.getRandomStarterCharacter();
      
      // Get 15 random common cards
      const commonCards = await this.getRandomCards('common', STARTER_PACK.CARDS.distribution.common);
      
      // Get 5 random rare cards
      const rareCards = await this.getRandomCards('rare', STARTER_PACK.CARDS.distribution.rare);
      
      // Combine all cards
      const allCards = [...commonCards, ...rareCards];
      
      // Create inventory with starter items
      const inventory = await this.inventoryRepository.create(
        userId,
        allCards,
        [{ characterId: starterCharacter._id, acquiredAt: new Date() }]
      );

      console.log(`✅ Starter pack created for user ${userId}`);
      console.log(`   - 1 Character: ${starterCharacter.name}`);
      console.log(`   - ${STARTER_PACK.CARDS.distribution.common} Common Cards`);
      console.log(`   - ${STARTER_PACK.CARDS.distribution.rare} Rare Cards`);

      return inventory;
    } catch (error) {
      console.error('❌ Error creating starter pack:', error);
      throw new Error('Failed to create starter pack');
    }
  }

  /**
   * Get a random starter character (common rarity)
   * @returns {Promise<Object>} - Random common character
   */
  async getRandomStarterCharacter() {
    // TODO: Replace with actual database query once Character model is created
    // For now, return a mock character
    const Character = mongoose.model('Character');
    
    const characters = await Character.find({ rarity: 'common' });
    
    if (characters.length === 0) {
      throw new Error('No common characters available for starter pack');
    }

    // Select random character
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  }

  /**
   * Get random cards of specified rarity
   * @param {string} rarity - Card rarity
   * @param {number} count - Number of cards to get
   * @returns {Promise<Array>} - Array of {cardId, quantity}
   */
  async getRandomCards(rarity, count) {
    // TODO: Replace with actual database query once Card model is created
    const Card = mongoose.model('Card');
    
    const cards = await Card.find({ rarity });
    
    if (cards.length === 0) {
      throw new Error(`No ${rarity} cards available for starter pack`);
    }

    const selectedCards = [];
    
    // Select random cards (with possible duplicates)
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * cards.length);
      const card = cards[randomIndex];
      
      // Check if card already selected
      const existing = selectedCards.find(
        sc => sc.cardId.toString() === card._id.toString()
      );
      
      if (existing) {
        existing.quantity += 1;
      } else {
        selectedCards.push({
          cardId: card._id,
          quantity: 1,
          acquiredAt: new Date()
        });
      }
    }

    return selectedCards;
  }

  /**
   * Get user inventory
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User inventory
   */
  async getUserInventory(userId) {
    return await this.inventoryRepository.findByUserId(userId);
  }

  /**
   * Add card to user inventory
   * @param {string} userId - User ID
   * @param {string} cardId - Card ID
   * @param {number} quantity - Quantity
   * @returns {Promise<Object>} - Updated inventory
   */
  async addCard(userId, cardId, quantity = 1) {
    return await this.inventoryRepository.addCard(userId, cardId, quantity);
  }

  /**
   * Add character to user inventory
   * @param {string} userId - User ID
   * @param {string} characterId - Character ID
   * @returns {Promise<Object>} - Updated inventory
   */
  async addCharacter(userId, characterId) {
    return await this.inventoryRepository.addCharacter(userId, characterId);
  }

  /**
   * Check if user has sufficient cards/characters
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Inventory stats
   */
  async getInventoryStats(userId) {
    const cardCount = await this.inventoryRepository.getCardCount(userId);
    const characterCount = await this.inventoryRepository.getCharacterCount(userId);
    
    return {
      totalCards: cardCount,
      totalCharacters: characterCount
    };
  }
}

module.exports = InventoryService;
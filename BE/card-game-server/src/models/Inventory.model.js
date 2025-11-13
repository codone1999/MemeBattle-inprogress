const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cards: [{
      cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
      },
      acquiredAt: {
        type: Date,
        default: Date.now
      }
    }],
    characters: [{
      characterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character',
        required: true
      },
      acquiredAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

// Indexes - define ONLY here, not in field definitions
inventorySchema.index({ userId: 1 }, { unique: true });
inventorySchema.index({ 'cards.cardId': 1 });
inventorySchema.index({ 'characters.characterId': 1 });

// Method to check if user owns a card
inventorySchema.methods.ownsCard = function(cardId) {
  return this.cards.some(
    card => card.cardId.toString() === cardId.toString() && card.quantity > 0
  );
};

// Method to check if user owns a character
inventorySchema.methods.ownsCharacter = function(characterId) {
  return this.characters.some(
    character => character.characterId.toString() === characterId.toString()
  );
};

// Method to add a card to inventory
inventorySchema.methods.addCard = function(cardId, quantity = 1) {
  const existingCard = this.cards.find(
    card => card.cardId.toString() === cardId.toString()
  );
  
  if (existingCard) {
    existingCard.quantity += quantity;
  } else {
    this.cards.push({
      cardId,
      quantity,
      acquiredAt: new Date()
    });
  }
  
  this.updatedAt = new Date();
  return this.save();
};

// Method to add a character to inventory
inventorySchema.methods.addCharacter = function(characterId) {
  const existingCharacter = this.characters.find(
    character => character.characterId.toString() === characterId.toString()
  );
  
  if (!existingCharacter) {
    this.characters.push({
      characterId,
      acquiredAt: new Date()
    });
    this.updatedAt = new Date();
  }
  
  return this.save();
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
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

// Indexes
inventorySchema.index({ userId: 1 }, { unique: true });
inventorySchema.index({ 'cards.cardId': 1 });
inventorySchema.index({ 'characters.characterId': 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
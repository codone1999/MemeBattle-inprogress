const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema({
  deckTitle: {
    type: String,
    required: [true, 'Deck title is required'],
    trim: true,
    minlength: [1, 'Deck title must be at least 1 character'],
    maxlength: [50, 'Deck title cannot exceed 50 characters']
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  cards: {
    type: [{
      cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
        required: true
      },
      position: {
        type: Number,
        min: 0,
        default: 0
      }
    }],
    validate: {
validator: function(cards) {
        if (cards.length < 15 || cards.length > 30) {
          return false;
        }
        return true; 
      },
      message: 'Deck must contain 15-30 cards'
    },
    required: [true, 'Cards are required']
  },
  characterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Character',
    required: [true, 'Character is required']
  },
  
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // We're managing timestamps manually
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
deckSchema.index({ userId: 1, isActive: 1 });
deckSchema.index({ userId: 1, createdAt: -1 });

// Virtual for card count
deckSchema.virtual('cardCount').get(function() {
  return this.cards ? this.cards.length : 0;
});

// Middleware to update the updatedAt field before save
deckSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware to ensure only one active deck per user
deckSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    // This will be handled in the service layer with transactions
    // to avoid race conditions
  }
  next();
});

// Instance method to validate deck composition
deckSchema.methods.validateDeckComposition = function() {
  const errors = [];
  
  // Check card count
  if (this.cards.length < 15) {
    errors.push('Deck must have at least 15 cards');
  }
  if (this.cards.length > 30) {
    errors.push('Deck cannot have more than 30 cards');
  }
  
  // Check if character is set
  if (!this.characterId) {
    errors.push('Deck must have a character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Static method to get user's active deck
deckSchema.statics.getActiveDeck = function(userId) {
  return this.findOne({ userId, isActive: true })
    .populate('characterId')
    .populate('cards.cardId');
};

// Static method to count user's decks
deckSchema.statics.countUserDecks = function(userId) {
  return this.countDocuments({ userId });
};

const Deck = mongoose.model('Deck', deckSchema);

module.exports = Deck;
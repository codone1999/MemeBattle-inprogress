const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    power: {
      type: Number,
      required: true,
      min: 1
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      required: true
    },
    cardType: {
      type: String,
      enum: ['standard', 'buff', 'debuff'],
      required: true
    },
    pawnRequirement: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    pawnLocations: [{
      relativeX: {
        type: Number,
        required: true
      },
      relativeY: {
        type: Number,
        required: true
      },
      pawnCount: {
        type: Number,
        default: 1,
        min: 1,
        max: 1
      }
    }],
    ability: {
      abilityDescription: {
        type: String
      },
      abilityLocations: [{
        relativeX: {
          type: Number
        },
        relativeY: {
          type: Number
        }
      }],
      effectType: {
        type: String,
        enum: ['scoreBoost', 'scoreReduction', 'multiplier', 'conditional']
      },
      effectValue: {
        type: Number
      },
      condition: {
        type: String
      }
    },
    cardInfo: {
      type: String
    },
    cardImage: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes
cardSchema.index({ name: 1 });
cardSchema.index({ rarity: 1 });
cardSchema.index({ cardType: 1 });
cardSchema.index({ power: -1 });
cardSchema.index({ pawnRequirement: 1 });

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
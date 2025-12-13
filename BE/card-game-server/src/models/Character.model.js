const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    characterPic: {
      type: String,
      required: true
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      required: true
    },
    description: {
      type: String
    },
    abilities: {
      skillName: {
        type: String
      },
      skillDescription: {
        type: String
      },
      abilityType: {
        type: String,
        enum: ['passive', 'triggered', 'continuous']
      },
      effects: [{
        effectType: {
          type: String,
          enum: ['pawnBoost', 'scoreMultiplier', 'cardPowerBoost', 'extraDraw', 'placementBonus', 'specialCondition', 'debuffReduction']
        },
        value: {
          type: Number
        },
        condition: {
          type: String
        },
        target: {
          type: String
        }
      }]
    }
  },
  {
    timestamps: true
  }
);

// Indexes
characterSchema.index({ name: 1 });
characterSchema.index({ rarity: 1 });


const Character = mongoose.model('Character', characterSchema);

module.exports = Character;
const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  image: {
    type: String,
    required: true
  },
  themeColor: {
    type: String,
    default: '#4a90e2'
  },
  gridSize: {
    width: {
      type: Number,
      required: true,
      min: 3,
      max: 9
    },
    height: {
      type: Number,
      required: true,
      min: 3,
      max: 5
    }
  },
  specialSquares: [{
    _id: false, // Disable _id for subdocuments if not needed
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    },
    type: {
      type: String,
      enum: ['multiplier', 'bonus', 'restricted', 'special'],
      required: true
    },
    effect: {
      type: Object,
      default: {}
    }
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'easy',
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

const Map = mongoose.model('Map', mapSchema);

module.exports = Map;
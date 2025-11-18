const mongoose = require('mongoose');

/**
 * Game Model
 * Stores completed game records in MongoDB
 */
const gameSchema = new mongoose.Schema({
  lobbyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameLobby',
    required: true
  },
  
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true
    },
    characterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true
    },
    finalScore: {
      type: Number,
      required: true,
      min: 0
    },
    cardsPlayed: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  mapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Map',
    required: true
  },

  totalTurns: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ['completed', 'abandoned', 'draw'],
    required: true,
    default: 'completed'
  },

  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  gameDuration: {
    type: Number, // Duration in seconds
    required: true
  },

  finalBoardState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  startedAt: {
    type: Date,
    required: true
  },

  completedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
gameSchema.index({ status: 1 });
gameSchema.index({ 'players.userId': 1 });
gameSchema.index({ winner: 1 });
gameSchema.index({ createdAt: -1 });
gameSchema.index({ completedAt: -1 });
gameSchema.index({ lobbyId: 1 });

// Virtual for determining draw
gameSchema.virtual('isDraw').get(function() {
  return this.status === 'completed' && this.winner === null;
});

// Instance method to get player data
gameSchema.methods.getPlayerData = function(userId) {
  return this.players.find(p => p.userId.toString() === userId.toString());
};

// Instance method to check if user was in this game
gameSchema.methods.hasPlayer = function(userId) {
  return this.players.some(p => p.userId.toString() === userId.toString());
};

// Instance method to get opponent
gameSchema.methods.getOpponent = function(userId) {
  return this.players.find(p => p.userId.toString() !== userId.toString());
};

// Static method to get win/loss record between two players
gameSchema.statics.getHeadToHead = async function(userId1, userId2) {
  const games = await this.find({
    'players.userId': { $all: [userId1, userId2] },
    status: 'completed'
  });

  let user1Wins = 0;
  let user2Wins = 0;
  let draws = 0;

  games.forEach(game => {
    if (!game.winner) {
      draws++;
    } else if (game.winner.toString() === userId1.toString()) {
      user1Wins++;
    } else if (game.winner.toString() === userId2.toString()) {
      user2Wins++;
    }
  });

  return {
    totalGames: games.length,
    user1Wins,
    user2Wins,
    draws
  };
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
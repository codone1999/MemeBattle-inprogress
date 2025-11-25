const mongoose = require('mongoose');

const gameLobbySchema = new mongoose.Schema({
  hostUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hostDeckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    default: null // Explicitly null until selected
  },
  hostCharacterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Character',
    default: null, // Explicitly null until selected
    index: true
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
      default: null
    },
    characterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      default: null,
      index: true
    },
    isReady: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  mapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Map',
    required: true
  },
  lobbyName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  maxPlayers: {
    type: Number,
    default: 2,
    min: 2,
    max: 2
  },
  status: {
    type: String,
    enum: ['waiting', 'ready', 'started', 'cancelled'],
    default: 'waiting',
    index: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    default: null
  },
  gameSettings: {
    turnTimeLimit: {
      type: Number,
      default: 60,
      min: 30,
      max: 300
    },
    allowSpectators: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  startedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    index: true
  }
}, {
  timestamps: true
});

// ... (Indexes remain the same) ...

// Method to check if all players are ready
gameLobbySchema.methods.allPlayersReady = function() {
  return this.players.length === this.maxPlayers && 
         // Must have BOTH deckId and characterId manually selected
         this.players.every(p => p.isReady && p.deckId && p.characterId);
};

// Pre-save middleware to validate
gameLobbySchema.pre('save', function(next) {
  // Ensure host is in players array
  if (this.isNew) {
    const hostInPlayers = this.players.some(
      p => p.userId.toString() === this.hostUserId.toString()
    );
    
    if (!hostInPlayers) {
      this.players.unshift({
        userId: this.hostUserId,
        deckId: this.hostDeckId,       // Will be null initially
        characterId: this.hostCharacterId, // Will be null initially
        isReady: false,
        joinedAt: new Date()
      });
    }
  }
  next();
});

const GameLobby = mongoose.model('GameLobby', gameLobbySchema);
module.exports = GameLobby;
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
    default: null
  },
  hostCharacterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Character',
    default: null,
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
    default: () => new Date(Date.now() + 30 * 60 * 1000),
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Instance Methods
gameLobbySchema.methods.allPlayersReady = function() {
  return this.players.length === this.maxPlayers && 
         this.players.every(p => p.isReady && p.deckId && p.characterId);
};

gameLobbySchema.methods.hasPlayer = function(userId) {
  return this.players.some(
    p => p.userId.toString() === userId.toString()
  );
};

gameLobbySchema.methods.isHost = function(userId) {
  if (!this.hostUserId || !userId) return false;

  // Handles both populated (object) and non-populated (ObjectId) fields
  const hostId = this.hostUserId._id ? this.hostUserId._id : this.hostUserId;
  
  return hostId.toString() === userId.toString();
};

// Virtual property for checking if lobby is full
gameLobbySchema.virtual('isFull').get(function() {
  return this.players.length >= this.maxPlayers;
});

// Pre-save middleware
gameLobbySchema.pre('save', function(next) {
  if (this.isNew) {
    const hostInPlayers = this.players.some(
      p => p.userId.toString() === this.hostUserId.toString()
    );
    
    if (!hostInPlayers) {
      this.players.unshift({
        userId: this.hostUserId,
        deckId: this.hostDeckId,
        characterId: this.hostCharacterId,
        isReady: false,
        joinedAt: new Date()
      });
    }
  }
  next();
});

// Indexes
gameLobbySchema.index({ status: 1, isPrivate: 1, createdAt: -1 });
gameLobbySchema.index({ hostUserId: 1, status: 1 });
gameLobbySchema.index({ 'players.userId': 1 });
gameLobbySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const GameLobby = mongoose.model('GameLobby', gameLobbySchema);
module.exports = GameLobby;
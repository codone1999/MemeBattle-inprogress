const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4()
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9]+$/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30
    },
    stats: {
      winRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      totalGames: {
        type: Number,
        default: 0,
        min: 0
      },
      wins: {
        type: Number,
        default: 0,
        min: 0
      },
      losses: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    gameHistory: [{
      gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
      },
      opponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      result: {
        type: String,
        enum: ['win', 'loss', 'draw']
      },
      playedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isOnline: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    profilePic: {
      type: String,
      default: null
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
userSchema.index({ uid: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ 'stats.winRate': -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });

// Update winRate whenever wins or losses change
userSchema.pre('save', function(next) {
  if (this.isModified('stats.wins') || this.isModified('stats.losses')) {
    const totalGames = this.stats.wins + this.stats.losses;
    this.stats.totalGames = totalGames;
    this.stats.winRate = totalGames > 0 ? (this.stats.wins / totalGames) * 100 : 0;
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
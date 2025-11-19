const mongoose = require('mongoose');

// Function to generate 6-digit UID
const generateUID = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      index: true,
      default: generateUID()
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
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
    // NEW: Coins for gacha
    coins: {
      type: Number,
      default: 0,
      min: 0
    },
    // Gacha pity counters
    gachaPity: {
      totalPulls: {
        type: Number,
        default: 0
      },
      pullsSinceLastEpic: {
        type: Number,
        default: 0
      },
      pullsSinceLastLegendary: {
        type: Number,
        default: 0
      }
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
    gameHistory: [
      {
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
      }
    ],
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
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    }
  },
  {
    timestamps: true
  }
);
// Indexes
userSchema.index({ uid: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isOnline: 1 });
userSchema.index({ 'stats.winRate': -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to ensure unique UID
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.uid) {
    // Generate unique UID
    let isUnique = false;
    while (!isUnique) {
      this.uid = generateUID();
      const existingUser = await mongoose.model('User').findOne({ uid: this.uid });
      if (!existingUser) {
        isUnique = true;
      }
    }
  }

  // Update winRate whenever wins or losses change
  if (this.isModified('stats.wins') || this.isModified('stats.losses')) {
    const totalGames = this.stats.wins + this.stats.losses;
    this.stats.totalGames = totalGames;
    this.stats.winRate = totalGames > 0 ? (this.stats.wins / totalGames) * 100 : 0;
  }
  
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;